var express = require('express');
var app = express();

var email_verify = require("cloud/email_verify/check");
var announce_board = require("cloud/announce_board/get");
var announce_board = require("cloud/user_disable/disable");

app.set('views', 'cloud/views');  // Specify the folder to find templates
app.set('view engine', 'ejs');    // Set the template engine
app.use(express.bodyParser());    // Middleware for reading request body

app.get('/email_verify', email_verify.check);
app.get('/announce_board', announce_board.get);
app.get('/user_disable', user_disable.disable);

app.listen();
