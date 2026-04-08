require('dotenv').config(); // Phải đặt dòng này ở đầu file
const express = require('express');
const connectDB = require('./src/config/db');
const uploadRoutes = require('./src/routes/uploadRoutes');
const cors = require('cors');

const app = express();

// Kết nối Database
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', uploadRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy trên cổng: ${PORT}`);
    console.log(`👉 API Upload: http://localhost:${PORT}/api/upload-schedule`);
});