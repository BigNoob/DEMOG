

var Experiment = function (xpName, xpType, xpMaxIter,xpGame,lang,timeout)
{
	this.GAME_TYPES = ["space_coop","rabbits","dg"];
	this.TYPES = ["local","amazon","web"];
	this.LANG = ["fr","en"];
	
	this.xpName = xpName;
	this.xpType = undefined;
	this.xpGame = undefined;
	this.isRunning = false;
	this.launchDate = undefined;
	this.timeout = timeout * 1000; // to get timeout in ms
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
		return ('/home1');
	}
	else if(this.xpGame == "rabbits")
	{
		return ('/home3');
	}
	else if(this.xpGame == "dg")
	{
		return ('/home5');
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
Experiment.prototype.addGameResultsRabbits = function(gameId, gamescore, player1, player2, sharer, given, kept,inputP1,inputP2,p1MissedSeesaw,p2MissedSeesaw,p1DistanceSeesaw,p2DistanceSeesaw, p1BalloonsPopped,p2BalloonsPopped, gameLength)
{
	this.result.gameResults.push(new gameResultRabbits(gameId, gamescore, player1, player2, sharer, given, kept,inputP1,inputP2,p1MissedSeesaw,p2MissedSeesaw,p1DistanceSeesaw,p2DistanceSeesaw, p1BalloonsPopped,p2BalloonsPopped, gameLength));
};

Experiment.prototype.addGameResultsSpace = function(gameId, gamescore, player1, player2, sharer, given, kept,inputP1,inputP2, p1ShotsFired, p2ShotsFired, p1EnemyKilled, p2EnemyKilled, p1DistanceToMothership, p2DistanceToMothership, gameLength, gotMothership)
{
	this.result.gameResults.push(new gameResultSpace(gameId, gamescore, player1, player2, sharer, given, kept,inputP1,inputP2, p1ShotsFired, p2ShotsFired, p1EnemyKilled, p2EnemyKilled, p1DistanceToMothership, p2DistanceToMothership, gameLength, gotMothership));
};

Experiment.prototype.returnOldCLientsNum = function()
{
	if(this.result.playerResults.length)
	{
		return(this.result.playerResults.length);
	}
	else
	{
		return(0);	
	}
	
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

var gameResultRabbits = function(gameId, gameScore, player1, player2, sharer, given, kept, inputP1, inputP2, p1MissedSeesaw, p2MissedSeesaw, p1DistanceSeesaw, p2DistanceSeesaw, p1BalloonsPopped, p2BalloonsPopped, gameLength)
{
	this.gameId = gameId;
	this.gameScore = gameScore;
	this.player1 = player1;
	this.player2 = player2;
	this.sharer = sharer;
	this.given = given;
	this.kept = kept;
	this.p1Input = inputP1;
	this.p2Input = inputP2;
	this.p1MissedSeesaw = p1MissedSeesaw;
	this.p2MissedSeesaw = p2MissedSeesaw;
	this.p1DistanceSeesaw = p1DistanceSeesaw;
	this.p2DistanceSeesaw = p2DistanceSeesaw;
	this.p1BalloonsPopped = p1BalloonsPopped;
	this.p2BalloonsPopped = p2BalloonsPopped;
	this.gameLength = gameLength;
};

var gameResultSpace = function(gameId, gameScore, player1, player2, sharer, given, kept, inputP1, inputP2, p1ShotsFired, p2ShotsFired, p1EnemyKilled, p2EnemyKilled, p1DistanceToMothership, p2DistanceToMothership, gameLength, gotMothership)
{
	this.gameId = gameId;
	this.gameScore = gameScore;
	this.player1 = player1;
	this.player2 = player2;
	this.sharer = sharer;
	this.given = given;
	this.kept = kept;
	this.p1Input = inputP1;
	this.p2Input = inputP2;
	this.p1ShotsFired = p1ShotsFired;
	this.p2ShotsFired = p2ShotsFired;
	this.p1EnemyKilled = p1EnemyKilled;
	this.p2EnemyKilled = p2EnemyKilled;
	this.p1DistanceToMothership = p1DistanceToMothership;
	this.p2DistanceToMothership = p2DistanceToMothership;
	this.gameLength = gameLength;
	this.gotMothership = gotMothership;
};

if( 'undefined' != typeof global ) {
    module.exports = global.Experiment = Experiment;
}
