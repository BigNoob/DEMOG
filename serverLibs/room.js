function Room(rmName, player1, player2, game)
{
	this.STATUS_RUNNING = "running";
	this.STATUS_OVER = "over";
	this.STATUS_WAITING = "wait";
	this.STATUS_UNEXPECTED = "unexpected";

	this.rmName = rmName;
	this.rmStatus = this.STATUS_WAITING;
	this.player1 = player1;
	this.player2 = player2;
	this.winner = undefined;
	this.rmGame = game;
	this.gainsP1 = 0;
	this.gainsP2 = 0;
}

Room.prototype.tick = function(delta)
{

};

Room.prototype.onInput = function(player,input)
{

}

exports.Room = Room;