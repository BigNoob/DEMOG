var
	UUID 		= require('node-uuid'),
	io 			= require("socket.io");

require('./space_coop_core.js');
require('./rabbits_coop_core.js');
global.window = global.document = global;

var game_server = function()
{
	this.experiment = undefined;
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
	this.experiment.initResults();
	//this.updateClient('ALL');
};
game_server.prototype.update = function()
{
	for(var i = 0 ; i < this.games.length; i ++)
	{
		this.games[i].update();
	}
};
game_server.prototype.physic_update = function(physic_time)
{
	for(var i = 0 ; i < this.games.length; i ++)
	{
		this.games[i].physic_update(physic_time);
	}
};
//this function stops the socket server
game_server.prototype.stopServer = function()
{
    //console.log('SIOServer is stopped');

	for(var i = this.clients.length-1 ; i >= 0; i --)
	{
		//console.log('Client forced to lobby : '+ this.clients[i].userid);
		this.fromGameToLobby(this.clients[i],'');
	}


	for(var j = this.clientsinLobby.length - 1 ; j >= 0; j --)
	{
		//console.log('NO_XP sent to : '+ this.clientsinLobby[j].userid);
		this.clientsinLobby[j].emit("message",'NO_XP');
	}

	this.games = [];
	this.clients = [];
	this.clientsinLobby = [];
	//console.log(this.experiment.exportResults());
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
};
game_server.prototype.isClientInGame = function(client)
{
	for(var i =0 ; i < this.clients.length; i ++)
	{
		if(client.userid == this.clients[i].userid)
		{
			return true;
		}
	}
	return false;
};
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

//Send a client from a game to the lobby 
game_server.prototype.fromGameToLobby = function(client,disconnection)
{
	this.clients.splice(this.getClientIndexFromGame(client),1);
	client.player.isInLobby = true;
	this.clientsinLobby.push(client);
	client.emit('message', 'LOBBY,'+client+','+disconnection);
};


//Send a client from the lobby to a game state 
game_server.prototype.fromLobbyToGame = function(client)
{
	client.player.isInLobby = false;
	this.clients.push(client);
	this.clientsinLobby.splice(this.getClientIndexFromLobby(client),1);
};

//this function adds a client to the server
game_server.prototype.addClient = function(client)
{
	if(this.experiment.isRunning)
	{
		this.clientsinLobby.push(client);
		//console.log(client.userid + " has been sent to the lobby");
		//this.updateClient(client);
	}
	else
	{
		client.emit("message",'NO_XP');
	}
};

//this function removes a client from the server when in the lobby 
game_server.prototype.fromLobbyToOut = function(client)
{
	this.clientsinLobby.splice(this.getClientIndexFromLobby(client),1);
};

//this function removes a client from the server when in the game 
game_server.prototype.fromGameToOut = function(client)
{
	this.clients.splice(this.getClientIndexFromGame(client),1);
};


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Basic functions to manage games
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// return the index of the game in the games array
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
			tmpGame = new space_game_core(this.experiment.xpMaxIter,"");
		break;
		case "dg":
			tmpGame = new space_game_core(this.experiment.xpMaxIter,"dg");
		break;
		case "rabbits":
			tmpGame = new rabbits_game_core(this.experiment.xpMaxIter,"");
		break;
	}

	this.games.push(tmpGame);
	this.games[this.games.length - 1].id = UUID();
	this.games[this.games.length - 1].p1 = client1;
	this.games[this.games.length - 1].p2 = client2;
	this.games[this.games.length - 1].beginInit();
	//console.log('after begin init');
	
	this.fromLobbyToGame(client1);
	this.fromLobbyToGame(client2);
	
};

//this function stops a selected core game server instance
game_server.prototype.endGame = function(game,disconnection,client)
{
	//this.updateClient('ALL');
    if (disconnection == 'disconnection')
	{
		if(this.games[this.getGameIndex(game)].p1.userid == client.userid) //if player 1 disconnects we send player 2 to lobby
		{
			this.fromGameToLobby(this.games[this.getGameIndex(game)].p2,disconnection);
		}
		else if(this.games[this.getGameIndex(game)].p2.userid == client.userid)
		{
			this.fromGameToLobby(this.games[this.getGameIndex(game)].p1,disconnection);
		}
	} else
	{
		if(this.games[this.getGameIndex(game)].p1 != null)
		{
			this.fromGameToLobby(this.games[this.getGameIndex(game)].p1,disconnection);
		}
		if(this.games[this.getGameIndex(game)].p2 != null)
		{
			this.fromGameToLobby(this.games[this.getGameIndex(game)].p2,disconnection);
		}
	}
	this.games.splice(this.getGameIndex(game),1);
};

//this function finds partner of player
game_server.prototype.findPartner = function(game,client)
{
		if(game.p1.userid == client.userid)
		{
			game.p2.emit('partnerLost'); //those messages go to app.js through main_..._client.js in which they need to be relayed

		} else
		{
			game.p1.emit('partnerLost');
		}	

};

//this function finds a selected core game server instance based one of its client
game_server.prototype.findGame = function(client)
{
	for(var i = 0; i < this.games.length; i ++)
	{
		if(this.games[i].p1.userid == client.userid || this.games[i].p2.userid == client.userid)
		{
			return this.games[i];
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
	if(parseInt(this.clientsinLobby.length / 2) > 0)
	{
		for(var i = 0; i < parseInt(this.clientsinLobby.length / 2); i++)
		{

			this.createGame(this.clientsinLobby[i*2],this.clientsinLobby[(i*2)+1]);
			
		}
	}	
};

//Browse the games to check which ones are finished
game_server.prototype.checkEndedGames = function()
{
	for(var i = 0; i < this.games.length; i ++)
	{
		if(this.games[i].isEnded)
		{
			
	        //this.updateClient(this.games[i].p1);
	        //this.updateClient(this.games[i].p2);
			if (this.experiment.xpGame == "rabbits")
			{
	        	this.experiment.addGameResultsRabbits(this.games[i].id, this.games[i].score, this.games[i].p1.userid, this.games[i].p2.userid, this.games[i].sharer.userid, this.games[i].given, this.games[i].kept,this.games[i].inputsP1,this.games[i].inputsP2,this.games[i].p1MissedSeesaw,this.games[i].p2MissedSeesaw,this.games[i].p1DistanceSeesaw,this.games[i].p2DistanceSeesaw,this.games[i].p1BalloonsPopped,this.games[i].p2BalloonsPopped, this.games[i].gameLength);
			}
			else 
			{
				this.experiment.addGameResultsSpace(this.games[i].id, this.games[i].score, this.games[i].p1.userid, this.games[i].p2.userid, this.games[i].sharer.userid, this.games[i].given, this.games[i].kept,this.games[i].inputsP1,this.games[i].inputsP2, this.games[i].p1ShotsFired, this.games[i].p2ShotsFired,  this.games[i].p1EnemyKilled, this.games[i].p2EnemyKilled, this.games[i].p1DistanceToMothership, this.games[i].p2DistanceToMothership, this.games[i].gameLength, this.games[i].gotMothership);
			
			}

			if(this.games[i].p1.player.currentRepetition > this.experiment.xpMaxIter)
		    {

		    	this.experiment.addPlayerResults(this.games[i].p1.player.GetResult());

		    	this.games[i].p1.emit('message','REDIRECT');

		        this.fromGameToOut(this.games[i].p1);
		        this.games[i].p1 = null;
		    }
		    if(this.games[i].p2.player.currentRepetition > this.experiment.xpMaxIter)
		    {
				
			    this.experiment.addPlayerResults(this.games[i].p2.player.GetResult());

		    	this.games[i].p2.emit('message','REDIRECT');

		        this.fromGameToOut(this.games[i].p2);
		        this.games[i].p2 = null;
		    }
			this.endGame(this.games[i],'',undefined);

			console.log(this.experiment.result.gameResults);
		}
	}
};



