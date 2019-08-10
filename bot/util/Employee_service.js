const Employee = require('../../models/Employee.model');

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
module.exports = {isRegistered, registerNewEmployee, isCheckedIn};