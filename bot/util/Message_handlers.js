const Admin = require('../../models/Admin.model');
const Employee = require('../../models/Employee.model')
const Holiday = require('../../models/Holiday.model')
const Leave = require('../../models/Leaves.model');
const EmployeeService = require('./Employee_service');
const AdminService = require('./Admin_service');
const moment = require('moment')
const tz = require('moment-timezone');

const leaveConstants = require('../../constants/Leave.constants');

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
                        name: msg.from.first_name 
                    })
                },
                {
                    text: 'Decline',
                    callback_data: JSON.stringify({
                        query: 'reject-new-user',
                        user: msg.from.id,
                        name: msg.from.first_name
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
        var now = moment(msg.date * 1000).tz('Asia/Colombo');
        var goal = moment().tz('Asia/Colombo').hours(10).minutes(15)

        if(now.isAfter(goal)) {
            var late = Math.floor(now.diff(goal)/1000/60);
            bot.sendMessage(msg.from.id, `Your attendance is marked at ${now.format("HH:mm")}, and marked late by ${late} minutes.`);
            await AdminService.broadcastMessage(bot, `${msg.from.first_name} has logged in at ${now.format("HH:mm")} and marked late by ${late} minutes.`)
        } else {
            bot.sendMessage(msg.from.id, `Your attendence is marked at ${now.format("HH:mm")}.`);
            await AdminService.broadcastMessage(bot, `${msg.from.first_name} has logged in at ${now.format("HH:mm")}.`)
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
        EmployeeService.logOutEmployee(bot, employee)
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
                date = moment(date, "DD/MM/YYYY");
                await new Holiday({
                    name: message, 
                    date
                }).save();
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
            var holidays = await Holiday.find({}).sort({date: 1});
            var holiday_table = "";
            for(holiday of holidays){
                holiday_table += `${moment(holiday.date).format("DD/MM/YY")} - ${holiday.name}\n`
            }
            await bot.sendMessage(msg.from.id, (holiday_table.length > 0 ? holiday_table : 'No holidays have been added yet.'))
    }
}

async function handleNotice(bot, msg){
    var text = msg.text.split(' ');
    text.shift();
    if(text.length > 0){
        text = text.join(' ')
        await EmployeeService.broadcastMessageToEmployees(bot, `📣 Notice: ${text}`)
    }
    bot.sendMessage(msg.from.id, "Message has been sent.")
}

const leaveQueue = {};
async function handleApplyLeave(bot, msg){
    const opts = {
        reply_markup: JSON.stringify({
          keyboard: [
            ['Half Day'],
            ['Full Day'],
            ['Work from home'],
            ['Leave w/o pay'],
            ['Cancel']
          ],
          one_time_keyboard: true
        }),
      };
      leaveQueue[msg.from.id] = true;
      bot.sendMessage(msg.from.id, "Pick an option.", opts);
};

const leaveQuestionarieQueue = {};
const leaves = {};
async function handleSelectLeave(bot, msg){

    if(leaveQueue[msg.from.id]){
        delete leaveQueue[msg.from.id];
        if(msg.text.toLowerCase() !== 'cancel'){
            leaves[msg.from.id] = {type: msg.text};
            leaveQuestionarieQueue[msg.from.id] = true;
            bot.sendMessage(msg.from.id, "Select date or timerange. Date must be in the format DD/MM/YY, timeranges must be in the format DD/MM/YY DD/MM/YY.")
        }
    }
}

const d = {test: '123'};
async function handleLeaveDate(bot, msg){
    if(leaveQuestionarieQueue[msg.from.id]){
        delete leaveQuestionarieQueue[msg.from.id];
        const dates = msg.text.split(' ');
        var valid = true;
        for(date of dates) if(!moment(date, "DD/MM/YYYY").isValid()) valid = false;
        if(valid){
            var date1 = moment(dates[0], "DD/MM/YY");
            var date2 = null;
            if(dates.length === 2)  date2 = moment(dates[1], "DD/MM/YY");
            leaves[msg.from.id]['date1'] = date1;
            leaves[msg.from.id]['date2'] = date2;

            d[msg.from.id] = true;
            bot.sendMessage(msg.from.id, "Enter the details of your leave with the following format \/details [your leave's details]")

        } else {
            bot.sendMessage(msg.from.id, "Date(s) must be valid.");
        }
    }
}

async function handleDetails(bot, msg){
    if(d[msg.from.id]){
        
        var details = msg.text.split(' ');
        details.shift();
        details = details.join(' ');

        var employee_id = await Employee.find({tg_id: msg.from.id});
        employee_id = employee_id._id;

        var date1 = leaves[msg.from.id]['date1'];
        var date2 = leaves[msg.from.id]['date2'];
        var type = leaveConstants.LEAVE_TO_NUMBER[leaves[msg.from.id]['type'].toLowerCase()]
        const leave = new Leave({
            date1,
            date2,
            type,
            details,
            employee: employee_id
        })

        var id = await leave.save();
        id = id._id;
        console.log(id);

        const opts = {
            reply_markup: JSON.stringify({
                inline_keyboard: [[
                    {
                        text: 'Accept',
                        callback_data: JSON.stringify({
                            query: 'accept-leave',
                            request_id: id
                        })
                    },
                    {
                        text: 'Decline',
                        callback_data: JSON.stringify({
                            query: 'reject-leave',
                            request_id: id
                        })
                    }
                ]]
            })
          };
          
          AdminService.broadcastMessage(bot, `${msg.from.first_name} has requested a leave:\n
          type: ${leaves[msg.from.id]['type']}\n
          date: ${leaves[msg.from.id]['date1'].format("DD/MM/YY")} ${(leaves[msg.from.id]['date2'] !== null ? 'to '+ leaves[msg.from.id]['date2'].format("DD/MM/YY") : "")}\n
          deatils: ${details}`, opts);
          delete d[msg.from.id]
          delete leaves[msg.from.id];
    }
}
module.exports = {handleStartMessage, handleClockIn, handleClockOut, handleAdminHolidays, handleAddNew, handleDate, handleViewHolidays, handleNotice, handleApplyLeave, handleSelectLeave, handleLeaveDate, handleDetails};