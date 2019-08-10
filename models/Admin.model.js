const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
    tg_id: Number,
    first_name: String,
    username: String
})

module.exports = mongoose.model('admin', AdminSchema);