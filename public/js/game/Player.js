var Player = function()
{
	this.isInLobby = true;
	this.score = 0;
	this.pos = {
		x: 400,
		y: 550
	};
	this.inputs = [];
	this.currentRepetition = 1;
	this.rooms = [];
	//this.gameLog = '';
	this.result = new PlayerResult();
};
Player.prototype.InitResult = function(userid, amazonid)
{
	this.result.init(userid, amazonid);
};
Player.prototype.GetResult = function()
{
	this.result.updateTotalScore(this.score);
	return this.result;
};
Player.prototype.SetGameResult = function(gameid, isSharer,total, given, kept)
{
	this.result.addGameResult(gameid, isSharer,total, given, kept);
};

if( 'undefined' != typeof global ) {
    module.exports = global.Player = Player;
}

var PlayerResult = function()
{
	this.userid;
	this.amazonId;
	this.status;
	this.totalScore;
	this.gameLog = [];

};
PlayerResult.prototype.init = function(userid, amazonId)
{
	this.userid = userid;
	this.amazonId = amazonId;
	this.totalScore = 0;
};
PlayerResult.prototype.updateStatus = function(status)
{
	this.status = status;
};
PlayerResult.prototype.updateTotalScore = function(score)
{
	this.totalScore = score;
};
PlayerResult.prototype.addGameResult = function(gameid, isSharer,total, given, kept)
{
	this.gameLog.push(new GameResult(gameid, this.currentRepetition,isSharer, total, given, kept));
};
var GameResult = function(gameid,repetition, isSharer,total, given, kept)
{
	this.gameid = gameid;
	this.repetition = repetition;
	this.gameScore = total;
	this.isSharer = isSharer;
	this.given = given;
	this.kept = kept;
};



