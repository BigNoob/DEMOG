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
//
// 
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

require('./public/js/game/Player.js');
require('./public/js/game/Enemies.js');
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
	io             = require("socket.io"),                     //
	express 	= require('express'),						//
	UUID		= require('node-uuid'),						//
	routes 		= require('routes'),						//
	verbose 	= false,									// For debug purpose, if true, more debug logs will print
	http 		= require('http'),							//
	app 		= express(),								//
    sio         = undefined,
    wrap_server = undefined;

var frame_time = 60;
var physic_time = 15;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 
// Experiment Functions and Variables
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    
var 
    current_experiment = CreateExperiment('test',"web",5,"rabbits"),
    experimentsList = [current_experiment],
    experiment_link= current_experiment.generateLink();


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
    res.render('admin.ejs', {exps: experimentsList});
});

app.post('/admin/add/', function(req,res){
    //console.log("Admin 'addXp' Request recieved: " +req.param('xpName') +" -|- "+ req.param('xpType') +" -|- "+ req.param('Iter') +" -|- "+ req.param('xpGame'));
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
    //console.log("Admin 'deleteXp' Request recieved: " +xpName);
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
    //console.log("Admin 'startXP' Request recieved: " +xpName);
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
    //console.log("Admin 'stopXP' Request recieved: " +xpName);
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
    //console.log("Admin 'writeXP' Request recieved: " +xpName);
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

app.get(experiment_link,function (req,res){
    res.render('client.ejs', {exp: current_experiment});
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
        client.player = new Player();
        client.player.InitResult(client.userid);
        wrap_server.addClient(client);
        

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

