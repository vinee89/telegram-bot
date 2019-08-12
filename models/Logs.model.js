const mongoose = require('mongoose');
const Employee = require('./Employee.model')
const LogSchema = new mongoose.Schema({
    employee: {type: mongoose.Schema.Types.ObjectId, ref: 'employee'},
    start: Date,
    end: Date,
    hours_total: Number,
    minutes_total: Number
})

module.exports = mongoose.model("log", LogSchema);