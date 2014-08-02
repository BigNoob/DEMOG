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
	this.gameLog = '';
};
Player.prototype.InitResult = function(userid)
{
	this.gameLog += 'userid : '+userid+'\n';
};
Player.prototype.GetResult = function()
{
	return this.gameLog;
};
Player.prototype.SetGameResult = function(gameid, isSharer,total, given, kept)
{
	this.gameLog += 'GameId : '+gameid+'\n currentRepetition : '+this.currentRepetition+'\n';
	if(isSharer)
	{
		this.gameLog += 'shared points.\n\t Total : '+total+'\n\t gave : '+given+'\n\t kept :'+kept+'\n Score is now : '+this.score;
	}
	else
	{
		this.gameLog += 'recieved points.\n\t Total : '+total+'\n\t recieved : '+given+'\n Score is now : '+this.score;
	}
};

if( 'undefined' != typeof global ) {
    module.exports = global.Player = Player;
}