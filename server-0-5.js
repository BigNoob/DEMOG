//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  										DE-MOG
// 					Dictator Experiment through Multiplayer Online Game
//
// Date: 2014/06/18
// Version: 0.5
// Author: Olivier Allouard
// Website: running-pande.fr
// Contact: olivier.allouard@gmail.com
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Express
// Socket.io relative variables and initialization
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var express = require('express');
var routes = require('routes');
var http = require('http');

var app = express();
var server = app.listen(process.env.PORT || 8099);
var io = require("socket.io").listen(server);
io.set('log level', 0);

app.configure(function(){
    app.set('views', __dirname + '/views');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.static(__dirname + '/public'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use("/public",express.static(__dirname+"/public"));
});

console.log(server.address().port);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 
// Project-relative Modules
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var xpGen = require('./serverLibs/experiment');

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 
// Project Variables
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var testXP = CreateExperiment("testXP","amazon",4,"space_coop");
var experimentsList = [];


//DEBUG LINES TO TEST THE EXPERIMENTS
experimentsList.push(testXP);
experimentsList[0].startXP();





//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Express Router
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.get('/admin',function(req,res){
    res.render('admin.ejs', {exps: experimentsList});
});

app.post('/admin/add/', function(req,res){
    console.log("Admin 'addXp' Request recieved: " +req.param('xpName') +" -|- "+ req.param('xpType') +" -|- "+ req.param('Iter') +" -|- "+ req.param('xpGame'));
    var xpName = req.param('xpName');
    var xpType = req.param('xpType');
    var xpGame = req.param('xpGame');
    var Iter = req.param('Iter');
    if(xpName != '')
    {
        experimentsList.push(CreateExperiment(xpName,xpType,Iter,xpGame));
    }
    res.redirect('/admin');
});

app.post('/admin/delete/:xpName', function(req, res) {
    console.log("Admin 'deleteXp' Request recieved: " +xpName);
    var xpName = req.param('xpName');
    if (xpName != '') {
        for(var i =0; i < experimentsList.length; i ++)
        {
            if(experimentsList[i].xpName == xpName)
            {
                experimentsList.splice(i,1);
            }
        }
    }
    res.redirect('/admin');
});
app.post('/admin/start/:xpName', function(req, res) {
    console.log("Admin 'startXP' Request recieved: " +xpName);
    var xpName = req.param('xpName');
    if (xpName != '') {
        for(var i =0; i < experimentsList.length; i ++)
        {
            if(experimentsList[i].xpName == xpName)
            {
                experimentsList[i].startXP();
            }
        }
    }
    res.redirect('/admin');
});
app.post('/admin/stop/:xpName', function(req, res) {
    console.log("Admin 'stopXP' Request recieved: " +xpName);
    var xpName = req.param('xpName');
    if (xpName != '') {
        for(var i =0; i < experimentsList.length; i ++)
        {
            if(experimentsList[i].xpName == xpName)
            {
                experimentsList[i].stopXP();
            }
        }
    }
    res.redirect('/admin');
});
app.post('/admin/write/:xpName', function(req, res) {
    console.log("Admin 'writeXP' Request recieved: " +xpName);
    var xpName = req.param('xpName');
    if (xpName != '') {
        for(var i =0; i < experimentsList.length; i ++)
        {
            if(experimentsList[i].xpName == xpName)
            {
                experimentsList[i].exportResults();
            }
        }
    }
    res.redirect('/admin');
});
app.get('/game',function(req,res){
    res.render('client.ejs');
});
app.get('/gameAmazon/:xpName',function(req,res){
    res.locals.query = req.param('xpName');
    res.render('clientAmazon.ejs');
});
