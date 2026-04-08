const xlsx = require('xlsx');
const Schedule = require('../models/Schedule');

const processExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Không có file nào được tải lên.' });
        }

        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        let finalResult = [];
        let currentDay = null;
        let currentSession = null;

        // Bắt đầu quét từ dòng chứa dữ liệu (thường là dòng 3 hoặc 4 tùy file)
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            const firstCol = String(row[0] || '').trim();

            // Nhận diện dòng Tiêu đề Ngày (Ví dụ: "Thứ 2, 06/04/2026")
            if (firstCol.includes('Thứ') || firstCol.includes('Chủ nhật')) {
                currentDay = {
                    date: firstCol,
                    sessions: []
                };
                finalResult.push(currentDay);
                currentSession = null; 
                continue;
            }

            // Nhận diện Buổi (Sáng/Chiều)
            if (firstCol === 'Sáng' || firstCol === 'Chiều') {
                currentSession = {
                    period: firstCol,
                    events: []
                };
                if (currentDay) {
                    currentDay.sessions.push(currentSession);
                }
            }

            // Nhận diện Sự kiện (Cột B có thời gian)
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

        // Lưu vào Database Atlas
        await Schedule.deleteMany({}); // Xóa lịch cũ để luôn cập nhật mới nhất
        const newSchedule = new Schedule({ data: finalResult });
        await newSchedule.save();

        console.log("--- DỮ LIỆU ĐÃ LƯU ATLAS ---");
        console.log(JSON.stringify(finalResult, null, 2));

        res.status(200).json({ message: "Cập nhật thành công", data: finalResult });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi xử lý file Excel", error: error.message });
    }
};

const getSchedule = async (req, res) => {
    try {
        const schedule = await Schedule.findOne().sort({ createdAt: -1 });
        if (!schedule) {
            return res.json([]);
        }
        res.json(schedule.data);
    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy dữ liệu", error: error.message });
    }
};

module.exports = { processExcel, getSchedule };