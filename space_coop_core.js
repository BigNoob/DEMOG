require('./player.js');
var UUID        = require('node-uuid');
//require('./public/js/game/Enemies.js');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Varibles declaration
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var ship_speed = 6; //player's speed, for real xp = 6
var ship_width = 16;
var ship_height = 16;

var recordInputEach = 250;

var canfire1 = true;
var canfire2 = true;
var canAImove = true;
var cooldown = 240; //240

var writeResults1 = true;
var writeResults2 = true;

var shot_speed = 6;
var shot_width = 8;
var shot_height = 8;

var mother_speed = 3;
var mother_speed_fall = 5;
var mothershipY = 20;
var mother_width = 64;
var mother_height = 96;

var enemy_speed = 3; //for debug you can set this to 0.2, otherwise realistic speed is 3
var enemy_width = 16;
var enemy_height = 16;
var enemiesX_spacing = 32;
var enemiesY_spacing = 32;
var enemiesY = 150;
var enemiesX = 300;
var lines = 4;   //must be changed in main_space_client.js also, 4 for real test
var number = 10;  //must be changed in main_space_client.js also, 10 for real test
var points_per_enemy = 25;

var state_game = 'STATE_GAME';
var state_endAnim = 'STATE_ENDANIM';
var state_share = 'STATE_SHARE';

var distanceP1 = 0;
var distanceP2 = 0;

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Space Invaders Game Core Constructor
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var space_game_core = function(maxIter,isDG)
{
    this.id =undefined;
	this.viewport;
    this.state = state_game;
    this.maxIter = maxIter;
    this.isEnded = false;
	this.AIshareSent = false;
	this.world = 
		{
            width : 800,
            height : 600
        };
    this.p1 = undefined;
    this.p2 = undefined;


    this.inputsP1 = [];
    this.inputsP2 = [];

    this.enemies = new Enemies(enemiesX,lines,number);
    this.motherShip = undefined;
    this.score = 0;
    this.given = -1;
    this.kept = -1;
    this.sharer = undefined;
	this.gotMothership = undefined;
    this.inputs = [];
    this.p1ShipX = 370;
    this.p2ShipX = 430;
    this.focusEnemyForAI = this.enemies
    this.mothershipX = 400 - mother_width / 2;
    this.mothershipY = 20;
    this.motherShipAlive = true;
    this.enemiesLeft = false;
    this.mothershipLeft = false;
	this.explodeY = 580;	
	this.explodeTouchWall = false;	
	this.explodeRound = 0;

    this.shots = [];
    this.shotNum = 0;

	this.p1ShotsFired = 0;
	this.p2ShotsFired = 0;
	this.p1EnemyKilled = 0;
	this.p2EnemyKilled = 0;

	this.shareSteps = "";

	this.p1DistanceToMothership = -1;
	this.p2DistanceToMothership = -1;

    this.p1Ended = false;
    this.p2Ended = false; 
	this.isDG = isDG;
	this.mothershipFallen = false;	

	this.startMilliseconds = -1;
	this.gameLength = -1;
	
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
    this.y = enemiesY;
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
            this.tmpX = i * enemiesX_spacing + enemiesX;
            this.tmpY = j * enemiesY_spacing + enemiesY;
            //console.log(this.tmpX+";"+this.tmpY);
            this.array.push(new Enemy(this.tmpX,this.tmpY));
        }
    } 
    //console.log(this.array);
};
Enemies.prototype.Move = function(x)
{
    this.x += x;
    if(this.x > 800)
    {
        this.x -= (800 + enemiesX_spacing * number);
    }
	else if (this.x < (- enemiesX_spacing * number))
    {
        this.x = 800;
    }
    for(var i = 0 ; i < this.array.length; i ++)
    {
        
        this.array[i].rect.x += x;
        if(this.array[i].rect.x > 800)
        {
            this.array[i].rect.x -= 800 + enemiesX_spacing * number;
        }
		else if (this.array[i].rect.x < (- enemiesX_spacing * number))
		{
		    this.array[i].rect.x = 800;
		}
    }
};
Enemies.prototype.KillEnemy = function(i)
{
    this.array[i].alive = false;
    this.numEnemies --;
};
Enemies.prototype.returnEnemyAlive = function()
{
	var enemiesAlive = [];
    for(var i = 0; i < this.array.length; i ++)
    {
        if(this.array[i].alive)
        {
			enemiesAlive.push(this.array[i]);
        }
    }
    return enemiesAlive[getRandomInt(0,enemiesAlive.length-1)];
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
	this.shooter = undefined;
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
	this.focusEnemyForAI = this.enemies.returnEnemyAlive();

	this.startMilliseconds = new Date().getTime();

	this.p1.emit('updateTime',false);
	if (!this.p1.player.result.timedOut)
	{
		this.p2.emit('updateTime',false);
	}

	if(this.isDG == "dg")  // skip the game stage and go to share state directly
	{
	    this.state = state_share;
		if (this.p1.player.result.timedOut)
		{
		     this.p1.emit('message','SHARE_STATE,dg');
		} else
		{
			this.score = 1000; // this.score cannot be determined in the game
		    if(Math.random() < 0.5)
		    {
		        this.p1.emit('message','SHARE_STATE,dg');
		        this.p2.emit('message','SHARE_WAIT,dg');
		    }
		    else
		    {
		        this.p2.emit('message','SHARE_STATE,dg');
		        this.p1.emit('message','SHARE_WAIT,dg');
		    }
		}
    }
	else
	{
		this.beginGame();
	}
    
	
};
space_game_core.prototype.beginGame = function()
{
    this.p1.emit('message', 'GAME_START');
	if (!this.p1.player.result.timedOut)
	{
    	this.p2.emit('message', 'GAME_START'); 
	}

};
/*
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
*/


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

space_game_core.prototype.physic_update = function(deltaT)
{
    switch (this.state)
    {
        case state_game:
            this.setDirections();
            this.moveEnemies();
            this.moveMother();
            this.moveShots(); 
            this.checkCollisions();
            this.sendUpdate();
			if (this.p1.player.result.timedOut && this.isDG != "dg")
			{
				this.moveAI();
			}	
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

space_game_core.prototype.update = function(deltaT) {
}; //game_core.update

//This function send the updates messages to the players
space_game_core.prototype.sendUpdate = function()
{
    var p1string = ',';
    var p2string = ',';

    var enemiesString = ',';
    var motherString = ',';

    var shotString = ',';
    var scoreString = '';
	if (this.isDG != "dg")
	{
		p1string = this.p1ShipX+',';
		p2string = this.p2ShipX+',';

		enemiesString = this.generateEnemyString()+',';
		motherString = this.mothershipX+'#'+this.mothershipY+',';

		shotString = this.generateShotsString()+',';
		scoreString = this.score;
	}
	if (this.state == state_game || this.state == state_endAnim)
	{
		this.p1.emit("message",'UPDATE,'+p1string+p2string+enemiesString+motherString+shotString+scoreString);        
		if (!this.p1.player.result.timedOut)
		{
			this.p2.emit("message",'UPDATE,'+p2string+p1string+enemiesString+motherString+shotString+scoreString);
		}
	}

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
    //console.log(tmpString);
    return tmpString;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    World Computing functions
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Set the directions of the enemy lines, to avoid colliding with the wall
space_game_core.prototype.setDirections = function()
{


    if(this.enemies.x > (this.world.width - 50 - enemiesX_spacing * number) && !this.enemiesLeft)
    {
        this.enemiesLeft = true;
    }
    if(this.enemies.x < 50 && this.enemiesLeft)
    {
        this.enemiesLeft = false;
    }

    if( Math.random() > 0.99)
    {
        this.mothershipLeft = !this.mothershipLeft;
    }

    if(this.mothershipX > (this.world.width - 50 - mother_width) && !this.mothershipLeft)
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
    if(Math.random() > 0.99)
    {
        enemy_speed *= -1; // change direction
    }

    this.enemies.Move(enemy_speed);
  
};
//Move the mothership
space_game_core.prototype.moveMother = function()
{
    if (!this.mothershipFallen)
    {
		if(this.mothershipLeft)
		{
		    this.mothershipX -= mother_speed;
		}
		else
		{
		    this.mothershipX += mother_speed;
		}
	}
};
//Move AI if player is in solo mode
space_game_core.prototype.moveAI = function()
{
    if(this.enemies.numEnemies > 0 && (Math.random() > 0.99 || !this.focusEnemyForAI.alive)) //change focus enemy
    {
        this.focusEnemyForAI = this.enemies.returnEnemyAlive();
		
    } else if (this.enemies.numEnemies == 0)
	{
		this.focusEnemyForAI.rect.x = this.mothershipX;
	}
	if(canAImove)
	{  
		if (Math.abs(this.focusEnemyForAI.rect.x - this.p2ShipX) < 3)
		{
			var stopTimespan = getRandomInt(1000,2000);
			canAImove = false;
			setTimeout(function(){canAImove = true},stopTimespan);
		}
		else if (this.focusEnemyForAI.rect.x > this.p2ShipX)
		{
			this.onInput(this.p2, ['INPUT','0','1','0']);
		} else if (this.focusEnemyForAI.rect.x < this.p2ShipX)
		{
			this.onInput(this.p2, ['INPUT','1','0','0']);
		} 
	}

	if(canfire2)
	{  
		if (Math.random() < 0.2)
		{
			var stopFireTimespan = getRandomInt(500,1500);
			canfire2 = false;
			setTimeout(function(){canfire2 = true},stopFireTimespan);
		}
		this.onInput(this.p2, ['INPUT','0','0','1']);
	}



};
//Animate the mothership during its fall
space_game_core.prototype.animMotherFall = function()
{

    if(this.mothershipX > (this.world.width - mother_width))
    {
		this.explodeTouchWall = true;
		this.explodeY = this.mothershipY;
    }
    if(this.mothershipX < 0)
    {
		this.explodeTouchWall = true;
		this.explodeY = this.mothershipY;
    }
    
    if (this.mothershipY > 500) // mothership has touched the ground
    {

		var centerP1 = this.p1ShipX + (ship_width / 2);
		var centerP2 = this.p2ShipX + (ship_width / 2);
		distanceP1 = Math.abs(centerP1 - (this.mothershipX + (mother_width / 2)));
		distanceP2 = Math.abs(centerP2 - (this.mothershipX + (mother_width / 2)));

		if (this.mothershipFallen == false)
		{
			this.p1DistanceToMothership = distanceP1;
			this.p2DistanceToMothership = distanceP2;
		}
		this.mothershipFallen = true;
		if (distanceP2 == 0 || distanceP1 == 0) // players have reached the mothership
		{ 
			this.p1.emit('message','REMOVE_MOTHERSHIP');
			if (!this.p1.player.result.timedOut)
			{
			    this.p2.emit('message','REMOVE_MOTHERSHIP');
			}

		   this.gameLength = (new Date().getTime()) - this.startMilliseconds;
           var currentTime = new Date().getTime();
           while (currentTime + 2000 >= new Date().getTime()) {
           }	
			this.state = state_share;    
		    if(distanceP2 > distanceP1)
		    {
		        this.p1.emit('message','SHARE_STATE');
				if (!this.p1.player.result.timedOut)
				{
					this.p2.emit('message','SHARE_WAIT');
				}
		        
		    }
		    else
		    {
		        this.p1.emit('message','SHARE_WAIT');
				if (!this.p1.player.result.timedOut)
				{
		        	this.p2.emit('message','SHARE_STATE');
				} else //AI will give 500 after 7s
				{
				   var currentTime = new Date().getTime();
				   while (currentTime + 9223 >= new Date().getTime()) {}	
       				this.Share(this.p2,['SHARE','500']);
				}


		    }
		}
		else // one player moves towards the mothership
		{
		    if(distanceP2 > distanceP1)
		    { //p1 closest
		      if (centerP1 - (this.mothershipX + (mother_width / 2)) > 0)
			  {this.p1ShipX -= 1;}
			  else {this.p1ShipX += 1;}
		    }
		    else
		    { //p2 closest
		      if (centerP2 - (this.mothershipX + (mother_width / 2)) > 0)
			  {this.p2ShipX -= 1;}
			  else {this.p2ShipX += 1;}		        
		    }
		}
    }
    else //mothership is still falling
    {
		if (this.explodeTouchWall) 
		{
			this.mothershipY += Math.round(2 + 0.1 * this.explodeRound); // vertical fall
		} else
		{
			this.mothershipY = Math.round(600 - (-0.15 * this.explodeRound * this.explodeRound + this.explodeY)); //parabol fall
		}
        //this.mothershipY += mother_speed_fall/3;
    }	
    if (!this.mothershipFallen)
    {    
		if(this.mothershipLeft)
		{
			this.explodeDir = -1;
		}
		else
		{
			this.explodeDir = 1;
		}

		if (!this.explodeTouchWall) // parabol if mothership has not touched the sides
		{
			this.mothershipX = Math.round(this.explodeX + this.explodeDir * mother_speed * 2.5 * this.explodeRound);
		} 
		


	this.explodeRound++;
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
//Check collisions between shots and enemies ships
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
					if(this.shots[i].shooter == "p1") {this.p1EnemyKilled += 1} 
					else {this.p2EnemyKilled += 1} 					
					
                    this.shots[i].alive = false;
                    this.enemies.KillEnemy(j);
                    this.score += points_per_enemy;
                }
            }
        }

        if(this.doCollide(this.shots[i].rect,new Rect(this.mothershipX,mothershipY,mother_width,mother_height))) // collision with mamaship
        {
            
			this.gotMothership = this.shots[i].shooter;
			this.explodeX = this.mothershipX;
            if(this.shots[i].alive && this.enemies.numEnemies == 0)
            {
                //this.score+= 100;
                this.state = state_endAnim;
            }
			this.shots[i].alive = false;
        }   
    }  
};
//helpers function to check Rects collisions
space_game_core.prototype.doCollide = function(rect1,rect2)
{
    return(!((rect1.x > rect2.x + rect2.w) || (rect1.x + rect1.w < rect2.x) || (rect1.y > rect2.y + rect2.h) || (rect1.y + rect1.h < rect2.y)));
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Input functions
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
space_game_core.prototype.onInput = function(client, data){

    if(client.userid == this.p1.userid)
    {
      if(writeResults1)
      {
        this.inputsP1.push(data+','+Math.round(this.enemies.x*100)/100+','+this.mothershipX);
        writeResults1 = false;
        setTimeout(function(){writeResults1 = true},recordInputEach);
      }

    }
    else if(client.userid == this.p2.userid)
    {
      if(writeResults2)
      {
        this.inputsP2.push(data+','+Math.round(this.enemies.x*100)/100+','+this.mothershipX);
        writeResults2 = false;
        setTimeout(function(){writeResults2 = true},recordInputEach);
      }

    }


    
    if(this.state == state_game)
    {
        if(client.userid == this.p1.userid)
        {
            if(data[1] == '1')
            {
                if(this.p1ShipX > 0)
                {
                  this.p1ShipX -= ship_speed;  
                }
                
            }
            if(data[2] == '1')
            {
                if(this.p1ShipX < this.world.width - ship_width)
                {
                    this.p1ShipX += ship_speed;
                } 
            }
            if(data[3] == '1')
            {
			  if(canfire1)
			  {  
                this.shoot(this.p1ShipX + ship_width / 2 - shot_width/2,"p1");
				this.p1ShotsFired += 1;
				canfire1 = false;
				setTimeout(function(){canfire1 = true},cooldown);
			  }

            }
        }
        else
        {
            if(data[1] == '1')
            {
                if(this.p2ShipX > 0)
                {
                    this.p2ShipX -= ship_speed;
                }
            }
            if(data[2] == '1')
            {
                if(this.p2ShipX < this.world.width - ship_width)
                {
                    this.p2ShipX += ship_speed; 
                }
            }
            if(data[3] == '1')
            {
			  if(canfire2)
			  {  
                this.shoot(this.p2ShipX + ship_width / 2 - shot_width/2,"p2");
				this.p2ShotsFired += 1;
				canfire2 = false;
				setTimeout(function(){canfire2 = true},cooldown);
			  }

            }
        }
    }
};

space_game_core.prototype.shareInput = function(client,data)
{
    if(client.userid == this.p1.userid)
    {
        this.p1ShipX = parseInt(data[1]);  
    }
    else
    {
        this.p2ShipX = parseInt(data[1]); 
    }
};

space_game_core.prototype.shoot = function(x,whichPlayer)
{
    var tmpShot = new Shot(x,whichPlayer);
    tmpShot.id = this.shotNum;
	tmpShot.shooter = whichPlayer;
    this.shotNum ++;
    this.shots.push(tmpShot);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Debug functions (only used to test game states)
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
space_game_core.prototype.PlayerEnded = function(client , data)
{

    if(client.userid == this.p1.userid)
    {
        this.p1Ended = true;
		this.p1.player.result.currentGame++;	
		this.p1.emit('message','LOBBY');
    }
    else //this function will never be called by AI
    {
        this.p2Ended = true;
	    this.p2.player.result.currentGame++;
		this.p2.emit('message','LOBBY');

    }
		
    if((this.p1Ended && this.p2Ended) || this.p1.player.result.timedOut)
    {
        console.log('ended game');
        this.EndGame();
    }
};
space_game_core.prototype.EndGame = function()
{
    this.p1.player.currentRepetition ++;	
	//this.p1.emit('sendEmail'); // this goes to main_space_client.js, which has to send it to app.js through socket.emit then
    this.p2.player.currentRepetition ++;
    this.isEnded = true;
	
};
space_game_core.prototype.Share = function(client, data)
{
	if(this.isDG == "dg")  
	{
		this.gameLength = (new Date().getTime()) - this.startMilliseconds;
    }

    this.given = parseInt(data[1]);
    this.kept = 1000 - parseInt(data[1]);
	this.shareSteps = data[2];
	var gotMother = false;
    //console.log(client.userid + data);
    if(client.userid == this.p1.userid)
    {
        this.sharer = this.p1;
		if (this.gotMothership == "p1") {gotMother = true;}

        this.p1.player.score += this.kept;
        this.p2.player.score += this.given;

        this.p1.player.SetGameResultSpace(this.id,true,this.score,this.given,this.kept,this.p1ShotsFired, this.p1EnemyKilled, this.p1DistanceToMothership, this.gameLength,true,gotMother);

        this.p2.player.SetGameResultSpace(this.id,false,this.score,this.given,this.kept,this.p2ShotsFired, this.p2EnemyKilled,  this.p2DistanceToMothership, this.gameLength, false,!gotMother);        

        this.p1.emit('message','GIVEN_AMMOUNT,'+this.given+',SHARER');
		if (!this.p1.player.result.timedOut)
		{
        	this.p2.emit('message','GIVEN_AMMOUNT,'+this.given+',RECIEVER');
		}
    }
    else
    {
        this.sharer = this.p2;
		if (this.gotMothership == "p2") {gotMother = true;}
        this.p2.player.score += this.kept;
        this.p1.player.score += this.given;
        this.p1.player.SetGameResultSpace(this.id,false,this.score,this.given,this.kept,this.p1ShotsFired, this.p1EnemyKilled, this.p1DistanceToMothership, this.gameLength,true,!gotMother);
        this.p2.player.SetGameResultSpace(this.id,true,this.score,this.given,this.kept,this.p2ShotsFired, this.p2EnemyKilled, this.p2DistanceToMothership,this.gameLength,false,gotMother);
        
        this.p1.emit('message','GIVEN_AMMOUNT,'+this.given+',RECIEVER');
		if (!this.p1.player.result.timedOut)
		{
        	this.p2.emit('message','GIVEN_AMMOUNT,'+this.given+',SHARER');
		}

    }
		
    //setTimeout(this.EndGame(),2000); 
};
space_game_core.prototype.GetResult = function()
{
    return('Game ID : '+ this.id+'\nTotal Score : '+ this.score+'\n'+this.p1.userid+'\n'+this.p2.userid);
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Client Messages handler
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
space_game_core.prototype.onMessage = function(client, data){

    var splittedData = data.split(',');
    switch (splittedData[0])
    {
        case 'INPUT':
            splittedData.push((new Date().getTime()) - this.startMilliseconds);
            this.onInput(client, splittedData);
        break;
        case 'MOUSE_INPUT':
            //console.log(splittedData[1]);
            this.shareInput(client, splittedData);
        break;
        case 'ANIM_END':
        break;
        case 'SHARE':
			//console.log(splittedData);
            this.Share(client,splittedData);
        break;
        case 'ENDED':
            this.PlayerEnded(client, splittedData);
        break;
    }
};




