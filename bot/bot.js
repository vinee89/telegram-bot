const EmployeeService = require('./util/Employee_service');
const AdminService = require('./util/Admin_service')
const MessageHandlder = require('./util/Message_handlers')
const utils = require('./util/index');
const Leave = require('../models/Leaves.model');
const constants = require('../constants/Leave.constants');
const report = require('../report/reportGenerator')
process.env.NTBA_FIX_319 = 1;
process.env["NTBA_FIX_350"] = 1;

module.exports.initBot = function(bot)
{
    const dateRegex = /^\d\d\/\d\d\/\d\d\d\d (.)*/

    const leaveRegex = /^\d\d\/\d\d\/\d\d$/;
    const leaveRangeRegex = /^\d\d\/\d\d\/\d\d \d\d\/\d\d\/\d\d$/
    const userLeavesRegex = /^\/user(\d)*leaves$/;

    const userRegex = /^\/user(\d)*$/;
    bot.on('message', async function(msg){

        const leaveOptions = ['half day', 'full day', 'work from home', 'leave w/o pay', 'cancel'];
        var isAdmin = await AdminService.isRegistered(msg.from.id);
        var isEmployee = await EmployeeService.isRegistered(msg.from.id)
        if(msg.text.startsWith('/start') &&  !isAdmin) {
            await MessageHandlder.handleStartMessage(bot, msg);
        } else if(isEmployee){
            if(msg.text.toLowerCase() === '/clockin'){
                await MessageHandlder.handleClockIn(bot, msg);
            } else if(msg.text.toLowerCase() === '/clockout' || msg.text.toLowerCase() === 'clock out') {
                await MessageHandlder.handleClockOut(bot, msg);
            } else if(msg.text.toLowerCase() === '/holidays'){
                await MessageHandlder.handleViewHolidays(bot, msg);
            } else if(msg.text.toLowerCase() === '/applyleave'){
                await MessageHandlder.handleApplyLeave(bot, msg);
            } else if(leaveOptions.includes(msg.text.toLowerCase())){
                await MessageHandlder.handleSelectLeave(bot, msg);
            } else if(leaveRegex.test(msg.text) || leaveRangeRegex.test(msg.text)){
                await MessageHandlder.handleLeaveDate(bot, msg);
            } else if(msg.text.toLowerCase() === '/myleaves') {
                await MessageHandlder.handleMyLeaves(bot, msg);
            } else if(msg.text.startsWith('/sendmessage')){
                await MessageHandlder.handleSendMessage(bot, msg)
            } else {
                var delivered_message = await MessageHandlder.handleDeliverMessage(bot, msg);
                if(!delivered_message){
                    await MessageHandlder.handleDetails(bot, msg);
                }
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
            } else if(msg.text.startsWith('/notice')){
                await MessageHandlder.handleNotice(bot, msg);
            } else if(msg.text.toLowerCase() === '/reports'){
                await MessageHandlder.handleReports(bot, msg);
            } else if(msg.text.toLowerCase() === 'employee'){
                await MessageHandlder.handleEmployees(bot, msg);
            } else if(userLeavesRegex.test(msg.text.toLowerCase())){
                await MessageHandlder.handleMyLeaves(bot, msg, true)
            } else if(msg.text.toLowerCase() === 'attendance'){
                await MessageHandlder.handleAttendence(bot, msg, new Date());
            } else if(msg.text.toLowerCase() === 'leaves'){
                await MessageHandlder.handleLeaves(bot, msg);
            } else if(userRegex.test(msg.text.toLowerCase())){
                await MessageHandlder.handleUserInfo(bot, msg);
            } else if(msg.text.toLowerCase() === '/sendreport'){
                await report.generateReport();
                bot.sendDocument(msg.chat.id, './report.csv', {}, {});
            }
        }
    })

    ///Callback queries for new users.
    bot.on('callback_query', async function(query){
        query.data = JSON.parse(query.data);
        if(query.data.query === 'accept-new-user'){
            if(await EmployeeService.isRegistered(query.data.user) === false){
                await EmployeeService.registerNewEmployee(query.data.user, query.data.name, query.data.username)
                bot.sendMessage(query.data.user, `You have been accepted.\nWelcome to XYZ bot, your unique id is ${query.data.user}\n\nHere is a list of functions to get you started:\n/clockin - Start your day\n/clockout - End your day\n/holidays - List of upcoming holidays\n/applyleave - Apply for leaves\n/myleaves - View status of your leaves\n/sendmessage - Send message to admins immediately\n`);
            } else {
                bot.sendMessage(query.from.id, "The user has already been accepted.")
            }
        } else if(query.data.query === 'reject-new-user'){
            bot.sendMessage(query.data.user, `You've been rejected.`)
        } else if(query.data.query === 'accept-leave'){
            var req = await Leave.findOne({_id: query.data.request_id});
            if(req.status === 0){
                await Leave.updateOne({_id: query.data.request_id}, {$set: {status: constants.STATUS_ACCEPTED}});
                bot.sendMessage(query.from.id, "Approved.");
            } else {
                bot.sendMessage(query.from.id, `This request has already been ${constants.STATUS_TO_NUMBER[req.status]}`)
            }
        } else if(query.data.query === 'reject-leave'){
            var req = await Leave.findOne({_id: query.data.request_id});
            if(req.status === 0){
                await Leave.updateOne({_id: query.data.request_id}, {$set: {status: constants.STATUS_REJECTED}});
                bot.sendMessage(query.from.id, "Rejected");
            } else {
                bot.sendMessage(query.from.id, `This request has already been ${constants.STATUS_TO_NUMBER[req.status]}`)
            }
        } else if(query.data.query === 'previous-day' || query.data.query === 'next-day'){
            try{
                await AdminService.generateDayReport(bot, query.message, query.data.date, query)
            } catch (e){
                console.log("Chat not found")
            }
        }
    })
}



