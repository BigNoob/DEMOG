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
/*
var stdo = require('fs').createWriteStream('var/log/node-server/log.txt');
process.stdout.write = (function(write){
    return function(string,encoding,fd){
        stdo.write(string);
    }
})(process.stdout.write)
*/
console.log(server.address().port);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Global Datas, will be editable by the admin
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var experimentsList = [];
var currentExperiment = new Experiment('testXP',"WEB",[],[]);
currentExperiment.startXP();
experimentsList.push(currentExperiment);
/*
experimentsList.push(new Experiment('webXp',"WEB",null,null));
experimentsList.push(new Experiment('localXp',"LOCAL",null,null));
experimentsList.push(new Experiment('amazonXp',"AMAZON",null,null));
*/
var INITIAL_X = 400;                                        //Initial X position of a player
var INITIAL_Y = 550;                                        //Initial Y position of a player
var INITIAL_VEL_X = 0;                                      //Initial X speed of a players
var INITIAL_VEL_Y = 0;                                      //Initial Y speed of a player

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Global variables
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Storage of the connected clients datas
//
//      entity[0] = unique ID
//      entity[1] = X position
//      entity[2] = Y position
//      entity[3] = Horizontal Speed
//      entity[4] = Vertical Speed
//      entity[5] = Room name
//      entity[6] = Experience Name
//      entity[7] = Login
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var entities = [];

//Number of connected clients                    
var count = 0;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Classes declaration
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
function Player(login)
{
    this.login = login;
}
*/
function Room(roomName,firstPlayerId,secondPlayerId)
{
    this.roomName = roomName;
    this.firstPlayerId = firstPlayerId;
    this.secondPlayerId = secondPlayerId;
}

function Experiment(expName,type,roomsData,playersData)
{
    this.expName = expName;
    this.isRunning = false;
    this.startTime = null;
    this.expType = type;
    this.roomsData = roomsData;
    this.playersData = playersData;
    this.startXP = function()
    {
        this.isRunning = true;
        this.startTime = new Date();
    };
    this.stopXP = function()
    {
        this.isRunning = false;
        this.startTime = null;
    };
    this.addPlayer = function (login)
    {
        this.playersData.push(login);
    };

    this.addRoom = function(roomName)
    {
        this.roomsData.push(new Room(roomName+roomsData.length,'NULL','NULL'));
    };
}




//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Server Code Begin
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Admin Server Code
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/admin',function(req,res){
    res.render('admin.ejs', {exps: experimentsList});
});

app.post('/admin/add/', function(req,res){
    console.log("Admin 'addXp' Request recieved: " +req.param('xpName') + req.param('xpType'));
    var xpName = req.param('xpName');
    var xpType = req.param('xpType');
    if(xpName != '')
    {
        experimentsList.push(new Experiment(xpName,xpType,[],[]));
    }
    res.redirect('/admin');
});

app.post('/admin/delete/:xpName', function(req, res) {
    console.log("Admin 'deleteXp' Request recieved: " +xpName);
    var xpName = req.param('xpName');
    if (xpName != '') {
        for(var i =0; i < experimentsList.length; i ++)
        {
            if(experimentsList[i].expName == xpName)
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
            if(experimentsList[i].expName == xpName)
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
            if(experimentsList[i].expName == xpName)
            {
                experimentsList[i].stopXP();
            }
        }
    }
    res.redirect('/admin');
});
/*
app.get('/',function(req,res){
    res.redirect(301,"http://www.running-panda.fr/stage/SpaceCoop/index.html");
});
*/
app.get('/game',function(req,res){
    //var xpName = req.param('xpName');
    res.render('client.ejs');
});
app.get('/gameAmazon/:xpName',function(req,res){
    //var xpName = req.param('xpName');
    res.locals.query = req.param('xpName');
    res.render('clientAmazon.ejs');
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Socket IO Server Code
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
io.sockets.on("connection", function (socket) {

    var myNumber = count++; //assign number  

    var mySelf = entities[myNumber] = [myNumber, INITIAL_X+5*myNumber, INITIAL_Y, INITIAL_VEL_X, INITIAL_VEL_Y,'NULL','NULL','NULL'];

    //Send the initial position and ID to connecting player
    console.log('New Player Connected. New Player\'s ID : '+ myNumber);
    console.log('I message sent');
    socket.send('I,' + mySelf[0] + ',' + mySelf[1] + ',' + mySelf[2]);
    
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // On Acknowledgment event recieved
    //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    socket.on("ack",function(data)
    {
        
        var newData = data.split(',');
        var expName = newData[0];
        entities[myNumber][0] = newData[1];
        console.log("Player trying to reach the experiment :"+newData[0]);
        console.log("Read the Exp List .\n");
        for(var i = 0; i < experimentsList.length ; i++)
        {
            console.log("\t-- "+experimentsList[i].expName+"\n");
            if(expName == experimentsList[i].expName)
            {
                entities[myNumber][6] = experimentsList[i].expName;
                console.log("Player trying to reach the experiment :"+newData[0]);
                experimentsList[i].addPlayer('Player'+entities[myNumber][6]+'-'+myNumber);
                entities[myNumber][7] = 'Player'+entities[myNumber][6]+'-'+myNumber;

                if(experimentsList[i].roomsData.length < experimentsList[i].playersData.length / 2)
                {
                    experimentsList[i].addRoom(experimentsList[i].expName+"-Room"+experimentsList[i].roomsData.length);
                    entities[myNumber][5] = experimentsList[i].expName+"-Room"+experimentsList[i].roomsData.length;
                    socket.join(experimentsList[i].expName+"-Room"+experimentsList[i].roomsData.length);  
                    socket.send('SYNCER');
                    console.log("Player: " + entities[myNumber][0]+" has reach the experiment in room: "+entities[myNumber][5]+" and has to wait for another player");
                }
                else
                {
                    entities[myNumber][5] = experimentsList[i].expName+"-Room"+experimentsList[i].roomsData.length;
                    socket.join(experimentsList[i].expName+"-Room"+experimentsList[i].roomsData.length);  
                    
                    socket.broadcast.to(entities[myNumber][5]).emit("message",'G');
                    socket.send('G');

                    console.log("Player: " + entities[myNumber][0]+" has reach the experiment in room: "+entities[myNumber][5]);
                }

            }
        }
        if(entities[myNumber][6] != expName)
        {
            socket.send('K,');
            socket.disconnect();
            return (console.log("client kicked => the experiments desn't exist"));
        }
        //Check if a room is available and if not create a new room



        //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        //Send to conencting client the current state of all the other players
        //send initial update
        //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        for (var entity_idx = 0; entity_idx < entities.length; entity_idx++) {  
            if (entity_idx != myNumber) {
                entity = entities[entity_idx];
                if (typeof (entity) != "undefined" && entity != null && entity[5] == entities[myNumber][5]) {

                    console.log(myNumber + ' sent: C for ' + entity_idx);
                    socket.send('C,' + entity[0] + ',' + entity[1] + ',' + entity[2]); //send the client that just connected the position of all the other clients 
                }
            }
        }

        //create new entity in all clients    
        socket.broadcast.to(entities[myNumber][5]).emit("message",'C,' + mySelf[0] + ',' + mySelf[1] + ',' + mySelf[2]);   
    });

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // On Dosconnect event recieved
    //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    socket.on('disconnect', function () {
        if(entities[myNumber])
        {
        var roomToBroadcastIn = entities[myNumber][5];
        console.log("Disconnection Attempt in the experiment : "+ roomToBroadcastIn);
        console.log("Player "+myNumber+" has left the game"); 
        socket.broadcast.emit("message", 'D,'+myNumber);
        }
        socket.send('K,');
        if(entities.length > 1)
        {
            entities.splice(myNumber,1);
        }
    });
    /*
    socket.on('createXP', function(data){
        experimentsList.push(new Experiment(data,null,null))
    });
    socket.on('deleteXP', function(data){
        for(var i = 0 ; i < experimentsList.length; i++)
        {
            if(data == experimentsList[i].expName)
            {
                experimentsList.splice(i,1);
            }
        }
    });
    */
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // On Message event recieved
    //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //Messages used by the server
    // 
    // 'I'  | Init message          | tell the game to spawn the player ship on screen                      | Server  ---> Client
    // 'C'  | Connection message    | tell the other players in the room to spawn a new ship on screen      | Server  ---> Client
    // 'UM' | Update Message        | Update the player's ship position                                     | Server <---> Client
    // 'S'  | Shoot message         | A player has shot                                                     | Server <---> Client
    // 'EU' | Enemy Update Message  | Update and sychronize the position of the enemies ship's in a room    | Server <---> Client
    // 'D'  | Disconnect message    | Destroy the ship of the player who left the game                      | Server <---> Client
    // 'CR' | Create Room           | Ask the server to create a new game room (name of the room in arg)    | Server <---  Client
    // 'CU' | Create User           | Ask the server to create a new user                                   | Server <---  Client
    // 'AU' | Assign User           | Assign a user to a specific room                                      | Server <---  Client
    // 'CE' | Create Experiment     | Create a new Experiment
    //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    socket.on("message", function (data) {
        
        //Split the data string into array
        var new_data = data.split(',');
        if(entities[myNumber] != undefined)
        {
            if (new_data[0] == 'UM') 
            {
                mySelf[1] = new_data[1];
                mySelf[2] = new_data[2];
                mySelf[3] = new_data[3];
                mySelf[4] = new_data[4];

                //Update all the other clients about my update
                socket.broadcast.to(entities[myNumber][5]).emit("message",'UM,' + mySelf[0] + ',' + mySelf[1] + ',' + mySelf[2] + ',' + mySelf[3] + ',' + mySelf[4]);
            }
            else if (new_data[0] == 'S') 
            { 
                var shoot_info = [];
                shoot_info[0] = new_data[1]; //ini x
                shoot_info[1] = new_data[2]; //ini y

                shoot_info[2] = new_data[3]; //degrees

                //Update all the other clients about my update
                socket.broadcast.to(entities[myNumber][5]).emit("message",'S,' + mySelf[0] + ',' + shoot_info[0] + ',' + shoot_info[1] + ',' + shoot_info[2]);
            }
            else if(new_data[0] == 'EU')
            {
                // data[1] is first enemy X value
                // data[2] is first enemy Y value
                var enemiesPos = [];
                enemiesPos[0] = new_data[1];
                enemiesPos[1] = new_data[2];
                //console.log("Enemies Sync Message recieved");
                socket.broadcast.to(entities[myNumber][5]).emit("message",'EU,' +enemiesPos[0]+","+enemiesPos[1]);
            }
            else if(new_data[0] == 'D')
            {
                socket.disconnect();
            }
        }
    });
});


