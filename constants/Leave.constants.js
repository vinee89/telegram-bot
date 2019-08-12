const HALF_DAY = 0;
const FULL_DAY = 1;
const WORK_FROM_HOME = 2;
const LEAVE_WITHOUT_PAY = 3;

const STATUS_PENDING = 0;
const STATUS_ACCEPTED = 1;
const STATUS_REJECTED = 2;

const LEAVE_TO_NUMBER = {
    'half day': HALF_DAY,
    'full day': FULL_DAY,
    'work from home': WORK_FROM_HOME,
    'leave w/o pay': LEAVE_WITHOUT_PAY
}

const NUMBER_TO_LEAVE  ={
    [HALF_DAY]:          'half day     ',
    [FULL_DAY]:          'full day     ',
    [WORK_FROM_HOME]:    'wfm          ',
    [LEAVE_WITHOUT_PAY]: 'leave w/o pay'
}

const STATUS_TO_NUMBER = {
    0: 'pending',
    1: 'accepted',
    2: 'rejected'
}

module.exports ={HALF_DAY, FULL_DAY, WORK_FROM_HOME, LEAVE_WITHOUT_PAY, LEAVE_TO_NUMBER, STATUS_ACCEPTED, STATUS_PENDING, STATUS_REJECTED, STATUS_TO_NUMBER, NUMBER_TO_LEAVE};
