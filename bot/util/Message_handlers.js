const Admin = require('../../models/Admin.model');
const Employee = require('../../models/Employee.model')
const EmployeeService = require('./Employee_service');
const AdminService = require('./Admin_service');
const moment = require('moment')
const tz = require('moment-timezone')

async function handleStartMessage(bot, msg){
    const admins = await Admin.find();
    const opts = {
        reply_markup: JSON.stringify({
            inline_keyboard: [[
                {
                    text: 'Accept',
                    callback_data: JSON.stringify({
                        query: 'accept-new-user',
                        user: msg.from.id,
                        name: msg.from.first_name,
                        username: msg.from.username
                    })
                },
                {
                    text: 'Decline',
                    callback_data: JSON.stringify({
                        query: 'reject-new-user',
                        user: msg.from.id,
                        name: msg.from.first_name,
                        username: msg.from.username
                    })
                }
            ]]
        })
      };
    
    if(await EmployeeService.isRegistered(msg.from.id)){
        bot.sendMessage(msg.from.id, "You are registered");
    } else {
        await bot.sendMessage(msg.from.id, "You're not registered yet. Waiting for admins to answer your request.")
        var message = `${msg.from.first_name}, whose username is ${msg.from.username}, wants to join, his/her id is ${msg.from.id}`
        for(admin of admins){
            bot.sendMessage(admin.tg_id, message, opts);
        }
    }
}

async function handleClockIn(bot, msg){

    if(await EmployeeService.isCheckedIn(msg.from.id) === false){
        var now = moment(msg.date * 1000);
        var goal = moment().hours(10).minutes(15)

        if(now.isAfter(goal)) {
            var late = Math.floor(now.diff(goal)/1000/60);
            bot.sendMessage(msg.from.id, `Your attendance is marked at ${now.format("HH:mm")}, and marked late by ${late} minutes.`);
            await AdminService.broadcastMessage(bot, `${msg.from.first_name} has logged in at ${now.format("hh:mm")} and marked late by ${late} minutes.`)
        } else {
            bot.sendMessage(msg.from.id, `Your attendence is market at ${now.format("HH:mm")}.`);
            await AdminService.broadcastMessage(bot, `${msg.from.first_name} has logged in at ${now.format("hh:mm")}.`)
        }
        await Employee.updateOne({tg_id: msg.from.id}, {checked_in: true})
        await Employee.updateOne({tg_id: msg.from.id}, {last_checked_in: new Date()})
    } else {
        bot.sendMessage(msg.from.id, `Oops! You're already clocked-in, did you mean /clockout ?`)
    }
}

async function handleClockOut(bot, msg){

    if(await EmployeeService.isCheckedIn(msg.from.id) === true){
        var employee = await Employee.findOne({tg_id: msg.from.id});
        var check_in = employee.last_checked_in;
        var check_in_moment = moment(check_in.getTime()).tz('Asia/Colombo');

        var now = moment().tz('Asia/Colombo');
        var diff = moment.utc(moment(now,"DD/MM/YYYY HH:mm:ss").diff(moment(check_in_moment,"DD/MM/YYYY HH:mm:ss")));

        bot.sendMessage(msg.from.id, `You have been logged out at ${now.format("HH:mm")}. You worked for ${diff.hours()} hours and ${diff.minutes()} minutes.`);
        AdminService.broadcastMessage(bot, `${msg.from.first_name} has logged out at ${now.format("HH:mm")}. Total worked for ${diff.hours()} hours and ${diff.minutes()} minutes.`)

        await Employee.updateOne({tg_id: msg.from.id}, {checked_in: false})
        await Employee.updateOne({tg_id: msg.from.id}, {last_checked_in: new Date()})
    } else {
        bot.sendMessage(msg.from.id, `Oops! You're not logged in today, click /clockin to first log-in.`)
    }
}

module.exports = {handleStartMessage, handleClockIn, handleClockOut};