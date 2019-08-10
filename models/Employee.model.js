const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
    tg_id: Number,
    first_name: String,
    username: {
        type: String,
        default: null
    },
    checked_in: Boolean
})

module.exports = mongoose.model('employee', EmployeeSchema);