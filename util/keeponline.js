var https = require("https");
setInterval(async function() {
    var x = await https.get('https://finc-social-tg-bot.herokuapp.com/')
    console.log('Pinged')
}, 300000); // every 5 minutes (300000)