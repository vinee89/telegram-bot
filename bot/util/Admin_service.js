const Admin = require('../../models/Admin.model');

async function broadcastMessage(bot, msg){
    
    var admins = await Admin.find({});

    for(admin of admins){
        bot.sendMessage(admin.tg_id, msg);
    }
}

async function isRegistered(id){
    var exists = await Admin.findOne({tg_id: id});
    return exists !== null;
}

module.exports = {broadcastMessage, isRegistered};