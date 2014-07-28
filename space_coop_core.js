require('./public/js/game/Player.js');
var UUID        = require('node-uuid');
//require('./public/js/game/Enemies.js');

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Varibles declaration
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var frame_time = 15;
var physic_time = 60;

var ship_speed = 4;
var enemy_speed = 3;
var mother_speed = 5;
var shot_speed = 6;

var mothershipY = 20;
var ship_width = 18;
var enemy_width = 16;
var mother_width = 64;
var shot_width = 10;

var ship_height = 33;
var enemy_height = 16;
var mother_height = 96;
var shot_height = 8;

var lines = 3;
var number = 10;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Space Invaders Game Core Constructor
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var space_game_core = function()
{
    this.id =undefined;
	this.viewport;
    this.isEnded = false;
	this.world = 
		{
            width : 800,
            height : 600
        };
    this.p1 = undefined;
    this.p2 = undefined;
    this.enemiesX = 100;
    this.enemies = new Enemies(this.enemiesX,lines,number);
    this.motherShip = undefined;
    this.score = 0;
    this.inputs = [];
    this.p1ShipX = 400;
    this.p2ShipX = 400;
    
    this.mothershipX = 100;
    this.motherShipAlive = true;
    this.enemiesLeft = false;
    this.mothershipLeft = false;
    this.shots = [];
    this.shotNum = 0;

    this.bpuT = new Date();
    this.apuT = new Date();
};

//This line is used to tell node.js that he can access the constructor
module.exports = global.space_game_core = space_game_core;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Game Objects constructors
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var Enemies = function(x,lines,number)
{
    this.x = x;
    this.array = [];
    this.lines = lines;
    this.number = number;
    this.tmpX;
    this.tmpY;
    this.alive = true;
    this.numEnemies = this.lines * this.number;
};
Enemies.prototype.Init = function()
{
    for(var j = 0; j < this.lines; j++)
    {
        for(var i = 0; i < this.number; i ++)
        {
            this.tmpX = i * 50 + this.x;
            this.tmpY = j * 50;
            //console.log(this.tmpX+";"+this.tmpY);
            this.array.push(new Enemy(this.tmpX,this.tmpY));
        }
    } 
    //console.log(this.array);
};
Enemies.prototype.Move = function(x)
{
    for(var i = 0 ; i < this.array.length; i ++)
    {
        this.array[i].x += x;
    }
};
Enemies.prototype.KillEnemy = function(i)
{
    this.array[i].alive = false;
    this.numEnemies --;
};
var Enemy = function(x,y)
{
    this.rect = new Rect(x,y,enemy_width,enemy_height);
    this.alive = true;
};
var Shot = function(x)
{
    this.id = undefined;
    this.rect = new Rect(x, 550, shot_width, shot_height);
    this.alive = true;

};

var Rect = function(x,y,w,h)
{
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Game States Init functions
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

space_game_core.prototype.beginInit = function()
{
    this.enemies.Init();
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

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Update functions
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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

//Main Update function (will call all the other functions)
//This function is called by sioserver.js

space_game_core.prototype.physic_update = function()
{
    if(!this.isEnded)
    {
        this.bpuT = new Date().getMilliseconds();
        
        this.setDirections();
        this.moveEnemies();
        this.moveMother();
        this.moveShots(); 
        this.checkCollisions();
        this.sendUpdate(); 
    } 
};

space_game_core.prototype.update = function(t) {
    //this.sendUpdate();  
}; //game_core.update

//Set the directions of the enemy lines, to avoid colliding with the wall
space_game_core.prototype.setDirections = function()
{
    if(this.enemies.x > 250 && !this.enemiesLeft)
    {
        this.enemiesLeft = true;
    }
    if(this.enemies.x < 50 && this.enemiesLeft)
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
};
//Move the enemy lines
space_game_core.prototype.moveEnemies = function()
{
    if(this.enemiesLeft)
    {
        this.enemies.x -= enemy_speed;
    }
    else
    {
        this.enemies.x += enemy_speed;
    }
};
//Move the mothership
space_game_core.prototype.moveMother = function()
{
    if(this.mothershipLeft)
    {
        this.mothershipX -= mother_speed;
    }
    else
    {
        this.mothershipX += mother_speed;
    }
};
//Move the shots
space_game_core.prototype.moveShots = function()
{
    for(var i = 0 ; i < this.shots.length; i ++)
    {
        this.shots[i].rect.y -= shot_speed;
    }
};

space_game_core.prototype.checkCollisions = function()
{
    for(var i = 0; i < this.shots.length; i ++)
    {
        if(this.shots[i].rect.y < shot_height )
        {
            this.shots[i].alive = false;
        }

        for(var j = 0; j < this.enemies.array.length; j++)
        {
            if(this.shots[i].alive && this.enemies.array[j].alive)
            {
                if(this.doCollide(this.shots[i].rect,this.enemies.array[j].rect))
                {
                    this.shots[i].alive = false;
                    this.enemies.KillEnemy(j);
                    this.score += 100;
                }
            }
        }

        if(this.doCollide(this.shots[i].rect,new Rect(this.mothershipX,mothershipY,mother_width,mother_height)))
        {
            if(this.enemies.numEnemies == 0)
            {
                this.score+= 100;
                this.debugEndGame();
            }
            else
            {
                this.score+=100;
            }
        }   
    }
    this.apuT = new Date().getMilliseconds();
    console.log(this.apuT - this.bpuT); 
};

space_game_core.prototype.doCollide = function(rect1,rect2)
{
    //return (!((rect1.y + rect1.h < rect2.y)||(rect1.y>rect2.y+rect2.h)||(rect1.x>rect2.x+rect2.w)||(rect1.x+rect1.w < rect2.x) ));
    return(!((rect1.x > rect2.x + rect2.w) || (rect1.x + rect1.w < rect2.x) || (rect1.y > rect2.y + rect2.h) || (rect1.y + rect1.h < rect2.h)));
};

//This function send the updates messages to the players
space_game_core.prototype.sendUpdate = function()
{
    var p1string = this.p1ShipX+',';
    var p2string = this.p2ShipX+',';

    var enemiesString = this.generateEnemyString()+',';
    var motherString = this.mothershipX+',';

    var shotString = this.generateShotsString()+',';

    this.p1.emit("message",'UPDATE,'+p1string+p2string+enemiesString+motherString+shotString);
    this.p2.emit("message",'UPDATE,'+p2string+p1string+enemiesString+motherString+shotString);
};

space_game_core.prototype.generateEnemyString = function()
{
    var tmpString ='';
    tmpString += (this.enemies.x+'#');
    for(var i = 0; i < this.enemies.array.length; i ++)
    {
        if(this.enemies.array[i].alive)
        {
            tmpString += '1#';
        }
        else
        {
            tmpString += '0#';
        }
    }
    //console.log(tmpString);
    return tmpString;
};
space_game_core.prototype.generateShotsString = function()
{
    var tmpString = '';
    for(var i = 0; i < this.shots.length; i ++)
    {
        if(this.shots[i].alive)
        {
            tmpString+=this.shots[i].rect.x+'#'+this.shots[i].rect.y+'#'+this.shots[i].alive+'#'+this.shots[i].id+'#';
        }
    }
    console.log(tmpString);
    return tmpString;
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Input functions
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
            this.shoot(this.p1ShipX + ship_width / 2 - shot_width/2);
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
            this.shoot(this.p2ShipX + ship_width / 2 - shot_width/2);
        }
    }
};

space_game_core.prototype.shoot = function(x)
{
    var tmpShot = new Shot(x);
    tmpShot.id = this.shotNum;
    this.shotNum ++;
    this.shots.push(tmpShot);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Debug functions (only used to test game states)
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
    this.p1.player.score += this.score / 2;
    this.p2.player.score += this.score / 2;

    this.p1.player.currentRepetition ++;
    this.p2.player.currentRepetition ++;


    //this.p1.emit('message', 'LOBBY');
    //this.p2.emit('message', 'LOBBY');

    this.isEnded = true;
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Client Messages handler
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
space_game_core.prototype.onMessage = function(client, data){
    //console.log('message recieved by game : '+ this.id);

    var splittedData = data.split(',');
    //console.log('message '+ splittedData);
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
            this.debugEndGame();
        break;
    }
};


