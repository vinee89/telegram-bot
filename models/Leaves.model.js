const mongoose = require('mongoose');

const LeaveSchema = mongoose.Schema({
    date1: Date,
    date2: Date,
    type: Number,
    details: String,
    status: {
        default: 0,
        type: Number
    },
    employee: {type: mongoose.Schema.Types.ObjectId, ref: 'employee'}
})

module.exports = mongoose.model("leave", LeaveSchema);