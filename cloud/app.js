var express = require('express');
var app = express();

var email_verify = require("cloud/email_verify/check");
var announce_board = require("cloud/announce_board/get");
var user_delete = require("cloud/user_delete/delete");
var comment_get = require("cloud/comment/get");
var config_loader = require("cloud/config");
var config = config_loader.get();

app.set('views', 'cloud/views');  // Specify the folder to find templates
app.set('view engine', 'ejs');    // Set the template engine
app.use(express.bodyParser());    // Middleware for reading request body

app.get('/email_verify', email_verify.check);
app.get('/announce_board', announce_board.get);
app.get('/comment_get', comment_get.get);
app.post('/user_delete', express.basicAuth(config["basic_auth_name"], config["basic_auth_password"]), user_delete.execute_delete);

app.listen();
