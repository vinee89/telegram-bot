const Employee = require('../../models/Employee.model');
const AdminService = require('./Admin_service')
const moment = require('moment');
const tz = require('moment-timezone')

/**
 * Checks if the employee is registered in the database.
 * @param {Number} id 
 * @return if user exists or not.
 */
async function isRegistered(id){
    var exists = await Employee.findOne({tg_id: id});
    return exists !== null;
}

/**
 * Rgeisters a new Employee in the database.
 * @param {Number} tg_id 
 * @param {String} first_name 
 * @param {String} username 
 */
async function registerNewEmployee(tg_id, first_name, username){

    var new_employee = new Employee({
        tg_id, first_name, username
    });
    await new_employee.save();
}

async function isCheckedIn(id){
    var emp =  await Employee.findOne({tg_id: id});
    return emp.checked_in;
}

async function broadcastMessageToEmployees(bot, msg){
    var employees = await Employee.find({});
    for(employee of employees){
        bot.sendMessage(employee.tg_id, msg);
    }

}

async function logOutEmployee(bot, employee){
    var check_in = employee.last_checked_in;
    var check_in_moment = moment(check_in.getTime()).tz('Asia/Colombo');

    var now = moment().tz('Asia/Colombo');
    var diff = moment.utc(moment(now,"DD/MM/YYYY HH:mm:ss").diff(moment(check_in_moment,"DD/MM/YYYY HH:mm:ss")));

    bot.sendMessage(employee.tg_id, `You have been logged out at ${now.format("HH:mm")}. You worked for ${diff.hours()} hours and ${diff.minutes()} minutes.`);
    AdminService.broadcastMessage(bot, `${employee.first_name} has logged out at ${now.format("HH:mm")}. Total worked for ${diff.hours()} hours and ${diff.minutes()} minutes.`)

    await Employee.updateOne({tg_id: employee.tg_id}, {checked_in: false})
    await Employee.updateOne({tg_id: employee.tg_id}, {last_checked_in: new Date()})
}
module.exports = {isRegistered, registerNewEmployee, isCheckedIn, broadcastMessageToEmployees, logOutEmployee};