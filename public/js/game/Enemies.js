var Enemies = function()
{
	this.alive = [1,1,1,1,1,1,1,1,1,1];
	this.pos = {
		x: 100,
		y: 100
	};
};

if( 'undefined' != typeof global ) {
    module.exports = global.Enemies = Enemies;
}