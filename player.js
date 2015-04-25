function ISODateString(d){
    function pad(n){return n<10 ? '0'+n : n}
    return d.getUTCFullYear()+'-'
    + pad(d.getUTCMonth()+1)+'-'
    + pad(d.getUTCDate())+'T'
    + pad(d.getUTCHours())+':'
    + pad(d.getUTCMinutes())+':'
    + pad(d.getUTCSeconds())+'Z'
}

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

player.prototype.SetGameResultSpace = function(gameid, isSharer,total, given, kept, shotsFired, enemyKilled, distanceToMothership, gameLength, isP1, gotMothership)
{
	this.result.addGameResultSpace(gameid,this.currentRepetition, isSharer,total, given, kept, this.score, shotsFired, enemyKilled, distanceToMothership, gameLength, isP1, gotMothership);
};

var PlayerResult = function()
{
	this.amazonId;
	this.userid;
	this.firstConnection;
	this.status;
	this.lostPartner;
	this.IPaddress;
	this.WaitingTimeLobby1;
	this.WaitingTimeLobby2;
	this.currentGame;
	this.timedOut;
	this.tabActive;
	this.switchTabNum;
	this.gameLog;
};

PlayerResult.prototype.init = function(userid, amazonId)
{
	this.amazonId = amazonId;
	this.totalScore = -1;
	this.userid = userid;
	this.firstConnection = ISODateString(new Date());
	this.lostPartner = -1;
	this.IPaddress = -1;
	this.WaitingTimeLobby1 = new Date().getTime();
	this.WaitingTimeLobby2 = new Date().getTime();
	this.currentGame = 1;
	this.timedOut = false;
	this.tabActive = true;
	this.switchTabNum = 0;
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

PlayerResult.prototype.updateIP = function(ip)
{
	this.IPaddress = ip;
};

PlayerResult.prototype.addGameResultRabbits = function(gameid,currentRepetition, isSharer,total, given, kept, presentScore,timesMissed,distanceSeesaw,balloonsPopped, gameLength, isP1)
{
	this.gameLog.push(new GameResultRabbits(gameid, currentRepetition,isSharer, total, given, kept, presentScore,timesMissed,distanceSeesaw,balloonsPopped, gameLength, isP1));
};

PlayerResult.prototype.addGameResultSpace = function(gameid,currentRepetition, isSharer,total, given, kept, presentScore,shotsFired, enemyKilled, distanceToMothership, gameLength, isP1, gotMothership)
{
	this.gameLog.push(new GameResultSpace(gameid, currentRepetition,isSharer, total, given, kept, presentScore,shotsFired, enemyKilled, distanceToMothership, gameLength, isP1, gotMothership));
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

var GameResultSpace = function(gameid, repetition, isSharer,total, given, kept, presentScore, shotsFired, enemyKilled, distanceToMothership, gameLength, isP1, gotMothership)
{
	this.gameid = gameid;
	this.repetition = repetition;
	this.gameScore = total;
	this.isSharer = isSharer;
	this.given = given;
	this.kept = kept;
	this.presentScore = presentScore;
	this.shotsFired = shotsFired;
	this.enemyKilled = enemyKilled;
	this.distanceToMothership = distanceToMothership;
	this.gameLength = gameLength;
	this.isP1 = isP1;
    this.gotMothership = gotMothership;
};

if( 'undefined' != typeof global ) {
    module.exports = global.player = player;
}

