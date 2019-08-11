const Admin = require('../../models/Admin.model');

async function broadcastMessage(bot, msg, opts = null){
    
    var admins = await Admin.find({});

    for(admin of admins){
        if(opts === null) bot.sendMessage(admin.tg_id, msg);
        else bot.sendMessage(admin.tg_id, msg, opts);
    }
}

async function isRegistered(id){
    var exists = await Admin.findOne({tg_id: id});
    return exists !== null;
}

module.exports = {broadcastMessage, isRegistered};