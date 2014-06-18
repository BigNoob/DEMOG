//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Express
// Socket.io relative variables and initialization
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var express = require('express');
var routes = require('routes');
var http = require('http');
var mail = require('nodemailer').mail;

var app = express();
var server = app.listen(process.env.PORT || 8099);
var io = require("socket.io").listen(server);
io.set('log level', 0);

app.configure(function(){
    app.set('views', __dirname + '/views');
    
    app.use(express.logger('dev'));
    app.use(express.static(__dirname + '/public'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use("/public",express.static(__dirname+"/public"));
    app.use(express.favicon(__dirname + '/public/images/favicon.ico'));
});

//console.log(server.address().port);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Global Datas, will be editable by the admin
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var experimentsList = [];
var currentExperiment = new Experiment('testXP',"WEB",[],[]);
currentExperiment.startXP();
experimentsList.push(currentExperiment);

var INITIAL_X = 400;                                        //Initial X position of a player
var INITIAL_Y = 550;                                        //Initial Y position of a player

var WAITING_STATE = "WAITING";
var RUNNING_STATE = "RUNNING";
var OVER_STATE = "OVER";
var UNEXPECTED_STATE = "UNEXPECTED";

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
//      entity[5] = Room name
//      entity[6] = Experience Name
//      entity[7] = Login
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//var ClientList = [];



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Classes declaration
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Room(roomName,firstPlayerId,secondPlayerId)
{
    this.roomName = roomName;
    this.firstPlayerId = firstPlayerId;
    this.secondPlayerId = secondPlayerId;
    this.state = WAITING_STATE;  // WAITING, RUNNING, OVER, UNEXPECTED
    this.firstPlayerX = 400;
    this.secondPlayerX = 400;
    this.shots = [];
    this.enemyPackPositionX = 148;
    this.enemyPackPositionY = 18;
    this.aliveEnemies = [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1];

    this.tick = function(){
        if(this.state == RUNNING_STATE)
        {
            setInterval(function(){
                moveEnemies();
            },300);
        }
    };

    this.moveEnemies = function(){
        console.log("enemies moved for : "+ this.roomName);
    };
}

function Experiment(expName,type,roomsData,playersData)
{
    this.expName = expName;
    this.isRunning = false;
    this.startTime = null;
    this.expType = type;
    this.maxIteration = 1;
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

    this.writeXP = function()
    {
        var tmpString = "BEGIN RESULTS \n";
        for(var i =0 ; i < roomsData.length; i ++)
        {
            tmpString += JSON.stringify(roomsData[i],null,4);
            tmpString += " \n/////////////NEXT XP///////////////// \n";
        }
        return tmpString;
    };
}

function Player()
{
    this.login = "NULL";
    this.UID = -1;
    this.points = 0;
    this.curIteration = 0;
    this.roomName = "NULL";
    this.exp = "NULL";
    this.xPos = INITIAL_X;
    this.yPos = INITIAL_Y;
}
//Array containing all the clients connected
var ClientList = [];
//Number of connected clients                    
var count = 0;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Space Coop Game Code
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////





var changeRoomState = function(_roomName,_state)
{
    for(var i = 0; i < experimentsList.length ; i++ )
    {
        for(var j = 0; j < experimentsList[i].roomsData.length ; j++)
        {
            if(experimentsList[i].roomsData[j] == _roomName)
            {
                experimentsList[i].roomsData[j] = _state;
                return true;
            }
        }
    }
    return false;
};

var findPlayerByUID = function(_playerUID)
{

};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Socket IO Server Code
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
io.sockets.on("connection", function (socket) {

    var myUID = count++; //assign number  

    
    var tmpPlayer  = new Player();
    tmpPlayer.UID = myUID;
    ClientList[myUID] = tmpPlayer;

    //Send the initial position and ID to connecting player
    console.log('New Player Connected. New Player\'s UID : '+ myUID);
    console.log(JSON.stringify(tmpPlayer, null, 4));
    console.log('I message sent');
    socket.send('I,' + tmpPlayer.UID + ',' + tmpPlayer.xPos + ',' + tmpPlayer.yPos);

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // On Acknowledgment event recieved
    //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    socket.on("ack",function(data)
    {
        
        var newData = data.split(',');
        var expName = newData[0];
        
        ClientList[myUID].UID = newData[1];

        console.log("Player trying to reach the experiment :"+newData[0]);
        console.log("Read the Exp List .\n");
        for(var i = 0; i < experimentsList.length ; i++)
        {
            console.log("\t-- "+experimentsList[i].expName+"\n");
            if(expName == experimentsList[i].expName)
            {
                ClientList[myUID].exp = experimentsList[i].expName;
                console.log("Player trying to reach the experiment :"+newData[0]);
                experimentsList[i].addPlayer('Player'+ClientList[myUID].exp+'-'+myUID);
                ClientList[myUID].login = 'Player'+ClientList[myUID].exp+'-'+myUID;

                if(experimentsList[i].roomsData.length < experimentsList[i].playersData.length / 2)
                {
                    experimentsList[i].addRoom(experimentsList[i].expName+"-Room"+experimentsList[i].roomsData.length);
                    ClientList[myUID].roomName = experimentsList[i].expName+"-Room"+experimentsList[i].roomsData.length;
                    socket.join(experimentsList[i].expName+"-Room"+experimentsList[i].roomsData.length);  
                    socket.send('SYNCER');
                    console.log("Player: " + ClientList[myUID].UID+" has reach the experiment in room: "+ClientList[myUID].roomName+" and has to wait for another player");
                }
                else
                {
                    ClientList[myUID].roomName = experimentsList[i].expName+"-Room"+experimentsList[i].roomsData.length;
                    socket.join(experimentsList[i].expName+"-Room"+experimentsList[i].roomsData.length);  
                    
                    socket.broadcast.to(ClientList[myUID].roomName).emit("message",'G');
                    socket.send('G');

                    console.log("Player: " + ClientList[myUID].UID+" has reach the experiment in room: "+ClientList[myUID].roomName);
                    console.log(changeRoomState(ClientList[myUID].roomName, RUNNING_STATE));
                }

            }
        }
        if(ClientList[myUID].exp != expName)
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
        for (var entity_idx = 0; entity_idx < ClientList.length; entity_idx++) {  
            if (ClientList[entity_idx].UID != myUID) {
                entity = ClientList[entity_idx];
                if (typeof (entity) != "undefined" && entity != null && entity.roomName == ClientList[myUID].roomName) {

                    console.log(myUID + ' sent: C for ' + entity_idx);
                    socket.send('C,' + entity.UID + ',' + entity.xPos + ',' + entity.yPos); //send the client that just connected the position of all the other clients 
                }
            }
        }

        //create new entity in all clients    
        socket.broadcast.to(ClientList[myUID].roomName).emit("message",'C,' + tmpPlayer.UID + ',' + tmpPlayer.xPos + ',' + tmpPlayer.yPos);   
    });

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // On Dosconnect event recieved
    //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    socket.on('disconnect', function () {
        if(ClientList[myUID])
        {
        var roomToBroadcastIn = ClientList[myUID].roomName;
        console.log("Disconnection Attempt in the experiment : "+ roomToBroadcastIn);
        console.log("Player "+myUID+" has left the game"); 
        socket.broadcast.emit("message", 'D,'+myUID);
        }
        socket.send('K,');
        if(ClientList.length > 1)
        {
            ClientList.splice(myUID,1);
        }
    });
    
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
    //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    socket.on("message", function (data) {
        
        //Split the data string into array
        var new_data = data.split(',');
        if(ClientList[myUID] != undefined)
        {
            if (new_data[0] == 'UM') 
            {
                tmpPlayer.xPos = new_data[1];
                tmpPlayer.yPos = new_data[2];

                //Update all the other clients about my update
                socket.broadcast.to(ClientList[myUID].roomName).emit("message",'UM,' + tmpPlayer.UID + ',' + tmpPlayer.xPos + ',' + tmpPlayer.yPos);
            }
            else if (new_data[0] == 'S') 
            { 
                var shoot_info = [];
                shoot_info[0] = new_data[1]; //ini x
                shoot_info[1] = new_data[2]; //ini y

                //Update all the other clients about my update
                socket.broadcast.to(ClientList[myUID].roomName).emit("message",'S,' + tmpPlayer.UID + ',' + shoot_info[0] + ',' + shoot_info[1]);
            }
            else if(new_data[0] == 'EU')
            {
                // data[1] is first enemy X value
                // data[2] is first enemy Y value
                var enemiesPos = [];
                enemiesPos[0] = new_data[1];
                enemiesPos[1] = new_data[2];

                socket.broadcast.to(ClientList[myUID].roomName).emit("message",'EU,' +enemiesPos[0]+","+enemiesPos[1]);
            }
            else if(new_data[0] == 'D')
            {
                socket.disconnect();
            }
        }
    });
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Express Router
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.get('/admin',function(req,res){
    res.render('admin.ejs', {exps: experimentsList});
});

app.post('/admin/add/', function(req,res){
    console.log("Admin 'addXp' Request recieved: " +req.param('xpName') +";"+ req.param('xpType'));
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
    
    var xpName = req.param('xpName');
    console.log("Admin 'startXP' Request recieved: " +xpName);
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
    
    var xpName = req.param('xpName');
    console.log("Admin 'stopXP' Request recieved: " +xpName);
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
app.post('/admin/write/:xpName', function(req,res){
    
    var xpName = req.param('xpName');
    console.log('Admin request xp results : ' +xpName);
    if(xpName != '')
    {
        for(var i =0; i < experimentsList.length; i ++)
        {
            if(experimentsList[i].expName == xpName)
            {
                /*
                mail({
                    from: "XP RESULT SENDER <olivier.allouard@gmail.com>",
                    to: "olivier.allouard@gmail.com",
                    subject: "exp results",
                    text:experimentsList[i].writeXP(),
                    html:experimentsList[i].writeXP()
                });
                */
                console.log(experimentsList[i].writeXP());
                console.log("XP Found and Wrote");
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


