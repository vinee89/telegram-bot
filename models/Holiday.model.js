const mongoose = require('mongoose');

const HolidaySchema = new mongoose.Schema({
    name: String,
    date: Date
})

module.exports = mongoose.model("holiday", HolidaySchema);