//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  										DE-MOG
// 					Dictator Experiment through Multiplayer Online Game
//
// Date: 2014/06/18
// Version: 0.5
// Author: Olivier Allouard
// Website: running-panda.fr
// Contact: olivier.allouard@gmail.com
// Description:
//					The Express server handles passing the content to the browser. It's the router
//					The Socket.io server handles real time communications between clients and server
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Copyright © Olivier Allouard
//
//Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"),
//to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, 
//and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
//
//The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
//The Software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, 
//fitness for a particular purpose and noninfringement. In no event shall the authors or copyright holders be liable for any claim, damages or other liability,
//whether in an action of contract, tort or otherwise, arising from, out of or in connection with the software or the use or other dealings in the Software.
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

require('./player.js');
//require('./public/js/game/Enemies.js');
require('./experiment');
require('./sioserver.js');
require('newrelic');

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Variables Declaration
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var 
	gameport 	= process.env.PORT || 8099,					// Listen port of the server (8099 or a specific port declared by the host machine)
	io          = require("socket.io"),                     //
	express 	= require('express'),						//
	UUID		= require('node-uuid'),						//
	routes 		= require('routes'),						//
	http 		= require('http'),							//
	app 		= express(),								//
    fs = require('fs'),                                     //Used to write the result json file in the log folder of the server
    nodeMailer = require('nodemailer'),                     //Used to send results by mail to the admin
    sio         = undefined,
    wrap_server = undefined;
    

var frame_time = 60;
var physic_time = 15;

var adminLogin = 'debove';                                  //Login of the admin page
var adminPassw = 'wivyxuvo';                                //password of the admin page

var resultMailAdress = 'running.panda.website@gmail.com';   //mail adress where the results will be send

var mailSenderLogin = 'olivier.allouard@gmail.com';         //login of the gmail account used to send results
var mailSenderPassw = 'wivyxuvo';                           //password of the gmail account used to send results


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 
// Experiment Functions and Variables
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    
var 
    current_experiment = CreateExperiment('test',"web",2,"space_coop"),
    experimentsList = [current_experiment];




function CreateExperiment(name,type,iter,game)
{
    try{
        //console.log(new Experiment(name,type,iter,game));
        return(new Experiment(name,type,iter,game));
    }catch(err)
    {
        console.log(err);
    }
}

var experiment_link = current_experiment.generateLink();

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Mail sender set up
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var smtpTransport = nodeMailer.createTransport("SMTP",{
   service: "Gmail",
   auth: {
       user: mailSenderLogin,
       pass: mailSenderPassw
   }
});



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Express server set up
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.configure(function(){
    app.set('views', __dirname + '/views');
    app.use(express.favicon());
    //app.use(express.logger('dev'));
    app.use(express.static(__dirname + '/public'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use("/public",express.static(__dirname+"/public"));
});

var server 		= http.createServer(app);					// Creation of the Express server

server.listen(gameport);

app.get('/admin',function(req,res){
    res.render('admin.ejs', {exps: experimentsList, clientsInGameNum: wrap_server.clients.length, clientsInLobbyNum: wrap_server.clientsinLobby.length});
});

app.post('/admin/add/', function(req,res){
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
    var xpName = req.param('xpName');
    if (xpName != '') {
        for(var i =0; i < experimentsList.length; i ++)
        {
            if(experimentsList[i].xpName == xpName)
            {
                experimentsList[i].startXP();
                current_experiment = experimentsList[i];
                wrap_server.initServer(current_experiment, server);
            }
            else
            {
                experimentsList[i].stopXP();
            }
        }
    }
    res.redirect('/admin');
});
app.post('/admin/stop/:xpName', function(req, res) {
    var xpName = req.param('xpName');
    if (xpName != '') {
        for(var i =0; i < experimentsList.length; i ++)
        {
            if(experimentsList[i].xpName == xpName)
            { 
                wrap_server.stopServer();
                experimentsList[i].stopXP();
            }
        }
    }
    res.redirect('/admin');
});
app.post('/admin/write/:xpName', function(req, res) {
    var xpName = req.param('xpName');
    if (xpName != '') {
        for(var i =0; i < experimentsList.length; i ++)
        {
            if(experimentsList[i].xpName == xpName)
            {
                
                fs.writeFile('./log/result.json', JSON.stringify(experimentsList[i], null, 4), function(err){
                    if(err) {
                        console.log(err);
                    } else {
                        console.log("The file was saved!");
                    }
                });

                var mailOptions = {
                    from: 'DEMOG RESULTS SERVICE', // sender address
                    to: resultMailAdress, // list of receivers
                    subject: 'Results from exp', // Subject line
                    text: JSON.stringify(experimentsList[i], null, 4), // plaintext body
                    html: JSON.stringify(experimentsList[i], null, 4) ,// html body
                    attachments : 
                        [{      filename: 'result.json',
                                path: './log/result.json' // stream this file

                        }]
                };
                smtpTransport.sendMail(mailOptions, function(error, info){
                    if(error){
                        console.log(error);
                    }else{
                        console.log('Message sent: ' + info.response);
                    }
                });
            }
        }
    }
    res.redirect('/admin');
});

app.get('/game', function(req, res){
    res.render('client.ejs', {exp: current_experiment});
});

app.get('/end', function(req,res){
    res.render('end.ejs');
});

app.get(experiment_link,function (req,res){
    res.render('home.ejs', {exp: current_experiment});
});


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Socket.IO server set up
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function CreateSIOServer()
{
    
    sio = io.listen(server);
    sio.configure(function (){
        sio.set('log level', 0);
        sio.set('authorization', function (handshakeData, callback){
            callback(null , true);
        });
    });

    wrap_server = new game_server();
    wrap_server.initServer(current_experiment);
    //console.log(wrap_server);
    console.log('SIOServer is created for experiment : '+current_experiment.xpName);
    //console.log(sio);
}

function StopSIOServer()
{
    wrap_server = undefined;
    sio = undefined;
    console.log('SIOServer is closed');
}

current_experiment.isRunning = true;
CreateSIOServer();

if(sio != undefined)
{
    sio.sockets.on('connection', function (client){
        var tmpClient = client;
        //console.log('plop');
        client.userid = UUID();
        client.player = new player();
        //client.player.InitResult(client.userid);
        client.player.InitResult(client.userid,undefined);
        client.player.result.updateStatus("wating for games");
        wrap_server.addClient(client);
        
        client.on('playerLogin', function (m){
            console.log(m);
            client.player.result.amazonId = m;
        });
        client.on('message', function (m){
            wrap_server.onMessage(client, m);
        });

        client.on('disconnect', function (){
            if(wrap_server.isClientInLobby(client))
            {
                wrap_server.removeCientFromLobby(client); 
            }
            else if(wrap_server.isClientInGame(client))
            {
                wrap_server.endGame(wrap_server.findGame(client));
                wrap_server.removeCientFromLobby(client);
            }
            else
            {
                 
            } 
        });
    }); 
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Matching players routine
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Called every 5 seconds to match waiting players in the lobby
setInterval(function(){
    //console.log('interval');
    if(wrap_server != undefined && wrap_server.experiment.isRunning)
    {
        wrap_server.matchClients();
        
    }
    else if(!wrap_server.experiment.isRunning)
    {

    }
}, 5000);

setInterval(function(){
   wrap_server.update(frame_time);
   wrap_server.checkEndedGames();
}, frame_time);

setInterval(function(){
   wrap_server.physic_update(physic_time);
}, physic_time);

