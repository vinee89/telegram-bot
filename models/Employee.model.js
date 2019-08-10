const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
    tg_id: Number,
    first_name: String,
    username: {
        type: String,
        default: null
    },
    checked_in: {
        type: Boolean,
        default: false
    },
    last_checked_in: {
        type: Date,
        default: null
    },
    last_checked_out: {
        type: Date,
        default: null
    }
})

module.exports = mongoose.model('employee', EmployeeSchema);