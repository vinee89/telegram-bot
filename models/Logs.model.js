const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
    employee: {type: mongoose.Schema.Types.ObjectId, ref: 'Employee'},
    type: Number,
    month: Number,
    description: String
})

module.exports = mongoose.model("log", LogSchema);