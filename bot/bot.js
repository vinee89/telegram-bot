const EmployeeService = require('./util/Employee_service');
const AdminService = require('./util/Admin_service')
const MessageHandlder = require('./util/Message_handlers')
process.env.NTBA_FIX_319 = 1;


module.exports.initBot = function(bot)
{
    const dateRegex = /\d\d\/\d\d\/\d\d\d\d (.)*/
    bot.on('message', async function(msg){

        msg.text.toLowerCase()
        var isAdmin = await AdminService.isRegistered(msg.from.id);
        var isEmployee = await EmployeeService.isRegistered(msg.from.id)
        if(msg.text.startsWith('/start') &&  !isAdmin) {
            await MessageHandlder.handleStartMessage(bot, msg);
        } else if(isEmployee){
            if(msg.text.toLowerCase() === '/clockin'){
                await MessageHandlder.handleClockIn(bot, msg);
            } else if(msg.text.toLowerCase() === '/clockout') {
                await MessageHandlder.handleClockOut(bot, msg);
            } else if(msg.text.toLowerCase() === '/holidays'){
                await MessageHandlder.handleViewHolidays(bot, msg);
            }
        } else if(isAdmin){
            if(msg.text.toLowerCase() === '/holidays'){
                await MessageHandlder.handleAdminHolidays(bot, msg)
            } else if(msg.text.toLowerCase() === "add new"){
                await MessageHandlder.handleAddNew(bot, msg);
            } else if(dateRegex.test(msg.text.toLowerCase())){
                await MessageHandlder.handleDate(bot, msg)
            } else if(msg.text.toLowerCase() === "view all"){
                await MessageHandlder.handleViewHolidays(bot, msg);
            }
        }
    })

    ///Callback queries for new users.
    bot.on('callback_query', async function(query){
        
        query.data = JSON.parse(query.data);
        if(query.data.query === 'accept-new-user'){
            await EmployeeService.registerNewEmployee(query.data.user, query.data.name, query.data.username)
            bot.sendMessage(query.data.user, `You have been accepted.\nWelcome to XYZ bot, your unique id is ${query.data.user}`);
        } else if(query.data.query === 'reject-new-user'){
            bot.sendMessage(query.data.user, `You've been rejected.`)
        }
    })
}



