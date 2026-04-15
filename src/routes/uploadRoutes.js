const express = require('express');
const router = express.Router();
const multer = require('multer');
const { processExcel, getSchedule, saveToken } = require('../controllers/uploadController');

// Cấu hình lưu tạm file
const upload = multer({ dest: 'uploads/' });

router.get('/get-schedule', getSchedule);
router.post('/upload-schedule', upload.single('file'), processExcel);

router.post('/save-token', saveToken);

module.exports = router;