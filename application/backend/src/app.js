require('dotenv').config();
const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require('jsonwebtoken');
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
let conn = require('./conn');
// middlewares
app.use(cors({
    origin: "*",
    credentials: true
}));
app.use(express.urlencoded({
    extended: false,
}));
app.use(express.json());
// .logical middlewares
async function getDataForTest(req, res) { // middleware to test the database
    let query = 'SELECT * FROM users';
    conn.query(query, (err, result) => {
        res.json({
            msg_type: 'succes',
            msg: 'Fetched Succesfully',
            data: result
        });
    });
}
async function registrationCheck(req, res, next) { // middleware to check the user is already exists or not
    let checkData = `SELECT * FROM users WHERE email='${req.body.email}'`;
    conn.query(checkData, (err, result) => {
        if (err) {
            res.json({
                msg_type: 'fail',
                err: 'server error!'
            });
            return;
        };
        if (result.length !== 0) {
            res.json({
                msg_type: 'fail',
                err: 'Email is already exists!'
            });
            return;
        }
        next();
    });
}
async function userInsert(req, res) { // middleware to insert the user to the database
    let insertData = 'INSERT INTO users SET ?';
    conn.query(insertData, req.body, (err, result) => {
        if (err) {
            res.json({
                msg_type: 'fail',
                err: 'server error!'
            });
            return;
        };
        if (result.affectedRows == 1) {
            let obj = {
                msg_type: 'success',
                msg: 'Registration Success',
                user_id: result.insertId
            }
            res.json(obj);
        }
    });
}
async function userExistenceCheck(req, res, next) {
    let checkData = `SELECT * FROM users WHERE email='${req.body.email}' AND password='${req.body.password}'`;
    conn.query(checkData, (err, result) => {
        if (err) {
            res.json({
                msg_type: 'fail',
                err: 'server error!'
            });
            return;
        };
        if (result.length === 0) {
            res.json({
                msg_type: 'fail',
                err: 'Login credentails are incorrect!'
            });
            return;
        }
        req.user = result[0];
        next();
    })
}
async function tokenGenerate(req, res, next) {
    req.token = jwt.sign(req.user, process.env.ACCESS_TOKEN_SECRET);
    next();
}
async function userValidation(req, res, next) {
    req.token = jwt.verify(req.body.token, process.env.ACCESS_TOKEN_SECRET);
    req.body.email = req.token.email;
    req.body.password = req.token.password;
    next();
}
async function loginUser(req, res) {
    res.cookie('authorization', `Bearer ${req.token}`, {
        httpOnly: true,
        secure: true,
        expire: new Date().getTime() + 365 * 24 * 60 * 60 * 1000
    }).json({
        msg_type: 'success',
        msg: 'Your are Logged In',
        user: {
            valid: true,
            token: req.token
        }
    });
}
async function validRequest(req, res) {
    res.json({
        msg_type: 'success',
        msg: 'Your are Logged In',
        user: {
            valid: true,
            token: req.body.token
        }
    })
}
async function saveLinks(req, res) {
    req.body.linkData.user_id = req.user.id;
    let insertData = 'INSERT INTO links SET ?';
    conn.query(insertData, req.body.linkData, (err, result) => {
        if (err) {
            res.json({
                msg_type: 'fail',
                err: 'server error!'
            });
            return;
        };
        if (result.affectedRows == 1) {
            let obj = {
                msg_type: 'success',
                msg: 'Insertion Successfull!',
                user_id: result.insertId
            }
            res.json(obj);
        }
    });
}
async function getLinks(req, res) {
    let getLinks = `SELECT * FROM links WHERE user_id='${req.user.id}'`;
    conn.query(getLinks, (err, result) => {
        if (err) {
            res.json({
                msg_type: 'fail',
                err: 'server error!'
            });
            return;
        };
        if (result.length == 0) {
            res.json({
                msg_type: 'fail',
                msg: 'No Data Found!'
            });
            return;
        };
        res.json({
            msg_type: 'success',
            msg: 'Fetching Successfully!',
            links: result
        });
    });
}
// routes
app.post('/registration', registrationCheck, userInsert);
app.post('/login', userExistenceCheck, tokenGenerate, loginUser);
app.get('/getData', getDataForTest);
app.post('/validUser', userValidation, userExistenceCheck, validRequest);
app.post('/sendLinkData', userValidation, userExistenceCheck, saveLinks);
app.post('/getLinkData', userValidation, userExistenceCheck, getLinks);
// listen to the port
app.listen(PORT, HOST, () => console.log(`The server is started at port ${PORT}!`));