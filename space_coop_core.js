require('./public/js/game/Player.js');
require('./public/js/game/Enemies.js');

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Varibles declaration
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var frame_time = 15;
var physic_time = 60;
var ship_speed = 10;
var enemy_speed = 8;
var mother_speed = 15;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Space Invaders Game Core Constructor
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var space_game_core = function()
{
    this.id =undefined;
	this.viewport;
	this.world = 
		{
            width : 800,
            height : 600
        };
    this.p1 = undefined;
    this.p2 = undefined;
    this.enemies = new Enemies();
    this.motherShip = undefined;
    this.score = 0;
    this.inputs = [];
    this.p1ShipX = 400;
    this.p2ShipX = 400;
    this.enemiesX = 100;
    this.mothershipX = 100;
    this.enemiesLeft = false;
    this.mothershipLeft = false;
    
};

module.exports = global.space_game_core = space_game_core;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//   Update Message Anatomy
//      Element 0 = 'UPDATE'
//      Element 1 = own ship x
//      Element 2 = ally ship x
//      Element 3 = enemy pack x
//      Element 4 = mothership x
//      Element 5 --> End = shots
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
space_game_core.prototype.update = function(t) {

    if(this.enemiesX > 250 && !this.enemiesLeft)
    {
        this.enemiesLeft = true;
    }
    if(this.enemiesX < 50 && this.enemiesLeft)
    {
        this.enemiesLeft = false;
    }

    if( Math.random() > 0.95)
    {
        this.mothershipLeft = !this.mothershipLeft;
    }

    if(this.mothershipX > 650 && !this.mothershipLeft)
    {
        this.mothershipLeft = true;
    }
    if(this.mothershipX < 50 && this.mothershipLeft)
    {
        this.mothershipLeft = false;
    }

    this.moveEnemies();
    this.p1.emit("message",'UPDATE,'+this.p1ShipX+','+this.p2ShipX+','+this.enemiesX+','+this.mothershipX+',');
    this.p2.emit("message",'UPDATE,'+this.p2ShipX+','+this.p1ShipX+','+this.enemiesX+','+this.mothershipX+',');
}; //game_core.update

space_game_core.prototype.moveEnemies = function()
{
    if(this.enemiesLeft)
    {
        this.enemiesX -= enemy_speed;
    }
    else
    {
        this.enemiesX += enemy_speed;
    }

    if(this.mothershipLeft)
    {
        this.mothershipX -= mother_speed;
    }
    else
    {
        this.mothershipX += mother_speed;
    }
};

space_game_core.prototype.beginInit = function()
{
    this.beginGame();
};
space_game_core.prototype.beginGame = function()
{
    this.p1.emit('message', 'GAME_START');
    this.p2.emit('message', 'GAME_START'); 
};
space_game_core.prototype.beginShare = function(client)
{
    if(client.userid == this.p1.userid)
    {
        this.p1.emit('message', 'SHARE_STATE');
        this.p2.emit('message', 'SHARE_WAIT');
    }
    else
    {
        this.p1.emit('message', 'SHARE_WAIT');
        this.p2.emit('message', 'SHARE_STATE');
    }
};

space_game_core.prototype.onInput = function(client, data){
    
    if(client.userid == this.p1.userid)
    {
        //console.log('p1');
        if(data[1] == '1')
        {
            //console.log('left');
            this.p1ShipX -= ship_speed;
        }
        if(data[2] == '1')
        {
            //console.log('right');
           this.p1ShipX += ship_speed; 
        }
        if(data[3] == '1')
        {
            
        }
    }
    else
    {
        //console.log('p2');
        if(data[1] == '1')
        {
            this.p2ShipX -= ship_speed;
        }
        if(data[2] == '1')
        {
           this.p2ShipX += ship_speed; 
        }
        if(data[3] == '1')
        {
            
        }
    }
    //console.log(this.p1ShipX);
    //console.log(this.p2ShipX);
    //this.update(10);
};

space_game_core.prototype.computeWorld = function()
{

};

space_game_core.prototype.debugScore = function()
{
    this.score += 1000;
    console.log("game : "+this.id + " points is : "+ this.score)
};

space_game_core.prototype.debugShare = function(client)
{
    this.beginShare(client);
};

space_game_core.prototype.debugEndGame = function()
{
    this.p1.player.score = this.score / 2;
    this.p2.player.score = this.score / 2;

    this.p1.player.currentRepetition ++;
    this.p2.player.currentRepetition ++;


    this.p1.emit('message', 'LOBBY');
    this.p2.emit('message', 'LOBBY');
};

space_game_core.prototype.onMessage = function(client, data){
    //console.log('message recieved by game : '+ this.id);

    var splittedData = data.split(',');
    console.log('message '+ splittedData);
    switch (splittedData[0])
    {
        case 'INPUT':
            this.onInput(client, splittedData);
        break;
        case 'SCORE':
            //this.debugScore();
        break;
        case 'SHARE':
            //this.debugShare(client);
        break;
        case 'END':
            //this.debugEndGame();
        break;
    }
};


