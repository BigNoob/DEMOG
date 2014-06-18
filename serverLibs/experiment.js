function Experiment (xpName, xpType, xpMaxIter,xpGame)
{
	this.GAME_TYPES = ["space_coop","rabbits"];
	this.TYPES = ["local","amazon","web"];

	this.xpName = xpName;
	this.xpType = undefined;
	this.xpGame = undefined;
	this.isRunning = false;
	this.launchDate = undefined;
	this.rooms = [];
	this.lobby = [];
	this.players = [];
	this.result = undefined;

	for(var i = 0 ; i < this.TYPES.length ; i++)
	{
		if(xpType == this.TYPES[i])
		{
			this.xpType = xpType;
		}	
	}
	for(var i = 0 ; i < this.GAME_TYPES.length ; i++)
	{
		if(xpGame == this.GAME_TYPES[i])
		{
			this.xpGame = xpGame;
		}	
	}

	if(xpMaxIter > 0)
	{
		this.xpMaxIter = xpMaxIter;		
	}
	else
	{
		this.xpMaxIter = 1;
	}
	
	if(this.xpType == undefined)
	{
		throw("Experiment type unrecognized. Unable to create. \n Try with one of these types : " + this.TYPES.toString());
	}
	if(this.xpGame == undefined)
	{
		throw("Game unrecognized. Unable to create. \n Try with one of these games : " + this.GAME_TYPES.toString());
	}
	
}

function XPResults(xpName, xpType, xpMaxIter, xpGame, xpDate)
{
	this.xpName = xpName;
	this.xpType = xpType;
	this.xpGame = xpGame;
	this.xpMaxIter = xpMaxIter;
	this.beginDate = xpDate;
	this.endDate = undefined;
}

Experiment.prototype.startXp = function()
{
	this.isRunning = true;
	this.launchDate = new Date();
	this.result = new XPResults(this.xpName, this.xpType, this.xpMaxIter, this.xpGame, this.launchDate);
};

Experiment.prototype.exportResults = function()
{
	this.isRunning = false;
	this.result.endDate = new Date();
	this.result.players = this.players;
	console.log("////////////////////XP RESULTS////////////////////");
	console.log(this.result);
	console.log("////////////////////////END///////////////////////");
};

Experiment.prototype.fillRooms = function()
{

};

Experiment.prototype.kickPlayer = function(UID)
{

};

exports.Experiment = Experiment;

