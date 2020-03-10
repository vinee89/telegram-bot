require("dotenv").config();

const production = process.env.NODE_ENV === "production" ? true : false;
module.exports = {
    production,
    connection_string: !production ? process.env.PROD_DB : process.env.DEV_DB,
    tg_key: production ? process.env.PROD_TG_KEY : process.env.DEV_TG_KEY
};
