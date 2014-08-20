

var Experiment = function (xpName, xpType, xpMaxIter,xpGame,lang)
{
	this.GAME_TYPES = ["space_coop","rabbits"];
	this.TYPES = ["local","amazon","web"];
	this.LANG = ["fr","en"];
	
	this.xpName = xpName;
	this.xpType = undefined;
	this.xpGame = undefined;
	this.isRunning = false;
	this.launchDate = undefined;
	
	this.language = this.LANG[1];

	this.result = new XPResults();
	
	for(var i = 0 ; i < this.TYPES.length ; i++)
	{
		if(xpType == this.TYPES[i]) { this.xpType = xpType; }	
	}
	for(var i = 0 ; i < this.GAME_TYPES.length ; i++)
	{
		if(xpGame == this.GAME_TYPES[i]) { this.xpGame = xpGame; }	
	}
	for(var i = 0 ; i < this.LANG.length ; i++)
	{
		if(lang == this.LANG[i]) { this.language = lang; }	
	}
	if(xpMaxIter > 0) { this.xpMaxIter = xpMaxIter; }
	else { this.xpMaxIter = 1; }
	
	if(this.xpType == undefined) { throw("Experiment type unrecognized. Unable to create. \n Try with one of these types : " + this.TYPES.toString()); }
	if(this.xpGame == undefined) { throw("Game unrecognized. Unable to create. \n Try with one of these games : " + this.GAME_TYPES.toString()); }
	this.xpLink = this.generateLink();
};

Experiment.prototype.generateLink = function ()
{
	if(this.xpGame == "space_coop")
	{
		return ('/homespace');
	}
	else if(this.xpGame == "rabbits")
	{
		return ('/homerabbits');
	}
};

Experiment.prototype.startXP = function()
{
	this.isRunning = true;
	this.launchDate = new Date();
	this.initResults(this.xpName, this.xpType, this.xpMaxIter, this.xpGame, this.launchDate);
};

Experiment.prototype.stopXP = function()
{
	this.isRunning = false;
	this.result.endDate = new Date();
};

Experiment.prototype.exportResults = function()
{
	if(this.isRunning == true)
	{
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
		for(var i = 0 ; i < this.result.playerResults.length; i ++)
		{
			console.log(this.result.playerResults[i]);
		}
		console.log("////////////////////////END///////////////////////");
	}
	
};
Experiment.prototype.initResults = function(xpName, xpType, xpMaxIter, xpGame, xpDate)
{
	this.result.xpName = xpName;
	this.result.xpType = xpType;
	this.result.xpGame = xpGame;
	this.result.xpMaxIter = xpMaxIter;
	this.result.beginDate = xpDate;
	this.result.playerResults = [];
	this.result.gameResults = [];
};

Experiment.prototype.addPlayerResults = function(playerResults)
{
	this.result.playerResults.push(playerResults);
};
Experiment.prototype.addGameResults = function(gameId, gamescore, player1, player2, sharer, given, kept)
{
	this.result.gameResults.push(new gameResult(gameId, gamescore, player1, player2, sharer, given, kept));
};
function XPResults()
{
	this.xpName ;
	this.xpType ;
	this.xpGame ;
	this.xpMaxIter ;
	this.beginDate ;
	this.endDate = undefined;
	this.playerResults;
	this.gameResults;
	
}

var gameResult = function(gameId, gameScore, player1, player2, sharer, given, kept)
{
	this.gameId = gameId;
	this.gameScore = gameScore;
	this.player1 = player1;
	this.player2 = player2;
	this.sharer = sharer;
	this.given = given;
	this.kept = kept;
};

if( 'undefined' != typeof global ) {
    module.exports = global.Experiment = Experiment;
}