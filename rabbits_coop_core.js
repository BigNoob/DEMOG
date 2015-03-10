require('./player.js');
var UUID        = require('node-uuid');
//require('./public/js/game/Balloons.js');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Varibles declaration
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//var balloon_speed = 6;
//var balloon_width = 16;
//var balloon_height = 16;



var shot_speed = 6;
var shot_width = 8;
var shot_height = 8;

var timerMove = 30; 
var canMoveLeft = true;
var canMoveRight = true;

var recordInputEach = 250;

var goal_speed = 2;
var goalballoonY = 20;
var goal_width = 39;
var goal_height = 56;


var writeResults1 = true;
var writeResults2 = true;

var balloon_speed = 4;
var balloon_width = 39;
var balloon_height = 56;
var balloonsX_spacing = 60;
var balloonsY_spacing = 60;
var balloonsY = 150;
var balloonsX = 100;
var lines = 4;  //must be changed in main_rabbits_client.js also
var number = 10;  //must be changed in main_rabbits_client.js also
var points_per_enemy = 25;

var launcherSpeed = 10;

var state_game = 'STATE_GAME';
var state_endAnim = 'STATE_ENDANIM';
var state_share = 'STATE_SHARE';
var state_reload = 'STATE_RELOAD';
var state_fall = 'STATE_FALL';
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
    this.launcherNumber = 1;

    this.inputsP1 = [];
    this.inputsP2 = [];

    this.balloons = new Balloons(balloonsX,lines,number);
    this.goalShip = undefined;
    this.score = 0;
    this.given = -1;
    this.kept = -1;
	this.p1MissedSeesaw = 0;
    this.p2MissedSeesaw = 0;

	this.p1DistanceSeesaw = 0; // average distance from the center of the landed rabbit to the center of the seesaw
    this.p2DistanceSeesaw = 0;
	this.p1DistanceTimes = 0; // to calculate average distance
    this.p2DistanceTimes = 0; // to calculate average distance

	this.p1BalloonsPopped = 0;
    this.p2BalloonsPopped = 0;

    this.goalballoonX = 100;
    this.goalballoonY = 100;
    this.goalShipAlive = true;
    this.balloonsLeft = false;
    this.goalballoonLeft = false;

    this.flyer = new Rect(380,350,40,46);
    this.launcher = new Rect(350,549,96,53);

    this.flyer.x = 400 - this.flyer.w;
    this.flyer.y = 400;
        
	this.startMilliseconds = -1;
	this.gameLength = -1;

    this.init_speed = 0.2;
    this.init_angle = 0;
    this.init_abs = 400 - this.flyer.w;
    this.inAirTime = 1000.0;
    this.timeScale = 10;
    this.angleDirection = -1;

    this.p1Ended = false;
    this.p2Ended = false;
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

            this.array.push(new Balloon(this.tmpX,this.tmpY));
        }
    } 
};
Balloons.prototype.Move = function(x)
{
    this.x += x;
    if(this.x > 800)
    {
        this.x -= (800 + balloonsX_spacing * number);
    }
    for(var i = 0 ; i < this.array.length; i ++)
    {
        
        this.array[i].rect.x += x;
        if(this.array[i].rect.x > 800)
        {
            this.array[i].rect.x -= 800 + balloonsX_spacing * number;
        }
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
	//console.log('inside begin init1');
    this.p1.emit("message",'COLOR,1'); //says what sprites client should use (so that the two clients control a rabbit of the same color)
    this.p2.emit("message",'COLOR,2');
	this.startMilliseconds = new Date().getTime();


	this.p1.emit('updateTime');
	this.p2.emit('updateTime');
	
    this.balloons.Init();
    this.beginGame();
    //console.log('inside begin init2');
};
rabbits_game_core.prototype.beginGame = function()
{
    this.p1.emit('message', 'GAME_START');
    this.p2.emit('message', 'GAME_START'); 
    //console.log('inside begin game');
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
//      Element 1 = launcherRabbit x
//      Element 2 = Flyrabbit x & y
//      Element 3 = launcherNumber
//      Element 4 = baloons pack x
//      Element 5 = goalString
//      Element 6 = scoreString
//      Element 7 = ownNumber
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
        default:
            this.setDirections();
            this.moveBalloons();
            this.moveMother();
            this.moveFlyer(deltaT); 
            this.checkCollisions();
            this.sendUpdate();
        break;
    } 
};

rabbits_game_core.prototype.update = function(deltaT) {
}; //game_core.update

//This function send the updates messages to the players
rabbits_game_core.prototype.sendUpdate = function()
{
    var p1string = this.launcher.x+',';
    var flyerString = this.generateFlyerString();
    var launcherString = this.launcherNumber+',';
    var balloonsString = this.generateBalloonString()+',';
    var goalString = this.goalballoonX+'#'+this.goalballoonY+',';

    var scoreString = this.score;
    this.p1.emit("message",'UPDATE,'+p1string+flyerString+launcherString+balloonsString+goalString+scoreString+',1');
    this.p2.emit("message",'UPDATE,'+p1string+flyerString+launcherString+balloonsString+goalString+scoreString+',2');
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

rabbits_game_core.prototype.generateFlyerString = function()
{
    var tmpString = '';
    tmpString += (this.flyer.x+'#'+this.flyer.y+',');
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
    /*
    if(this.balloons.x > (this.world.width - balloonsX_spacing * number) && !this.balloonsLeft)
    {
        this.balloonsLeft = true;
    }
    if(this.balloons.x <0 && this.balloonsLeft)
    {
        this.balloonsLeft = false;
    }
    */
    /*
    if( Math.random() > 0.95)
    {
        this.goalballoonLeft = !this.goalballoonLeft;
    }
    */
    if(this.goalballoonX > (this.world.width - goal_width) && !this.goalballoonLeft)
    {
        this.goalballoonLeft = true;
    }
    if(this.goalballoonX < 0 && this.goalballoonLeft)
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
    if (this.goalballoonY > 500)
    {
        this.state = state_share;
		this.gameLength = (new Date().getTime()) - this.startMilliseconds;
        if(this.launcherNumber == 2)
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
};    

rabbits_game_core.prototype.moveFlyer = function(deltaT)
{
    var deltaX;

    if(this.state == state_reload)
    {   
        this.flyer.x = 400 - this.flyer.w;
        this.flyer.y = 400;
        this.init_abs = 400 - this.flyer.w;
		this.init_angle = 0;
		this.init_speed = 0.2;
		this.inAirTime = 1000;
        //this.inAirTime = 0;

        //this.sendUpdate();
        
    }
    else if(this.state == state_game)
    {
       if(this.flyer.x < 0 )
        {

            this.angleDirection = 1;
            this.init_angle = 0;
            this.init_abs = 0;
            this.flyer.x = 0;
        }
        if ( this.flyer.x > 800 - 40)
        {

            this.angleDirection = -1;
            this.init_angle = 0
            this.init_abs = 800 -40;
            this.flyer.x = 800 - 40;
        }
        if(this.flyer.y > 550) //flyer touches the ground
        {
            this.launcherNumber = (this.launcherNumber == 1)? 2 : 1;
            //console.log(this.launcherNumber);
            this.inAirTime = 0;
			deltaX = (this.launcher.x + this.launcher.w/2)-(this.flyer.x+this.flyer.w/2);
            //console.log(deltaX);

            if((deltaX <= 0 && Math.abs(deltaX) < (this.launcher.w/2 + this.flyer.w/2) && this.launcherNumber == 2) || (deltaX >= 0 && Math.abs(deltaX) < (this.launcher.w/2 + this.flyer.w/2) && this.launcherNumber == 1)) // flyer is on the good side of the seesaw
            {
				deltaX = Math.abs(deltaX);
			    if (this.launcherNumber == 2) 
				{	
					this.p1DistanceSeesaw += deltaX;
					this.p1DistanceTimes += 1;
				} else 
				{
					this.p2DistanceSeesaw += deltaX;
					this.p2DistanceTimes += 1;
				}
                //console.log("inside");
				
                this.calculateTrajectory(deltaX);
            }
            else
            {
                if(this.state == state_game)
                {
					if (this.launcherNumber == 2) {this.p1MissedSeesaw += 1} else {this.p2MissedSeesaw += 1}
						
                    this.state = state_reload;
                    this.p1.emit('message',state_reload);
                    this.p2.emit('message',state_reload);
                }
            }      
            this.flyer.y = 549;
        }
        else
        {
            
            this.inAirTime += deltaT;

            this.flyer.x =   Math.round(this.init_angle * this.angleDirection * this.inAirTime / this.timeScale + this.init_abs);
            this.flyer.y = 450 -  Math.round( this.init_speed*( 4* this.inAirTime / this.timeScale - (Math.pow(this.inAirTime / this.timeScale,2)) / 100));
        } 
    }
};

rabbits_game_core.prototype.calculateTrajectory = function(deltaX)
{
	deltaX = deltaX / (this.launcher.x + this.launcher.w/2);    
    	
	if ((this.launcher.x < 100) || (this.launcher.x + this.launcher.w > 650)) {var ordonnees = 0.4;} // to get away from the edges
	else {var ordonnees = 0;}
	this.init_speed = 3 * deltaX + 0.3 + ordonnees;
    this.init_angle = 3 * deltaX + 0.1 + ordonnees;
    this.angleDirection = (this.launcherNumber == 1)? -1 : 1;
    this.init_abs = this.launcher.x + this.angleDirection + this.launcher.w / 2;
};

rabbits_game_core.prototype.checkCollisions = function()
{

    for(var j = 0; j < this.balloons.array.length; j++)
    {
        if(this.balloons.array[j].alive)
        {
            if(this.doCollide(this.flyer,this.balloons.array[j].rect))
            {
				if (this.launcherNumber == 2) {this.p1BalloonsPopped += 1} else {this.p2BalloonsPopped += 1}
                this.balloons.KillBalloon(j);
                this.score += points_per_enemy;
            }
        }
    }
    
    if(this.doCollide(this.flyer,new Rect(this.goalballoonX,this.goalballoonY,goal_width,goal_height)))
    {
        if(this.balloons.numBalloons == 0)
        {
            //this.score+= 100;
            this.state = state_endAnim;
            this.p1.emit('message',"ANIM_STATE");
            this.p2.emit('message',"ANIM_STATE");
        }
    }     
};

rabbits_game_core.prototype.doCollide = function(rect1,rect2)
{
    return(!((rect1.x > rect2.x + rect2.w) || (rect1.x + rect1.w < rect2.x) || (rect1.y > rect2.y + rect2.h) || (rect1.y + rect1.h < rect2.y)));
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Input functions
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
rabbits_game_core.prototype.onInput = function(client, data){
    
    if(client.userid == this.p1.userid)
    {
      if(writeResults1)
      {
        this.inputsP1.push(data+','+Math.round(this.balloons.x*100)/100+','+this.goalballoonX);
        writeResults1 = false;
        setTimeout(function(){writeResults1 = true},recordInputEach);
      }
    }
    else if(client.userid == this.p2.userid)
    {
      if(writeResults2)
      {
        this.inputsP2.push(data+','+Math.round(this.balloons.x*100)/100+','+this.goalballoonX);
        writeResults2 = false;
        setTimeout(function(){writeResults2 = true},recordInputEach);
      }
    }

    if(this.state == state_game || this.state == state_reload)
    {

        if(data[1] == '1')
        {
		  if(canMoveLeft)
		  {
            if(this.launcher.x > 0)
            {
              this.launcher.x -= launcherSpeed;  
            }
		    canMoveLeft = false;
		    setTimeout(function(){canMoveLeft = true},timerMove);
		  } 
         
        }
        if(data[2] == '1')
        {

		  if(canMoveRight)
		  {
            if(this.launcher.x < this.world.width -96)
            {
                this.launcher.x += launcherSpeed;
            } 
		    canMoveRight = false;
		    setTimeout(function(){canMoveRight = true},timerMove);
		  } 


        }
    }
    else if(this.state == state_share)
    {

        if(data[1] == '1')
        {
            if(this.launcher.x > 100)
            {
              this.launcher.x -= launcherSpeed;  
            }
            
        }
        if(data[2] == '1')
        {
            if(this.launcher.x < this.world.width - 96 - 100)
            {
                this.launcher.x += launcherSpeed;
            } 
        }
    }
};

rabbits_game_core.prototype.shareInput = function(client,data)
{
    if(client.userid == this.p1.userid)
    {
        this.launcher.x = parseInt(data[1]);  
    }
    else
    {
        this.launcher.x = parseInt(data[1]); 
    }
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Debug functions (only used to test game states)
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
rabbits_game_core.prototype.PlayerEnded = function(client , data)
{
    if(client.userid == this.p1.userid)
    {
        this.p1Ended = true;
		this.p1.player.result.currentGame++;
		this.p1.emit('message','LOBBY');
    }
    else
    {
        this.p2Ended = true;
		this.p2.player.result.currentGame++;
		this.p2.emit('message','LOBBY');
    }

    if(this.p1Ended && this.p2Ended)
    {
        console.log('ended game');
        this.EndGame();
    }
};

rabbits_game_core.prototype.EndGame = function()
{
    this.p1.player.currentRepetition ++;
    this.p2.player.currentRepetition ++;
	//this.p1.emit('sendEmail'); // this goes to main_..._client.js, which has to send it to app.js through socket.emit then 
    this.isEnded = true;
};
rabbits_game_core.prototype.Share = function(client, data)
{
    this.given = parseInt(data[1]);
    this.kept = 1000 - parseInt(data[1]);
	this.p1DistanceSeesaw /= this.p1DistanceTimes;		
	this.p2DistanceSeesaw /= this.p2DistanceTimes;	
    //console.log(client.userid + data);
    if(client.userid == this.p2.userid)
    {
        this.sharer = this.p2;

        this.p1.player.score += this.given;
        this.p2.player.score += this.kept;

        this.p1.player.SetGameResultRabbits(this.id,false,this.score,this.given,this.kept,this.p1MissedSeesaw,this.p1DistanceSeesaw,this.p1BalloonsPopped,this.gameLength,true);
        this.p2.player.SetGameResultRabbits(this.id,true,this.score,this.given,this.kept,this.p2MissedSeesaw,this.p2DistanceSeesaw,this.p2BalloonsPopped,this.gameLength,false);

        this.p1.emit('message','GIVEN_AMMOUNT,'+this.given+',RECIEVER');
        this.p2.emit('message','GIVEN_AMMOUNT,'+this.given+',SHARER');
        
    }
    else
    {
        this.sharer = this.p1;

        this.p2.player.score += this.given;
        this.p1.player.score += this.kept;

        this.p1.player.SetGameResultRabbits(this.id,true,this.score,this.given,this.kept,this.p1MissedSeesaw,this.p1DistanceSeesaw,this.p1BalloonsPopped,this.gameLength,true);
        this.p2.player.SetGameResultRabbits(this.id,false,this.score,this.given,this.kept,this.p2MissedSeesaw,this.p2DistanceSeesaw,this.p2BalloonsPopped,this.gameLength,false);

        this.p1.emit('message','GIVEN_AMMOUNT,'+this.given+',SHARER');
        this.p2.emit('message','GIVEN_AMMOUNT,'+this.given+',RECIEVER');
    }
    //setTimeout(this.EndGame(),2000); 
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

    var splittedData = data.split(',');
    switch (splittedData[0])
    {
        case 'INPUT':
            splittedData.push((new Date().getTime()) - this.startMilliseconds);
            this.onInput(client, splittedData);
        break;
        case 'MOUSE_INPUT':
            this.shareInput(client, splittedData);
        break;        
        case 'ANIM_END':

        break;
        case 'STATE_GAME':
            this.state = state_game;
        break;
        case 'SHARE':
            this.Share(client,splittedData);
        break;
        case 'ENDED':
            this.PlayerEnded(client, splittedData);
        break;
    }
};


