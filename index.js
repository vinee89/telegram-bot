const express = require('express');
const app = express();
const mybot = require('./bot/bot.js')
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs')
const mongoose = require('mongoose');
const cron = require('./cron/index')
const keepOnline = require('./util/keeponline')

const Admin = require('./models/Admin.model');

const port = process.env.PORT || 3000;
//
const key = '412554004:AAEit1eXkdo6MiKS0BQXMugQi4BKL7psgpg';
const bot = new TelegramBot(key, {polling: true});

(async function main(){
    var con_string = 'mongodb+srv://adm:adm123@cluster0-gekeo.mongodb.net/test?retryWrites=true&w=majority';
    // var con_string = 'mongodb://localhost:27017/telegram'
    await mongoose.connect(con_string, { useNewUrlParser: true });
    console.log('connected to the database');
    mybot.initBot(bot);
    app.listen(port, ()=>{console.log(`listening on ${port}`)})
    cron.init(bot);
    app.get('/', (req, res)=>{
        res.send('online')
    })
})()
