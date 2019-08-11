const Holiday = require('../../models/Holiday.model');

async function getHolidaysForTheMonth(month){
    var holidays = await Holiday.find({month: month});
    var holiday_table = "";
    for(holiday of holidays){
        holiday_table += `${holiday.day}/${holiday.month}/${holiday.year} - ${holiday.name}\n`
    }

    return (holiday_table.length > 0 ? holiday_table : "No holidays have been added yet for this month");
}

module.exports = {getHolidaysForTheMonth}