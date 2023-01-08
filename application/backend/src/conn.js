require('dotenv').config();
const mysql = require('mysql2');

const conn = mysql.createPool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DATABASE
});

// const conn = mysql.createPool({
//     host: '157.230.125.62',
//     user: 'vmcfzuqqjs',
//     password: 'WzY88dRDPq',
//     database: 'vmcfzuqqjs'
// });

module.exports = conn;