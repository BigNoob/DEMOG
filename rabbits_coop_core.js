require('./public/js/game/Player.js');
var UUID        = require('node-uuid');
//require('./public/js/game/Balloons.js');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Varibles declaration
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var balloon_speed = 4;
var balloon_width = 16;
var balloon_height = 16;

var shot_speed = 6;
var shot_width = 8;
var shot_height = 8;

var goal_speed = 5;
var goalballoonY = 20;
var goal_width = 39;
var goal_height = 56;

var balloon_speed = 3;
var balloon_width = 39;
var balloon_height = 56;
var balloonsX_spacing = 60;
var balloonsY_spacing = 60;
var balloonsY = 150;
var balloonsX = 100;
var lines = 4;
var number = 10;

var gravity = 9.8;

var state_game = 'STATE_GAME';
var state_endAnim = 'STATE_ENDANIM';
var state_share = 'STATE_SHARE';
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Space Invaders Game Core Constructor
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var rabbits_game_core = function(maxIter)
{
    this.id =undefined;
	this.viewport;
    this.state = state_game;
    this.maxIter = maxIter;
    this.isEnded = false;
	this.world = 
		{
            width : 800,
            height : 600
        };
    this.p1 = undefined;
    this.p2 = undefined;
    //this.balloonsX = 100;
    this.balloons = new Balloons(balloonsX,lines,number);
    this.goalShip = undefined;
    this.score = 0;
    this.inputs = [];
    this.p1ShipX = 400;
    this.p2ShipX = 400;
    
    this.goalballoonX = 100;
    this.goalballoonY = 20;
    this.goalShipAlive = true;
    this.balloonsLeft = false;
    this.goalballoonLeft = false;

    this.flyer = new Rect(380,350,40,46);
    this.launcher = new Rect(350,400,126,69);

    this.init_speed = 10;
    this.init_angle = 80;
};

//This line is used to tell node.js that he can access the constructor
module.exports = global.rabbits_game_core = rabbits_game_core;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Game Objects constructors
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var Balloons = function(x,lines,number)
{
    this.x = x;
    this.y = balloonsY;
    this.array = [];
    this.lines = lines;
    this.number = number;
    this.tmpX;
    this.tmpY;
    this.alive = true;
    this.numBalloons = this.lines * this.number;
};
Balloons.prototype.Init = function()
{
    for(var j = 0; j < this.lines; j++)
    {
        for(var i = 0; i < this.number; i ++)
        {
            this.tmpX = i * balloonsX_spacing + balloonsX;
            this.tmpY = j * balloonsY_spacing + balloonsY;
            //console.log(this.tmpX+";"+this.tmpY);
            this.array.push(new Balloon(this.tmpX,this.tmpY));
        }
    } 
    //console.log(this.array);
};
Balloons.prototype.Move = function(x)
{
    this.x += x;
    for(var i = 0 ; i < this.array.length; i ++)
    {
        this.array[i].rect.x += x;
    }
};
Balloons.prototype.KillBalloon = function(i)
{
    this.array[i].alive = false;
    this.numBalloons --;
};
var Balloon = function(x,y)
{
    this.rect = new Rect(x,y,balloon_width,balloon_height);
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

rabbits_game_core.prototype.beginInit = function()
{
    this.balloons.Init();
    this.beginGame();
};
rabbits_game_core.prototype.beginGame = function()
{
    this.p1.emit('message', 'GAME_START');
    this.p2.emit('message', 'GAME_START'); 
};
rabbits_game_core.prototype.beginShare = function(client)
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
//      Element 1 = groundRabbit x
//      Element 2 = Flyrabbit x & y
//      Element 3 = can move?
//      Element 4 = baloons pack x
//      Element 5 = end baloon x
//      
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Main Update function (will call all the other functions)
//This function is called by sioserver.js

rabbits_game_core.prototype.physic_update = function(deltaT)
{
    switch (this.state)
    {
        case state_game:
            this.setDirections();
            this.moveBalloons();
            this.moveMother();
            this.moveFlyer(deltaT); 
            this.checkCollisions();
            this.sendUpdate();
        break;
        case state_endAnim:
            this.animMotherFall();
            this.sendUpdate();
        break;
        case state_share:
            this.sendUpdate();
        break;
    } 
};

rabbits_game_core.prototype.update = function(deltaT) {
}; //game_core.update

//This function send the updates messages to the players
rabbits_game_core.prototype.sendUpdate = function()
{
    var p1string = this.p1ShipX+',';
    var p2string = this.p2ShipX+',';

    var balloonsString = this.generateBalloonString()+',';
    var goalString = this.goalballoonX+'#'+this.goalballoonY+',';

    var scoreString = this.score;
    this.p1.emit("message",'UPDATE,'+p1string+p2string+balloonsString+goalString+scoreString);
    this.p2.emit("message",'UPDATE,'+p2string+p1string+balloonsString+goalString+scoreString);
};

rabbits_game_core.prototype.generateBalloonString = function()
{
    var tmpString ='';
    tmpString += (this.balloons.x+'#');
    for(var i = 0; i < this.balloons.array.length; i ++)
    {
        if(this.balloons.array[i].alive)
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


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    World Computing functions
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Set the directions of the balloon lines, to avoid colliding with the wall
rabbits_game_core.prototype.setDirections = function()
{
    if(this.balloons.x > (this.world.width - 50 - balloonsX_spacing * number) && !this.balloonsLeft)
    {
        this.balloonsLeft = true;
    }
    if(this.balloons.x < 50 && this.balloonsLeft)
    {
        this.balloonsLeft = false;
    }

    if( Math.random() > 0.95)
    {
        this.goalballoonLeft = !this.goalballoonLeft;
    }

    if(this.goalballoonX > (this.world.width - 50 - goal_width) && !this.goalballoonLeft)
    {
        this.goalballoonLeft = true;
    }
    if(this.goalballoonX < 50 && this.goalballoonLeft)
    {
        this.goalballoonLeft = false;
    }
};
//Move the balloon lines
rabbits_game_core.prototype.moveBalloons = function()
{
    if(this.balloonsLeft)
    {
        //this.balloons.x -= balloon_speed;
        this.balloons.Move(-balloon_speed);
    }
    else
    {
        //this.balloons.x += balloon_speed;
        this.balloons.Move(balloon_speed);
    }
};
//Move the goalballoon
rabbits_game_core.prototype.moveMother = function()
{
    if(this.goalballoonLeft)
    {
        this.goalballoonX -= goal_speed;
    }
    else
    {
        this.goalballoonX += goal_speed;
    }
};

rabbits_game_core.prototype.animMotherFall = function()
{
    if( Math.random() > 0.95)
    {
        this.goalballoonLeft = !this.goalballoonLeft;
    }

    if(this.goalballoonX > (this.world.width - 50 - goal_width) && !this.goalballoonLeft)
    {
        this.goalballoonLeft = true;
    }
    if(this.goalballoonX < 50 && this.goalballoonLeft)
    {
        this.goalballoonLeft = false;
    }

    if (this.goalballoonY > 600)
    {
        this.state = state_share;
        if(Math.abs(this.p2ShipX - this.goalballoonX) > Math.abs(this.p1ShipX - this.goalballoonX))
        {
            this.p1.emit('message','SHARE_STATE');
            this.p2.emit('message','SHARE_WAIT');
        }
        else
        {
            this.p2.emit('message','SHARE_STATE');
            this.p1.emit('message','SHARE_WAIT');
        }
    }
    else
    {
        this.goalballoonY += goal_speed;
    }
    if(this.goalballoonLeft)
    {
        this.goalballoonX -= goal_speed;
    }
    else
    {
        this.goalballoonX += goal_speed;
    }
};    


rabbits_game_core.prototype.moveFlyer = function(deltaT)
{
    if(this.flyer.y < 500)
    {
        var deltaX = (this.launcher.x + this.launcher.w/2)-(this.flyer.x+this.flyer.w/2);
        if(deltaX < this.launcher.w/2)
        {
            this.calculateTrajectory(deltaX);
        }
        else
        {
            //TODO relaunch the Game
        }      
    }
    else
    {

    }
};

rabbits_game_core.prototype.calculateTrajectory = function(deltaX)
{

};

rabbits_game_core.prototype.checkCollisions = function()
{
    //console.log(this.balloons.array);



        for(var j = 0; j < this.balloons.array.length; j++)
        {
            if(this.flyer.alive && this.balloons.array[j].alive)
            {
                if(this.doCollide(this.flyer,this.balloons.array[j].rect))
                {
                    this.balloons.KillBalloon(j);
                    this.score += 100;
                }
            }
        }

        if(this.doCollide(this.flyer,new Rect(this.goalballoonX,goalballoonY,goal_width,goal_height)))
        {
            if(this.balloons.numBalloons == 0)
            {
                this.score+= 100;
                this.state = state_endAnim;
            }
        }   
    
};

rabbits_game_core.prototype.doCollide = function(rect1,rect2)
{
    return(!((rect1.x > rect2.x + rect2.w) || (rect1.x + rect1.w < rect2.x) || (rect1.y > rect2.y + rect2.h) || (rect1.y + rect1.h < rect2.h)));
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Input functions
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
rabbits_game_core.prototype.onInput = function(client, data){
    
    if(this.state == state_game)
    {
        if(client.userid == this.p1.userid)
        {
            //console.log('p1');
            if(data[1] == '1')
            {
                //console.log('left');
                if(this.p1ShipX > 0)
                {
                  this.p1ShipX -= balloon_speed;  
                }
                
            }
            if(data[2] == '1')
            {
                if(this.p1ShipX < this.world.width - balloon_width)
                {
                    this.p1ShipX += balloon_speed;
                } 
            }
            if(data[3] == '1')
            {
                this.shoot(this.p1ShipX + balloon_width / 2 - shot_width/2);
            }
        }
        else
        {
            //console.log('p2');
            if(data[1] == '1')
            {
                if(this.p2ShipX > 0)
                {
                    this.p2ShipX -= balloon_speed;
                }
            }
            if(data[2] == '1')
            {
                if(this.p2ShipX < this.world.width - balloon_width)
                {
                    this.p2ShipX += balloon_speed; 
                }
            }
            if(data[3] == '1')
            {
                this.shoot(this.p2ShipX + balloon_width / 2 - shot_width/2);
            }
        }
    }
    else if(this.state == state_share)
    {
        if(client.userid == this.p1.userid)
        {
            //console.log('p1');
            if(data[1] == '1')
            {
                //console.log('left');
                if(this.p1ShipX > 100)
                {
                  this.p1ShipX -= balloon_speed;  
                }
                
            }
            if(data[2] == '1')
            {
                if(this.p1ShipX < this.world.width - balloon_width - 100)
                {
                    this.p1ShipX += balloon_speed;
                } 
            }
        }
        else
        {
            //console.log('p2');
            if(data[1] == '1')
            {
                if(this.p2ShipX > 100)
                {
                    this.p2ShipX -= balloon_speed;
                }
            }
            if(data[2] == '1')
            {
                if(this.p2ShipX < this.world.width - balloon_width - 100)
                {
                    this.p2ShipX += balloon_speed; 
                }
            }
        }
    }
};

rabbits_game_core.prototype.shoot = function(x)
{

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Debug functions (only used to test game states)
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

rabbits_game_core.prototype.EndGame = function()
{
    this.p1.player.currentRepetition ++;
    this.p2.player.currentRepetition ++;

    if(this.p1.player.currentRepetition > this.maxIter)
    {
        this.p1.emit('message','REDIRECT');
    }
    if(this.p2.player.currentRepetition > this.maxIter)
    {
        this.p2.emit('message','REDIRECT');
    }

    this.isEnded = true;
};
rabbits_game_core.prototype.Share = function(client, data)
{
    console.log(client.userid + data);
    if(client.userid == this.p1.userid)
    {
        console.log('plop p1');
        this.p1.player.score += this.score - parseInt(data[1]);
        this.p2.player.score += parseInt(data[1]);
        this.p1.player.SetGameResult(this.id,true,this.score,parseInt(data[1]),this.score - parseInt(data[1]));
        this.p2.player.SetGameResult(this.id,false,this.score,parseInt(data[1]),this.score - parseInt(data[1]));
    }
    else
    {
        console.log('plop p2');
        this.p2.player.score += this.score - parseInt(data[1]);
        this.p1.player.score += parseInt(data[1]);
        this.p1.player.SetGameResult(this.id,false,this.score,parseInt(data[1]),this.score - parseInt(data[1]));
        this.p2.player.SetGameResult(this.id,true,this.score,parseInt(data[1]),this.score - parseInt(data[1]));
    }

    this.EndGame();
};
rabbits_game_core.prototype.GetResult = function()
{

    return('Game ID : '+ this.id+'\nTotal Score : '+ this.score+'\n'+this.p1.userid+'\n'+this.p2.userid);

};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Client Messages handler
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
rabbits_game_core.prototype.onMessage = function(client, data){
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
        case 'ANIM_END':

        break;
        case 'SHARE':
            this.Share(client,splittedData);
        break;
        case 'END':
            //this.debugEndGame();
        break;
    }
};


