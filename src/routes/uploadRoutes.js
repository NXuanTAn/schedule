const express = require('express');
const router = express.Router();
const multer = require('multer');
const { processExcel, getSchedule } = require('../controllers/uploadController');

// Cấu hình lưu tạm file
const upload = multer({ dest: 'uploads/' });

router.get('/get-schedule', getSchedule);
router.post('/upload-schedule', upload.single('file'), processExcel);

module.exports = router;