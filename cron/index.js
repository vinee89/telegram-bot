const cron = require('node-cron');
const Employee = require('../models/Employee.model');
const EmployeeService = require('../bot/util/Employee_service');

function init(bot){
    cron.schedule("15 10 * * 1-7", async function(){
        const employees = await Employee.find({checked_in: false});
        for(employee of employees){
            bot.sendMessage(employee.tg_id, 'Reminder to /clockin, are you running late? /sendmessage /applyleave')
        }
    }, {timezone: "Asia/Colombo"})

    cron.schedule("15 19 * * 1-7", async function(){
        const employees = await Employee.find({checked_in: false});
        for(employee of employees){
            bot.sendMessage(employee.tg_id, 'You havent logged out yet, do you want to /clockout ?')
        }
    })

    cron.schedule("0 21 * * 1-6", async function(){
        const employees = await Employee.find({checked_in: false});
        for(employee of employees){
            EmployeeService.logOutEmployee(employee);
        }
    })
}

module.exports = {init}


