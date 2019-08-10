const EmployeeService = require('./util/Employee_service');
const MessageHandlder = require('./util/Message_handlers')
process.env.NTBA_FIX_319 = 1;

module.exports.initBot = function(bot)
{
    bot.on('message', async function(msg){

        msg.text.toLowerCase()
        if(msg.text.startsWith('/start')) {
            await MessageHandlder.handleStartMessage(bot, msg);
        } else if(await EmployeeService.isRegistered(msg.from.id)){
            if(msg.text.toLowerCase() === '/clockin'){
                await MessageHandlder.handleClockIn(bot, msg);
            } else if(msg.text.toLowerCase() === '/clockout') {
                await MessageHandlder.handleClockOut(bot, msg);
            }
        }
    })

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



