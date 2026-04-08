const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
    data: {
        type: Array,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Schedule', ScheduleSchema);