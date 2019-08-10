const Admin = require('../../models/Admin.model');

async function broadcastMessage(bot, msg){
    
    var admins = await Admin.find({});

    for(admin of admins){
        bot.sendMessage(admin.tg_id, msg);
    }
}

module.exports = {broadcastMessage};