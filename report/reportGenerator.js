const mongoose = require('mongoose');
const Log = require('../models/Logs.model');
const Employee = require('../models/Employee.model');
const Leave = require('../models/Leaves.model');
const Holiday = require('../models/Holiday.model')
const _ = require('lodash')
const moment = require('moment');
const tz = require('moment-timezone');
const fs = require('fs');

function getLimits(logs){
    var start = moment(logs[0].start).startOf('day');
    var end = moment(logs[logs.length -1]).endOf('day');

    return {start, end}
}

function getValidDates(start, end){
    var current = start.clone();
    var valid_dates = [];

    while(current.isBefore(end)){
        if(current.day() !== 0){
            valid_dates.push(current.clone())
        }
        current.add(1, 'days')
    }

    return valid_dates;
}

function getDatesBoxes(logs){

    var dif_dates = {};

    for(log of logs){
        var key = moment(log.start).tz("Asia/Colombo").format("DD/MM/YYYY")
        if(dif_dates[key]){
            dif_dates[key].push(log);
        } else {
            dif_dates[key] = [log];
        }
    }
    return dif_dates;
}

function isHolidayOrLeave(holidays, leaves, employee, date){
    var isHoL = false;

    for(holiday of holidays){
        var hDate = moment(holiday.date).tz("Asia/Colombo").startOf('day');
        if(hDate.isSame(date)){
            isHoL = true; break;
        }
    }

    for(leave of leaves){
        var lsDate = moment(leave.date1).tz('Asia/Colombo').startOf('day');
        var leDate;

        if(leave.date2){
            leDate = moment(leave.date2).tz('Asia/Colombo').endOf('day')
        } else {
            leDate = lsDate.clone()
        }

        if(leave.employee.first_name === employee && date.isSameOrAfter(lsDate) && date.isSameOrBefore(leDate)){
            isHoL = true; break;
        }
    }

    return isHoL;
}

async function generateReport(){
    var logs = await Log.find({}).populate('employee').sort({start: 1});
    var employees = (await Employee.find({})).map(emp => emp.first_name)

    var {start, end} = getLimits(logs);
    var valid_dates = getValidDates(start, end)
    var dif_dates = getDatesBoxes(logs);

    var holidays = await Holiday.find({});
    var leaves = await Leave.find({}).populate('employee');

    var report = "date,username,clockin,clockout,total,leave/holiday\n"

    for(date of valid_dates){
        var tmp = [...employees];
        var key = date.format("DD/MM/YYYY");
        var moment_date = moment(date,"DD/MM/YYYY").tz("Asia/Colombo").startOf('day')
        var current_logs = dif_dates[key];

        if(current_logs){
            for(log of current_logs){
                _.remove(tmp, emp => log.employee.first_name === emp);
                var HoL = (isHolidayOrLeave(holidays, leaves, log.employee.first_name, moment_date) ? "Yes" : "No");
                let start = moment(log.start).tz("Asia/Colombo");
                let end = moment(log.end).tz("Asia/Colombo");

                let total = calculateHoursMinutes(start, end);
                report += `${key},${log.employee.first_name},${start.format("HH:mm")},${end.format("HH:mm")},${total},${HoL}\n`;
            }
        }

        for(employee of tmp){
            var HoL = (isHolidayOrLeave(holidays, leaves, employee, moment_date) ? "Yes" : "No")
            report += `${key},${employee},NA,NA,NA,${HoL}\n`
        }
    }

    fs.writeFileSync('./report.csv', report, 'utf8');
}

function calculateHoursMinutes(start, end){
    var duration = moment.duration(end.diff(start));

    // duration in hours
    var hours = parseInt(duration.asHours());
    if(hours < 10) hours = `0${hours}`;

    // duration in minutes
    var minutes = parseInt(duration.asMinutes())%60;

    return `${hours}:${minutes}`
}

module.exports = {generateReport};