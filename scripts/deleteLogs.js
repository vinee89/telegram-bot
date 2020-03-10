const Log = require("../models/Logs.model");
const mongoose = require("mongoose");
const { connection_string } = require("../config/index");
const tz = require("moment-timezone");
const moment = require("moment");

async function main() {
    await mongoose.connect(connection_string, { useNewUrlParser: true });
    const logs = await Log.updateMany(
        {
            start: {
                $lte: moment("2020-01-30 23:50", "YYYY-MM-DD HH:mm")
                    .tz("Asia/Colombo")
                    .toDate()
            }
        },
        { isArchieved: true }
    );
}

main();
