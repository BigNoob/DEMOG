var Experiment = function (xpName, xpType, xpMaxIter,xpGame)
{
	this.GAME_TYPES = ["space_coop","rabbits"];
	this.TYPES = ["local","amazon","web"];
	this.LANG = ["fr","en"];
	this.xpName = xpName;
	this.xpType = undefined;
	this.xpGame = undefined;
	this.isRunning = false;
	this.launchDate = undefined;
	this.xpLink = this.generateLink();
	this.language = this.LANG[1];
	//this.lobby = [];
	this.players = [];
	this.result = new XPResults(this.xpName, this.xpType, this.xpMaxIter, this.xpGame, this.launchDate);

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
	//this.rooms = new RoomMaker.Room("rm1",null,null,xpGame);
	
}

Experiment.prototype.generateLink = function ()
{

	return ('/game');
};

Experiment.prototype.startXP = function()
{
	this.isRunning = true;
	this.launchDate = new Date();
	this.result = new XPResults(this.xpName, this.xpType, this.xpMaxIter, this.xpGame, this.launchDate);
};

Experiment.prototype.stopXP = function()
{
	this.isRunning = false;
	this.result.endDate = new Date();
	this.result.players = this.players;
};

Experiment.prototype.exportResults = function()
{
	if(this.result.endDate == undefined)
	{
		this.result.players = this.players;
		console.log("////////////////////XP RESULTS////////////////////");
		console.log("/////////////////////WARNING//////////////////////");
		console.log("// THIS EXPERIMENT IS STILL RUNNING !!")
		console.log("/////////////////////WARNING//////////////////////");
		console.log(this.result);
		console.log("////////////////////////END///////////////////////");
	}
	else
	{
		console.log("////////////////////XP RESULTS////////////////////");
		console.log(this.result);
		console.log("////////////////////////END///////////////////////");
	}
	
};
Experiment.prototype.addPlayerResults = function(playerResults)
{
	this.result.playerResults.push(playerResults);
}
function XPResults(xpName, xpType, xpMaxIter, xpGame, xpDate)
{
	this.xpName = xpName;
	this.xpType = xpType;
	this.xpGame = xpGame;
	this.xpMaxIter = xpMaxIter;
	this.beginDate = xpDate;
	this.endDate = undefined;
	this.playerResults = []
}


if( 'undefined' != typeof global ) {
    module.exports = global.Experiment = Experiment;
}