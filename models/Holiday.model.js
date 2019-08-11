const mongoose = require('mongoose');

const HolidaySchema = new mongoose.Schema({
    name: String,
    date: Date
}, {autoIndex: false})

HolidaySchema.index({date: 1});

module.exports = mongoose.model("holiday", HolidaySchema);