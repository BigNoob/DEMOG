var player = function()
{
	this.score = 0;
	this.currentRepetition = 1;
	this.result = new PlayerResult();
};

player.prototype.InitResult = function(userid, amazonid)
{
	this.result.init(userid, amazonid);
};

player.prototype.GetResult = function()
{
	this.result.updateTotalScore(this.score);
	return this.result;
};

player.prototype.SetGameResultRabbits = function(gameid, isSharer,total, given, kept, timesMissed, distanceSeesaw, balloonsPopped, gameLength, isP1)
{
	this.result.addGameResultRabbits(gameid,this.currentRepetition, isSharer,total, given, kept, this.score, timesMissed, distanceSeesaw, balloonsPopped, gameLength, isP1);
};

player.prototype.SetGameResultSpace = function(gameid, isSharer,total, given, kept, p1ShotsFired,p2ShotsFired, p1EnemyKilled, p2EnemyKilled, p1DistanceToMothership, p2DistanceToMothership, gameLength, isP1)
{
	this.result.addGameResultSpace(gameid,this.currentRepetition, isSharer,total, given, kept, this.score, p1ShotsFired, p2ShotsFired, p1EnemyKilled, p2EnemyKilled, p1DistanceToMothership, p2DistanceToMothership, gameLength, isP1);
};

var PlayerResult = function()
{
	this.userid;
	this.amazonId;
	this.status;
	this.totalScore;
	this.gameLog;
	this.lostPartner;
	this.IPaddress;
	this.WaitingTimeLobby1;
	this.WaitingTimeLobby2;
	this.currentGame;
};

PlayerResult.prototype.init = function(userid, amazonId)
{
	this.userid = userid;
	this.amazonId = amazonId;
	this.totalScore = -1;
	this.gameLog = [];
	this.lostPartner = -1;
	this.IPaddress = -1;
	this.WaitingTimeLobby1 = -1;
	this.WaitingTimeLobby2 = -1;
	this.currentGame = 1;
};

PlayerResult.prototype.updateStatus = function(status)
{
	this.status = status;
};

PlayerResult.prototype.updateTotalScore = function(score)
{
	this.totalScore = score;
};

PlayerResult.prototype.updateIP = function(ip)
{
	this.IPaddress = ip;
};

PlayerResult.prototype.addGameResultRabbits = function(gameid,currentRepetition, isSharer,total, given, kept, presentScore,timesMissed,distanceSeesaw,balloonsPopped, gameLength, isP1)
{
	this.gameLog.push(new GameResultRabbits(gameid, currentRepetition,isSharer, total, given, kept, presentScore,timesMissed,distanceSeesaw,balloonsPopped, gameLength, isP1));
};

PlayerResult.prototype.addGameResultSpace = function(gameid,currentRepetition, isSharer,total, given, kept, presentScore,p1ShotsFired,p2ShotsFired, p1EnemyKilled, p2EnemyKilled, p1DistanceToMothership, p2DistanceToMothership, gameLength, isP1)
{
	this.gameLog.push(new GameResultSpace(gameid, currentRepetition,isSharer, total, given, kept, presentScore,p1ShotsFired,p2ShotsFired, p1EnemyKilled, p2EnemyKilled, p1DistanceToMothership, p2DistanceToMothership, gameLength, isP1));
};

var GameResultRabbits = function(gameid,repetition, isSharer,total, given, kept, presentScore, timesMissed,distanceSeesaw,balloonsPopped, gameLength, isP1)
{
	this.gameid = gameid;
	this.repetition = repetition;
	this.gameScore = total;
	this.isSharer = isSharer;
	this.given = given;
	this.kept = kept;
	this.presentScore = presentScore;
	this.timesMissed = timesMissed;
	this.distanceSeesaw = distanceSeesaw;
	this.balloonsPopped = balloonsPopped;
	this.gameLength = gameLength;
	this.isP1 = isP1;
};

var GameResultSpace = function(gameid,repetition, isSharer,total, given, kept, presentScore, p1ShotsFired,p2ShotsFired, p1EnemyKilled, p2EnemyKilled, p1DistanceToMothership, p2DistanceToMothership, gameLength, isP1)
{
	this.gameid = gameid;
	this.repetition = repetition;
	this.gameScore = total;
	this.isSharer = isSharer;
	this.given = given;
	this.kept = kept;
	this.presentScore = presentScore;
	this.p1ShotsFired = p1ShotsFired;
	this.p2ShotsFired = p2ShotsFired;
	this.p1EnemyKilled = p1EnemyKilled;
	this.p2EnemyKilled = p2EnemyKilled;
	this.p1DistanceToMothership = p1DistanceToMothership;
	this.p2DistanceToMothership = p2DistanceToMothership;
	this.gameLength = gameLength;
	this.isP1 = isP1;
};

if( 'undefined' != typeof global ) {
    module.exports = global.player = player;
}

