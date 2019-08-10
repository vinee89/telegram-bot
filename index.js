const express = require('express');
const app = express();
const mybot = require('./bot/bot.js')
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs')
const mongoose = require('mongoose');

const Admin = require('./models/Admin.model');

const port = process.env.PORT || 3000;

const key = '855062719:AAEN3Rmc_pBGcQpk1RXfh7bl2adbH_6jwck';
const bot = new TelegramBot(key, {polling: true});

(async function main(){
    var con_string = 'mongodb://localhost:27017/telegram';
    await mongoose.connect(con_string, { useNewUrlParser: true });

    console.log('connected to the database');
    mybot.initBot(bot);
    app.listen(port, ()=>{console.log(`listening on ${port}`)})
    
    app.get('/', (req, res)=>{
        res.send('online')
    })
})()
