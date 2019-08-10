const Admin = require('../../models/Admin.model');
const Employee = require('../../models/Employee.model')
const Holiday = require('../../models/Holiday.model')
const EmployeeService = require('./Employee_service');
const AdminService = require('./Admin_service');
const moment = require('moment')
const tz = require('moment-timezone');

/// These objects are used as maps to maintain conversation with the users.
/// The idea was taken from https://github.com/yagop/node-telegram-bot-api/issues/197#issuecomment-251189417
adminHolidays = {};
addHoliday = {};

/**
 * When an employee types /start the bot sends a message to all of the admins
 * asking if they want to register this user. In case the user is already registered
 * it informs about it.
 * 
 * @param {Telgeram Bot} bot 
 * @param {Telegram Message} msg 
 */
async function handleStartMessage(bot, msg){
    const admins = await Admin.find();
    /// The inline keyboard displays buttons for the admins to accept/decline.
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

/**
 * When the users calls /clockin the bot sends registers its arrive time in case
 * the user didn't already call clockin. In case he did, the bot informs the user about it.
 * 
 * Also if the user is late it informs it.
 * 
 * All the admins are notified when a user runs this command.
 * @param {Telegram Bot} bot 
 * @param {Telegram Message} msg 
 */
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

/**
 * When the user calls this command he is logged out, the bot calculates the work hours
 * he did during that period.
 * 
 * All the admins are notified when the user calls this command.
 * 
 * @param {TelegramBot} bot 
 * @param {TelegramMessage} msg 
 */
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

/**
 * Lets the admin add a new holiday.
 * 
 * @param {TelegramBot} bot 
 * @param {TelegramMessage} msg 
 */
async function handleAdminHolidays(bot, msg){
    const opts = {
        reply_markup: JSON.stringify({
          keyboard: [
            ['Add new'],
            ['View All']
          ],
          one_time_keyboard: true
        }),
      };
    adminHolidays[msg.from.id] = true;
    bot.sendMessage(msg.from.id,"Pick an option",opts)
}

/**
 * Sends a message to the admin informing about the format of the holiday that will be added.
 * 
 * @param {TelegramBot} bot 
 * @param {TelegeramMessage} msg 
 */
async function handleAddNew(bot, msg){

    if(adminHolidays[msg.from.id]){
        delete adminHolidays[msg.from.id];
        bot.sendMessage(msg.from.id, "Enter the holiday information in the format of '[DD/MM/YYYY] [name of the event]'. The message must be sent without '[ ]' and ''.\n\n\nDD: days\nMM: month number\nYYYY: year (four digits)");
        addHoliday[msg.from.id] = true;
    }
}

/**
 * Adds the event in case it is formatted properly.
 * 
 * @param {TelegramBot} bot 
 * @param {TelegramMessage} msg 
 */
async function handleDate(bot, msg){
    if(addHoliday[msg.from.id]){
        var dateRegex = /\d\d\/\d\d\/\d\d\d\d/;
        var date = dateRegex.exec(msg.text)[0];
        var message = (msg.text.length > 10 ? msg.text.substring(10) : null);
        message = (message !== null ? message.trim() : message);
        if(moment(date, "DD/MM/YYYY").isValid()){
            if(message && message.length > 0){
                delete addHoliday[msg.from.id];
                await new Holiday({name: message, date: moment(date, "DD/MM/YYYY").format("MM/DD/YYYY")}).save();
                bot.sendMessage(msg.from.id, `The event ${message} has been added.`);
            } else {
                bot.sendMessage(msg.from.id, "You must include a name for the holiday.")
            }
        } else {
            bot.sendMessage(msg.from.id, "The date is not valid.")
        }
    }
}

/**
 * Displays all the available events.
 * 
 * @param {TelegramBot} bot 
 * @param {TelegramMessage} msg 
 */
async function handleViewHolidays(bot , msg){
    if((AdminService.isRegistered(msg.from.id) && adminHolidays[msg.from.id] ||
        EmployeeService.isRegistered(msg.from.id))){
            delete adminHolidays[msg.from.id];
            var holidays = await Holiday.find({});
            var holiday_table = "";
            for(holiday of holidays){
                holiday_table += `${moment(holiday.date).format("DD/MM/YY")} - ${holiday.name}\n`
            }
            bot.sendMessage(msg.from.id, (holiday_table.length > 0 ? holiday_table : 'No holidays have been added yet.'))
    }
}
module.exports = {handleStartMessage, handleClockIn, handleClockOut, handleAdminHolidays, handleAddNew, handleDate, handleViewHolidays};