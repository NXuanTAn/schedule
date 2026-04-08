const mongoose = require('mongoose');
require('dotenv').config(); // Nạp biến môi trường từ .env

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        
        console.log(`--- KẾT NỐI DATABASE ---`);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`✅ Database Name: ${conn.connection.name}`);
    } catch (err) {
        console.error(`❌ Lỗi kết nối MongoDB: ${err.message}`);
        // Thoát ứng dụng nếu không kết nối được DB
        process.exit(1);
    }
};

module.exports = connectDB;