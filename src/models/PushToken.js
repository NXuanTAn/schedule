const mongoose = require('mongoose');

const PushTokenSchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true },
    platform: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PushToken', PushTokenSchema);