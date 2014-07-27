var
	UUID 		= require('node-uuid'),
	io 			= require("socket.io");

require('./space_coop_core.js');
global.window = global.document = global;

var game_server = function()
{
	
	this.experiment = undefined;
	this.local_time = 0;
	this._dt = new Date().getTime();
	this._dte = new Date().getTime();
	this.messages = [];
	this.games = [];
	this.clients = [];
	this.clientsinLobby = [];
};

module.exports = global.game_server = game_server;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Main function to start and shutdown server
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// This function initialize the socket server with a given experiment
game_server.prototype.initServer = function(xp)
{
	this.experiment = xp;
	this.updateClient('ALL');
};
game_server.prototype.update = function()
{
	for(var i = 0 ; i < this.games.length; i ++)
	{
		this.games[i].update();
	}
}
//this function stop the socket server
game_server.prototype.stopServer = function()
{
	//sio = undefined;
    console.log('SIOServer is stopped');
    console.log(this.clients);
    console.log(this.clientsinLobby);
    for(var i = 0 ; i < this.clients.length; i ++)
	{
		console.log('Client forced to lobby : '+ this.clients[i].userid);
		this.sendClientToLobby(this.clients[i]);
	}
	
	for(var j = 0 ; j < this.clientsinLobby.length; j ++)
	{
		console.log('NO_XP sent to : '+ this.clientsinLobby[j].userid);
		this.clientsinLobby[j].emit("message",'NO_XP');
	}

	this.games.splice(0,this.games.length-1);
    this.experiment.isRunning = false;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Wrapping Function to send message to the core game server
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//This function send a recieved message to the on Message function of the core game server selected for the experience
game_server.prototype.onMessage = function(client, message)
{
	this.messages.push(message);
	//this.findGame(client).onMessage(message, client);
	if(!this.isClientInLobby(client))
	{
		this.games[this.getGameIndex(this.findGame(client))].onMessage(client, message);
	}	
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Basic functions to manage clients in lobby and in games
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
game_server.prototype.getClientIndexFromLobby = function(client)
{
	for(var i =0 ; i < this.clientsinLobby.length; i ++)
	{
		if(client.userid == this.clientsinLobby[i].userid)
		{
			return i;
		}
	}
};
game_server.prototype.isClientInLobby = function(client)
{
	for(var i =0 ; i < this.clientsinLobby.length; i ++)
	{
		if(client.userid == this.clientsinLobby[i].userid)
		{
			return true;
		}
	}
	return false;
}
game_server.prototype.getClientIndexFromGame = function(client)
{
	for(var i =0 ; i < this.clients.length; i ++)
	{
		if(client.userid == this.clients[i].userid)
		{
			return i;
		}
	}
};

game_server.prototype.findClientInGame = function(client)
{

};

game_server.prototype.sendClientToLobby = function(client)
{
	this.clients.splice(this.getClientIndexFromGame(client),1);
	client.player.isInLobby = true;
	this.clientsinLobby.push(client);
	client.emit('message', 'LOBBY');
};

game_server.prototype.removeCientFromLobby = function(client)
{
	client.player.isInLobby = false;
	this.clients.push(client);
	this.clientsinLobby.splice(this.getClientIndexFromLobby(client),1);
};

//this function adds a client to the server
game_server.prototype.addClient = function(client)
{
	this.clientsinLobby.push(client);
	//this.sendClientToLobby(client);
	console.log(client.userid + " has been sent to the lobby");
};

//this function removes a client from the server
game_server.prototype.removeClient = function(client)
{
	this.sendClientToLobby(client);
	this.clientsinLobby.splice(this.getClientIndexFromLobby(client),1);
};

//this function sends client information to the html client page
game_server.prototype.updateClient = function(client)
{
	if(client != 'ALL')
	{
		client.emit('message', 'INFO,'+client.userid+','+client.player.currentRepetition+','+client.player.score+','+this.experiment.xpName+','+this.experiment.xpMaxIter+','+this.experiment.xpGame);
	}
	else
	{
		for(var i = 0 ; i < this.clientsinLobby.length; i ++)
		{
			client = this.clientsinLobby[i];
			client.emit('message', 'INFO,'+client.userid+','+client.player.currentRepetition+','+client.player.score+','+this.experiment.xpName+','+this.experiment.xpMaxIter+','+this.experiment.xpGame);
		}
		for(var j = 0 ; j < this.clients.length; j ++)
		{
			client = this.clientsinLobby[j];
			client.emit('message', 'INFO,'+client.userid+','+client.player.currentRepetition+','+client.player.score+','+this.experiment.xpName+','+this.experiment.xpMaxIter+','+this.experiment.xpGame);
		}
	}
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Basic functions to manage games
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

game_server.prototype.getGameIndex = function(game)
{
	for(var i =0 ; i < this.games.length; i ++)
	{
		if(game.id == this.games[i].id)
		{
			return i;
		}
	}
};
//This function create an instance of the core game server selected for the experience
game_server.prototype.createGame = function(client1, client2)
{
	var tmpGame;
	switch(this.experiment.xpGame)
	{
		case "space_coop":
			tmpGame = new space_game_core();
		break;
		case "rabbits":
			tmpGame = new space_game_core();
		break;
	}

	this.games.push(tmpGame);
	this.games[this.games.length - 1].id = new UUID();
	this.games[this.games.length - 1].p1 = client1;
	this.games[this.games.length - 1].p2 = client2;
	this.games[this.games.length - 1].beginInit();
	
	this.removeCientFromLobby(client1);
	this.removeCientFromLobby(client2);
	
};

//this function stops a selected core game server instance
game_server.prototype.endGame = function(game)
{

	this.sendClientToLobby(this.games[this.getGameIndex(game)].p1);
	this.sendClientToLobby(this.games[this.getGameIndex(game)].p2);
	this.games.splice(this.getGameIndex(game),1);

};

//this function starts a selected core game server instance
game_server.prototype.startGame = function(game)
{

};

//this function finds a selected core game server instance based one of its client
game_server.prototype.findGame = function(client)
{
	for(var i = 0; i < this.games.length; i ++)
	{
		if(this.games[i].p1.userid == client.userid || this.games[i].p2.userid == client.userid)
		{
			return this.games[i]
		}
	}
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Function to match players in lobby and send them in games.
//		This function is called at a fixed time interval from app.js
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//This function is used to match clients in the lobby to create a new games
game_server.prototype.matchClients = function()
{
	//console.log(parseInt(this.clientsinLobby.length / 2));
	if(parseInt(this.clientsinLobby.length / 2) > 0)
	{
		for(var i = 0; i < parseInt(this.clientsinLobby.length / 2); i++)
			{

				this.createGame(this.clientsinLobby[i*2],this.clientsinLobby[(i*2)+1]);
				//this.removeCientFromLobby(this.clientsinLobby[(i*2)+1]);
				//this.removeCientFromLobby(this.clientsinLobby[i*2]);

				for(var j = 0; j < this.games.length; j ++)
				{
					console.log("game n°"+j);
					console.log('\t' +this.games[j].id);
					console.log('\t\t' +this.games[j].p1.userid);
					console.log('\t\t' +this.games[j].p2.userid);
				}

			}
		
		
	}	
};



