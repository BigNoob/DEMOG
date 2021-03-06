//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  										DE-MOG
// 					Dictator Experiment through Multiplayer Online Game
//
// Date: 2015/06/01
// Version: 1.0
// Author: Olivier Allouard and Stéphane Debove
// Website: http://running-panda.fr and http://stephanedebove.net
// Contact: olivier.allouard@gmail.com or http://stephanedebove.net/contact
// Description:
//					The Express server handles passing the content to the browser. It's the router
//					The Socket.io server handles real time communications between clients and server
// 					Nodejs version used at the first time of developping: 0.6.12
// 					npm version used first: 1.1.4
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Copyright © Olivier Allouard and Stéphane Debove
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
require('./experiment');
require('./sioserver.js');

require('newrelic');

/*
lines to comment for the app to run locally on ubuntu:
    require('newrelic');
	nodeMailer = require('nodemailer'),                     //Used to send results by mail to the admin
    smtpTransport = require('nodemailer-smtp-transport'),
    sgTransport = require('nodemailer-sendgrid-transport'),
	localTransport
*/
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
    util = require('util');									//used to display full object in console.log
    

    ///*
	nodeMailer = require('nodemailer'),                     //Used to send results by mail to the admin
    smtpTransport = require('nodemailer-smtp-transport'),
    sgTransport = require('nodemailer-sendgrid-transport'), //*/

    sendgrid  = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD),
    sio         = undefined,
    wrap_server = undefined;
	
// to add a new variable coming from the game (core.js) to the result file:
// In core.js, record variable with this.variable and send variable to SetGameResult in function prototype.Share (4x)
// In player.js, add to function prototype.SetGameResult, prototype.addGameResult and var GameResultSpace
//
// and if the variable also makes sense in the context of the game:
//
// In sioserver.js, add to function addGameResults in prototype.checkEndedGames
// In experiment.js, add to prototype.addGameResults and var gameResult...
//
// to record all input by players: in core.js line 536 540

// CPU use is heavily dependent on createjs.Ticker.setFPS(20); in main_space_client.js and main_rabbits_clients.js

// if problems of lag/disconnection: log socket.io outputs (sio.set('log level', 3); below) and see if any "websocket connection invalid" error messages show up. if yes your internet connection might be going through a proxy that doesn't accept websocket.
//forcing websocket with sio.set('transports', ['websocket']); will prevent people not using it to enter the game, but they will remain blocked without an error message.
// not forcing it on the other hand results in poor disconnections dealing by the server, ie see http://stackoverflow.com/questions/17987182/socket-io-xhr-polling-disconnect-event
// additionnally, some antivirus like Avast are blocking websockets. Use a TLS/SSL encrypted connection to overcome this (httpS:/... on heroku) 

var frame_time = 60; //60
var physic_time = 15; //15

var adminLogin = "demog";                                  //Login of the admin page
var adminPassw = "test";                                //password of the admin page

var resultMailAdress = 'resultsdemog@yahoo.fr';     //mail adress where the results will be send


var mailSenderLogin = 'olivier.allouard@gmail.com';         //login of the gmail account used to send results
var mailSenderPassw = 'wivyxuvozz';                           //password of the gmail account used to send results



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 
// Experiment Functions and Variables
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  
var 
    current_experiment = CreateExperiment('dg_expe',"web",1,"rabbits","en",90),
    current_experiment_space = CreateExperiment('space_expe',"web",1,"space_coop","en",10),
    current_experiment_rabbits = CreateExperiment('rabbits_expe',"web",1,"rabbits","en",10),
    experimentsList = [current_experiment,current_experiment_space,current_experiment_rabbits];

function CreateExperiment(name,type,iter,game,lang,timeout)
{
    try{
        return(new Experiment(name,type,iter,game,lang,timeout));
    }catch(err)
    {
        console.log(err);
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Mail sender set up
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///*
var LocalTransport = nodeMailer.createTransport("SMTP",{
   service: "Gmail",
   auth: {
       user: mailSenderLogin,
       pass: mailSenderPassw
   }
});
//*/

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
    res.render('admin.ejs',{login: adminLogin, passw: adminPassw});
})

app.get('/dictateur',function(req,res){
	//console.log(experimentsList);
    res.render('dictateur.ejs', {exps: experimentsList, clientsInGameNum: wrap_server.clients.length, clientsInLobbyNum: wrap_server.clientsinLobby.length, clientsFinished: wrap_server.experiment.returnOldCLientsNum(), clientsInLobbyActiveNum: wrap_server.clientsinLobbyActive.length, gamesPlayedByAI: wrap_server.gamesPlayedByAI});
});

app.post('/dictateur/add/', function(req,res){
    var xpName = req.param('xpName');
    var xpType = req.param('xpType');
    var xpGame = req.param('xpGame');
    var Iter = req.param('Iter');
    var lang = req.param('lang');
    var timeout = req.param('timeout');
    if(xpName != '')	
    {
        experimentsList.push(CreateExperiment(xpName,xpType,Iter,xpGame,lang,timeout));
    }
    res.redirect('/dictateur');
});

app.post('/dictateur/delete/:xpName', function(req, res) {
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
    res.redirect('/dictateur');
});
app.post('/dictateur/start/:xpName', function(req, res) {
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
    res.redirect('/dictateur');
});
app.post('/dictateur/stop/:xpName', function(req, res) {
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
    res.redirect('/dictateur');
});

app.post('/dictateur/write/:xpName', function(req, res) {
    var xpName = req.param('xpName');
    if (xpName != '') {
        for(var i =0; i < experimentsList.length; i ++)
        {
            if(experimentsList[i].xpName == xpName)
            {
                var mailOptions = {
                    from: 'DEMOG RESULTS SERVICE', // sender address
                    to: resultMailAdress, // list of receivers
                    subject: 'Results from exp', // Subject line
                    text: 'Results of the experiment : '+current_experiment.xpName, // plaintext body
                    html: 'Results of the experiment : '+current_experiment.xpName ,// html body
                    attachments : 
                        [{      filename: 'result.json',
                                contents: JSON.stringify(experimentsList[i], null, 4)

                        }]
                };

                if(gameport == 8099)
                {
                    /*LocalTransport.sendMail(mailOptions, function(error, info){
                        if(error){
                            console.log(error);
                        }
                    });*/
					//console.log(experimentsList[i].result.playerResults);
					console.log(util.inspect(experimentsList[i], false, null));

                }
                else
                {
                    var payload   = 
                    {
                        to      : resultMailAdress,
                        from    : mailSenderLogin,
                        subject : 'Experiment Result',
                        text    : 'Results of the experiment : '+current_experiment.xpName,
                        files : 
                        [
                            {
                                filename: 'result.json',
                                content : JSON.stringify(experimentsList[i], null, 4)
                            }
                        ]
                    }
                    sendgrid.send(
                        payload,
                        function(error, json){
                            if(error){
                                console.log(error);
                            }
                        }
                    );
					//console.log(experimentsList[i].result.playerResults);
                }  
            }
        }
    }
    res.redirect('/dictateur');
});




app.get('/game', function(req, res){
    res.render('client.ejs', {exp: current_experiment});
});

app.get('/end1', function(req,res){
    res.render('end1.ejs');
});

app.get('/end3', function(req,res){
    res.render('end3.ejs');
});

app.get('/end5', function(req,res){
    res.render('end5.ejs');
});

app.get('/home1', function(req,res){
    res.render('home1.ejs');
});
app.get('/home12', function(req,res){
    res.render('home12.ejs');
});
app.get('/home13', function(req,res){
    res.render('home13.ejs');
});
app.get('/home14', function(req,res){
    res.render('home14.ejs');
});
app.get('/home15', function(req,res){
    res.render('home15.ejs');
});
app.get('/home16', function(req,res){
    res.render('home16.ejs');
});
app.get('/home3', function(req,res){
    res.render('home3.ejs');
});
app.get('/home32', function(req,res){
    res.render('home32.ejs');
});
app.get('/home33', function(req,res){
    res.render('home33.ejs');
});
app.get('/home34', function(req,res){
    res.render('home34.ejs');
});
app.get('/home35', function(req,res){
    res.render('home35.ejs');
});
app.get('/home36', function(req,res){
    res.render('home36.ejs');
});
app.get('/home5', function(req,res){
    res.render('home5.ejs');
});
app.get('/home52', function(req,res){
    res.render('home52.ejs');
});
app.get('/home53', function(req,res){
    res.render('home53.ejs');
});
app.get('/home54', function(req,res){
    res.render('home54.ejs');
});
app.get('/home55', function(req,res){
    res.render('home55.ejs');
});
app.get('/home56', function(req,res){
    res.render('home56.ejs');
});
app.get('/exit', function(req,res){
    res.render('exit.ejs');
});


function sendEmail() // this function was used to send an email at the end of each game. see in core.js if it is activated
{
    
 	if(gameport == 8099)
    {
        //sendgrid doesn't work locally on test computer
    }
    else
    {
		/*
        var payload   = 
        {
            to      : resultMailAdress,
            from    : mailSenderLogin,
            subject : 'Experiment Result',
            text    : 'Results of the experiment : ',
            files : 
            [
                {
                    filename: 'result.json',
                    content : JSON.stringify(experimentsList[0], null, 4) //one experiment at a time when sending emails after each game!
                }
            ]
        }
        sendgrid.send(
            payload,
            function(error, json){
                if(error){
                    console.log(error);
                }
            }
        );
		*/
		console.log(experimentsList[0]);
    }
}

               

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Socket.IO server set up
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function CreateSIOServer()
{
    
    sio = io.listen(server);
    sio.configure(function (){
		sio.set('transports', ['websocket']);
        sio.set('log level', 0);
        sio.set('authorization', function (handshakeData, callback){
            callback(null , true);
        });
    });

    wrap_server = new game_server();
    wrap_server.initServer(current_experiment);
}

function StopSIOServer()
{
    wrap_server = undefined;
    sio = undefined;
}

current_experiment.isRunning = true;
CreateSIOServer();

if(sio != undefined)
{
/*
	sio.on('connection', function(client){
		var client_ip_address = sio.request.connection.remoteAddress;
		console.log(client_ip_address);
	} */
    sio.sockets.on('connection', function (client){
		//var socketId = client.id;
		var clientIp = client.handshake.headers["x-forwarded-for"]; //undefined locally, works on heroku but could not work with newer versions of Nodejs/expressjs

		if (wrap_server.isClientIPknown(clientIp)) //check if this IP is already connected
		{
			wrap_server.exit(client);
		} else 
		{
	
			// var sHeaders = client.handshake.headers; //this gives the domain name ie xxxx.herokuapp.com

		    client.userid = UUID();
		    client.player = new player();
		    client.player.InitResult(client.userid,undefined);
		    client.player.result.updateStatus("waiting for games");

			//console.log(client.request.connection.remoteAddress); request undefined
			//console.log(client.request.headers["x-forwarded-for"]); request undefined LOCALLY, but OK on Heroku. 
			//console.log(client.headers["x-forwarded-for"]); headers undefined
	
			client.player.result.updateIP(clientIp);     

			wrap_server.addClient(client);
		}

        client.on('updateTime', function (first){ 

			if (typeof client.player !== 'undefined')
			{
				if (client.player.result.currentGame == 1)
				{
					if (first) 
					{
						client.player.result.WaitingTimeLobby1 = new Date().getTime();
					} else
					{
						client.player.result.WaitingTimeLobby1 = (new Date().getTime()) - client.player.result.WaitingTimeLobby1;
					}
					//console.log('1: '+client.player.result.WaitingTimeLobby1);	
					//console.log('2: '+client.player.result.WaitingTimeLobby2);	
				} else if (client.player.result.currentGame == 2)
				{
					if (first) 
					{
						client.player.result.WaitingTimeLobby2 = new Date().getTime();
					} else
					{
						client.player.result.WaitingTimeLobby2 = (new Date().getTime()) - client.player.result.WaitingTimeLobby2;
					}
					//console.log('1: '+client.player.result.WaitingTimeLobby1);	
					//console.log('2: '+client.player.result.WaitingTimeLobby2);
				}
			} 
 		
        });  
      
        client.on('playerLogin', function (m){
			if (typeof client.player !== 'undefined')
			{
            	client.player.result.amazonId = m;
			}
        });

        client.on('ici', function (){
            console.log('ici');
        });

        client.on('partnerLost', function (){
            client.player.result.lostPartner = 1;
        });
        client.on('message', function (m){
            wrap_server.onMessage(client, m);
        });
        client.on('sendEmail', function (){
            sendEmail();
        });

        client.on('active', function (){           //this tracks whether or not the client has the tab active in her browser
            client.player.result.tabActive = true;  // does not start game if not active (see matchClients in sioserver.js)
			//console.log('active');
        });

        client.on('inactive', function (){
			//console.log('inactive');
            client.player.result.tabActive = false;
			client.player.result.switchTabNum++;
        });

        client.on('disconnect', function (){

			
            if(wrap_server.isClientInLobby(client))
            {
                wrap_server.fromLobbyToOut(client);
            }
            else if(wrap_server.isClientInGame(client))
            {
                wrap_server.fromGameToOut(client);
				wrap_server.findPartner(wrap_server.findGame(client),client) // asks partner to emit message "partnerLost"
                wrap_server.endGame(wrap_server.findGame(client),'disconnection',client);

            }

        });
    }); 
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Matching players routine
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Called every second to match waiting players in the lobby
setInterval(function(){
    if(wrap_server != undefined && wrap_server.experiment.isRunning)
    {
        wrap_server.matchClients();     
    }
    else if(!wrap_server.experiment.isRunning)
    {

    }
}, 1000);
//Check ended games in wrap_server
setInterval(function(){
   wrap_server.update(frame_time);
   wrap_server.checkEndedGames();
}, frame_time);
//call update of the game server
setInterval(function(){
   wrap_server.physic_update(physic_time);
}, physic_time);

