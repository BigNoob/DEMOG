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
};


if( 'undefined' != typeof global ) {
    module.exports = global.Player = Player;
}