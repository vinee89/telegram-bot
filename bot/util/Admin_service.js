const Admin = require('../../models/Admin.model');
const moment = require('moment');
const Log = require('../../models/Logs.model');
const Employee = require('../../models/Employee.model');
const AsciiTable = require('ascii-table')
const tz = require('moment-timezone')

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

async function generateDayReport(bot, msg, date, query = null){
    var startd = moment(date).tz('Asia/Colombo').startOf('day');
    var end = moment(date).tz('Asia/Colombo').endOf('day')
        const opts = {
            parse_mode: 'HTML',
            reply_markup: JSON.stringify({
                inline_keyboard: [[
                    {
                        text: 'Previous-day',
                        callback_data: JSON.stringify({
                            query: 'previous-day',
                            date: moment(date).add(-1,'days')
                        })
                    },
                    {
                        text: 'Next-day',
                        callback_data: JSON.stringify({
                            query: 'next-day',
                            date: moment(date).add(1,'days')
                        })
                    }
                ]]
            })
        };
        var logs = await Log.find({start: {$gte: startd, $lt: end}}).populate('employee');
        var message = "<pre>";
        var table =  new AsciiTable(`Attendance for ${startd.date()}/${startd.month()+1}/${startd.year()}`);
        table.setHeading('User', 'clockin', 'clockout', 'total');
        
        for(log of logs){
            table.addRow(log.employee.first_name, moment(log.start).format("HH:mm"), moment(log.end).format("HH:mm"), `${log.hours_total} hours`)
        }

        message += (logs.length > 0? table.toString() : `No messages found for for ${startd.date()}/${startd.month() + 1}/${startd.year()}`);
        message += "</pre>";

        if(!query){
            bot.sendMessage(msg.from.id, message, opts);
        } else {
            opts.chat_id = query.message.chat.id,
            opts.message_id = query.message.message_id
            try{
                bot.editMessageText(message, opts)
            } catch (e){
                console.log("Error while editing message");
            }
        }
}

module.exports = {broadcastMessage, isRegistered, generateDayReport};