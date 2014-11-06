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

player.prototype.SetGameResultRabbits = function(gameid, isSharer,total, given, kept, timesMissed, distanceSeesaw, balloonsPopped)
{
	this.result.addGameResultRabbits(gameid,this.currentRepetition, isSharer,total, given, kept, this.score, timesMissed, distanceSeesaw, balloonsPopped);
};

player.prototype.SetGameResultSpace = function(gameid, isSharer,total, given, kept, p1ShotsFired,p2ShotsFired, p1EnemyKilled, p2EnemyKilled, p1DistanceToMothership, p2DistanceToMothership)
{
	this.result.addGameResultSpace(gameid,this.currentRepetition, isSharer,total, given, kept, this.score, p1ShotsFired, p2ShotsFired, p1EnemyKilled, p2EnemyKilled, p1DistanceToMothership, p2DistanceToMothership);
};

var PlayerResult = function()
{
	this.userid;
	this.amazonId;
	this.status;
	this.totalScore;
	this.gameLog;

};

PlayerResult.prototype.init = function(userid, amazonId)
{
	this.userid = userid;
	this.amazonId = amazonId;
	this.totalScore = 0;
	this.gameLog = [];
};

PlayerResult.prototype.updateStatus = function(status)
{
	this.status = status;
};

PlayerResult.prototype.updateTotalScore = function(score)
{
	this.totalScore = score;
};

PlayerResult.prototype.addGameResultRabbits = function(gameid,currentRepetition, isSharer,total, given, kept, presentScore,timesMissed,distanceSeesaw,balloonsPopped)
{
	this.gameLog.push(new GameResultRabbits(gameid, currentRepetition,isSharer, total, given, kept, presentScore,timesMissed,distanceSeesaw,balloonsPopped));
};

PlayerResult.prototype.addGameResultSpace = function(gameid,currentRepetition, isSharer,total, given, kept, presentScore,p1ShotsFired,p2ShotsFired, p1EnemyKilled, p2EnemyKilled, p1DistanceToMothership, p2DistanceToMothership)
{
	this.gameLog.push(new GameResultSpace(gameid, currentRepetition,isSharer, total, given, kept, presentScore,p1ShotsFired,p2ShotsFired, p1EnemyKilled, p2EnemyKilled, p1DistanceToMothership, p2DistanceToMothership));
};

var GameResultRabbits = function(gameid,repetition, isSharer,total, given, kept, presentScore, timesMissed,distanceSeesaw,balloonsPopped)
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
};

var GameResultSpace = function(gameid,repetition, isSharer,total, given, kept, presentScore, p1ShotsFired,p2ShotsFired, p1EnemyKilled, p2EnemyKilled, p1DistanceToMothership, p2DistanceToMothership)
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
};

if( 'undefined' != typeof global ) {
    module.exports = global.player = player;
}

