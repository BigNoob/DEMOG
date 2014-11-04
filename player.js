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

player.prototype.SetGameResult = function(gameid, isSharer,total, given, kept, timesMissed)
{
	this.result.addGameResult(gameid,this.currentRepetition, isSharer,total, given, kept, this.score, timesMissed);
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

PlayerResult.prototype.addGameResult = function(gameid,currentRepetition, isSharer,total, given, kept, presentScore,timesMissed)
{
	this.gameLog.push(new GameResult(gameid, currentRepetition,isSharer, total, given, kept, presentScore,timesMissed));
};

var GameResult = function(gameid,repetition, isSharer,total, given, kept, presentScore, timesMissed)
{
	this.gameid = gameid;
	this.repetition = repetition;
	this.gameScore = total;
	this.isSharer = isSharer;
	this.given = given;
	this.kept = kept;
	this.presentScore = presentScore;
	this.timesMissed = 
};

if( 'undefined' != typeof global ) {
    module.exports = global.player = player;
}

