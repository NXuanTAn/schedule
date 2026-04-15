const xlsx = require('xlsx');
const Schedule = require('../models/Schedule');
const PushToken = require('../models/PushToken');
const { Expo } = require('expo-server-sdk');

// Khởi tạo SDK gửi thông báo
const expo = new Expo();

const processExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Không có file nào được tải lên.' });
        }

        // 1. Đọc và phân tích file Excel
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        let finalResult = [];
        let currentDay = null;
        let currentSession = null;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            const firstCol = String(row[0] || '').trim();

            if (firstCol.includes('Thứ') || firstCol.includes('Chủ nhật')) {
                currentDay = {
                    date: firstCol,
                    sessions: []
                };
                finalResult.push(currentDay);
                currentSession = null;
                continue;
            }

            if (firstCol === 'Sáng' || firstCol === 'Chiều') {
                currentSession = {
                    period: firstCol,
                    events: []
                };
                if (currentDay) {
                    currentDay.sessions.push(currentSession);
                }
            }

            const timeVal = row[1];
            if (timeVal && currentSession) {
                currentSession.events.push({
                    time: String(timeVal).trim(),
                    content: String(row[2] || '').trim(),
                    host: String(row[3] || '').trim(),
                    participants: String(row[4] || '').trim(),
                    location: String(row[5] || '').trim(),
                    note: String(row[6] || '').trim()
                });
            }
        }

        // 2. Lưu vào Database Atlas
        await Schedule.deleteMany({});
        const newSchedule = new Schedule({ data: finalResult });
        await newSchedule.save();

        // 3. XỬ LÝ GỬI THÔNG BÁO TỰ ĐỘNG
        const pushTokens = await PushToken.find();
        if (pushTokens.length > 0) {
            let messages = [];
            for (let pushToken of pushTokens) {
                if (!Expo.isExpoPushToken(pushToken.token)) continue;

                messages.push({
                    to: pushToken.token,
                    sound: 'default',
                    title: 'Lịch công tác mới 📅',
                    body: 'UBND Phường đã cập nhật lịch công tác tuần mới. Mời lãnh đạo xem chi tiết.',
                    badge: 1,
                    data: { type: 'RELOAD_SCHEDULE' },
                });
            }

            // Expo yêu cầu chia nhỏ danh sách (chunks) để gửi hiệu quả
            let chunks = expo.chunkPushNotifications(messages);
            for (let chunk of chunks) {
                try {
                    await expo.sendPushNotificationsAsync(chunk);
                } catch (sendError) {
                    // Ghi nhận lỗi gửi thông báo nhưng không làm dừng quy trình của API
                }
            }
        }

        return res.status(200).json({ 
            message: "Cập nhật thành công và đã gửi thông báo.", 
            count: pushTokens.length 
        });

    } catch (error) {
        return res.status(500).json({ 
            message: "Lỗi hệ thống khi xử lý file và thông báo.", 
            error: error.message 
        });
    }
};

const saveToken = async (req, res) => {
    try {
        const { token, platform } = req.body;
        
        if (!token || !Expo.isExpoPushToken(token)) {
            return res.status(400).json({ message: "Mã Token không hợp lệ." });
        }

        // Sử dụng updateOne với upsert để tối ưu, không tạo trùng lặp
        await PushToken.updateOne(
            { token: token },
            { 
                $set: { 
                    platform: platform || 'unknown',
                    lastActive: new Date()
                } 
            },
            { upsert: true }
        );

        return res.status(200).json({ message: "Đăng ký nhận thông báo thành công." });
    } catch (error) {
        return res.status(500).json({ 
            message: "Lỗi khi lưu mã định danh thông báo.", 
            error: error.message 
        });
    }
};

const getSchedule = async (req, res) => {
    try {
        const schedule = await Schedule.findOne().sort({ createdAt: -1 });
        if (!schedule) {
            return res.json([]);
        }
        return res.json(schedule.data);
    } catch (error) {
        return res.status(500).json({ 
            message: "Lỗi khi truy xuất dữ liệu lịch công tác.", 
            error: error.message 
        });
    }
};

module.exports = { processExcel, getSchedule, saveToken };