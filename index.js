const express = require("express");
const app = express();
const mybot = require("./bot/bot.js");
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const mongoose = require("mongoose");
const cron = require("./cron/index");
const keepOnline = require("./util/keeponline");
const { connection_string, tg_key } = require("./config/index");

const Admin = require("./models/Admin.model");

const port = process.env.PORT || 3000;

const bot = new TelegramBot(tg_key, { polling: true });

(async function main() {
    await mongoose.connect(connection_string, { useNewUrlParser: true });
    console.log("connected to the database");
    mybot.initBot(bot);
    app.listen(port, () => {
        console.log(`listening on ${port}`);
    });
    cron.init(bot);
    app.get("/", (req, res) => {
        res.send("online");
    });
})();
