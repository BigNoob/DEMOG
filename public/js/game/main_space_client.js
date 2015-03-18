////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Varibles declaration
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
var isXPRunning = false;
var xpType;
var xpGame;
var canvas;
var stage;
var stagewidth;
var stageheight;
var loginPrompt;

var state;
var state_load = 'STATE_LOAD';
var state_game ='STATE_GAME';
var state_endAnim = 'STATE_ENDANIM';
var state_share = 'STATE_SHARE';
var state_displayShare = 'STATE_DISPLAY';
var state_wait = 'STATE_WAIT';
var state_lobby = 'STATE_LOBBY';
var state_noxp = 'STATE_NOXP';
var state_xpEnd = 'STATE_ENDXP';
var state_login = 'STATE_LOGIN';

//Language
var language = 'en';
//Strings Array index numbers

var str_lobby = 0;
var str_noxp = 1;
var str_waitShare = 2;
var str_doShare = 3;

var str_playerId = 4;
var str_playerRep = 5;
var str_playerScore = 6;

var str_xpName = 7;
var str_xpRep = 8;
var str_xpGame = 9;

var str_score = 10;
var str_given = 11;
var str_loginPrompt = 12;
var str_gameTuto = 13;
var str_loading = 14;
var addx = 0;
var addy = 0;

//Strings Array
var stringsArray = [];
var score_value = 0;

//IO Socket
var socket;

//Views
var ship;
var allyShip;
var background;
var enemy;
var shot;
var mothership;
var arrow;

var progressText;
var progressText2;
var buttonText;
var score;

var maxAmmount;
var minAmmount;
var givenAmmount;
var slider;
//Game Variables


var share = -1;

var canMoveArrow = true;
var canEndGame = true;
var canSendAmount = true;

var bulletArray = [];

//Preloader
var preloader;
var manifest;
var totalLoaded = 0;

var WaitView = new createjs.Container();
var GameView = new createjs.Container();
var ShareView = new createjs.Container();


var WaitWheel = new createjs.Container();
var wheelCircleArray;
var wheelInc = 0;

var EnemiesCont = new createjs.Container();
var enemiesY = 150;
var enemiesX = 100;
var enemiesX_spacing = 32;
var enemiesY_spacing = 32;
var lines = 4;    //must be changed in space_coop_core.js also, 4 in real test
var number = 10;   //must be changed in space_coop_core.js also, 10 in real test


//----------------

var keys=[];

//Constants
var KEYCODE_LEFT = 37;
var KEYCODE_RIGHT = 39;
var KEYCODE_SPACE = 32;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Entry Point of Space Coop (Function called by main.jst)
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function Main_Space(type,game) {
  xpType = type;
  xpGame = game;
  canvas = document.getElementById("viewport");
  stage = new createjs.Stage(canvas);

  stagewidth = stage.canvas.width;
  stageheight = stage.canvas.height;

  //Game Loop Listener
  createjs.Ticker.setFPS(20); //60
  createjs.Ticker.on("tick", tick_Space); 


  canvas.addEventListener('mousedown',function(event) {handleClick(event); }, false);
  window.addEventListener("keydown", function (event) {
      keys[event.keyCode] = true;
  });

  window.addEventListener("keyup", function (event) {
      keys[event.keyCode] = false;
  });


	window.onfocus = function () { 
	   socket.emit('active');
	}; 

	window.onblur = function () { 
	   socket.emit('inactive');
		alert('inactive');
	}; 



  StartLoading_Space();
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//   Loading Functions
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function StartLoading_Space()
{
  console.log('plop');
  state = state_load;
  LoadStrings_Space();

  background = new createjs.Bitmap("/public/images/SpaceBackground.png");
  stage.addChild(background);
  stage.update();

  progressText = new createjs.Text("", "20px Arial", "#FFFFFF");
  progressText.textAlign = "center";
  progressText.y = 20;
  progressText.x = 400 ;

  progressText2 = new createjs.Text("", "20px Arial", "#FFFFFF");
  progressText2.textAlign = "center";
  progressText2.y = 500;
  progressText2.x = 400 ;

  score = new createjs.Text("Score : 0","20px Arial","#FFFFFF");

  maxAmmount= new createjs.Text("", "20px Arial", "#FFFFFF");
  minAmmount= new createjs.Text("", "20px Arial", "#FFFFFF");
  givenAmmount= new createjs.Text("", "20px Arial", "#FFFFFF");

  stage.addChild(progressText);
  stage.addChild(progressText2);
  stage.update();
  //Loading Manifest
  manifest = [
                {src:"/public/images/SpaceBackground.png", id:"background"},
                {src:"/public/images/Ship.png", id:"ship"},
                {src:"/public/images/AllyShip.png", id:"allyShip"},
                {src:"/public/images/Enemy.png", id:"enemy"},
                {src:"/public/images/ShootGradius.png", id:"shot"},
                {src:"/public/images/Boss.png", id:"mother"},
                {src:"/public/images/Arrow.png", id:"arrowBMP"},
              ];
  //loading Events and Callbacks
  preloader = new createjs.LoadQueue(true)
  preloader.installPlugin(createjs.Sound);
  preloader.on("progress",handleProgress_Space);
  preloader.on("complete" , handleComplete_Space);
  preloader.on("fileload" , handleFileLoad_Space);
  preloader.on("error", loadError_Space);
  preloader.loadManifest(manifest);
}

function LoadStrings_Space()
{
  var XMLStrings;
  var XMLNode;
  /*
  if(window.XMLHttpRequest)
  {
    var xmlhttp = new XMLHttpRequest();
  }
  else
  {
    var xmlhttp = new ActiveXObject("'MSXML2.XMLHTTP.3.0'");    
  }
  xmlhttp.open("GET","/public/localization/lang.xml");
  xmlhttp.send();
  XMLStrings= xmlhttp.responseXML;
  */

    var xmlURL = "/public/localization/lang.xml";
    new Ajax.Request(xmlURL, {
        method: "get",
        asynchronous: false,
        onSuccess: function(resp, jsonObj) {
            XMLStrings = resp.responseXML;
        }
    });
  XMLNode = XMLStrings.getElementsByTagName(language)
  console.log(XMLNode[0].childElementCount);
  for(var i = 0; i < XMLNode[0].childElementCount ; i++)
  {
    var tmp = XMLNode[0].childNodes[i].textContent || XMLNode[0].childNodes[i].innerText
    stringsArray.push(tmp);
    console.log(tmp);
  }
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Preloading callback functions
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function handleFileLoad_Space (event)
{
      if(event.item.id == "background"){
            background = new createjs.Bitmap(event.result);
      }
      if(event.item.id == "ship"){
            ship = new createjs.Bitmap(event.result);
      }
      if(event.item.id == "allyShip"){
            allyShip = new createjs.Bitmap(event.result);
      }
      if(event.item.id == "mother"){
            mothership = new createjs.Bitmap(event.result);
      }
      if(event.item.id == "arrowBMP"){
            arrow = new createjs.Bitmap(event.result);
      }
      if(event.item.id == "enemy"){
            enemy = new createjs.Bitmap(event.result);
            for(var j = 0; j < lines; j++)
            {
                for(var i = 0; i < number; i ++)
                {
                  var tmpEnemy = new createjs.Bitmap(event.result);
                  tmpEnemy.x = i * enemiesX_spacing;
                  tmpEnemy.y = j * enemiesY_spacing;
                  EnemiesCont.addChild(tmpEnemy);
                }
            } 


      }
      if(event.item.id == "shot"){
            shot = new createjs.Bitmap(event.result);
      }
}
function loadError_Space (event)
{
      console.log("PRELOAD ERROR : "+evt.text);
}
function handleProgress_Space (event)
{
     progressText.text = (preloader.progress*100|0) + stringsArray[str_loading];
     stage.update(); 
}
function handleComplete_Space (event)
{
     startServerListen_Space();  //We start listening to the server after the loading of all the assets
	 
     InitLobbyState_Space(',,'); 
	 socket.emit('updateTime',true);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Server listening relative code
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function startServerListen_Space()
{
  //Socket init

  var tmpAddress = document.URL;
  var serverAddress = tmpAddress.substring(0,tmpAddress.lastIndexOf('/'));
  socket = io.connect(serverAddress);

  var QueryString = function () {
	  // This function is anonymous, is executed immediately and 
	  // the return value is assigned to QueryString!
		// used to get the mturk id of the player entered in an html form on the previous page
	  var query_string = {};
	  var query = window.location.search.substring(1);
	  var vars = query.split("&");
	  for (var i=0;i<vars.length;i++) {
		var pair = vars[i].split("=");
		    // If first entry with this name
		if (typeof query_string[pair[0]] === "undefined") {
		  query_string[pair[0]] = pair[1];
		    // If second entry with this name
		} else if (typeof query_string[pair[0]] === "string") {
		  var arr = [ query_string[pair[0]], pair[1] ];
		  query_string[pair[0]] = arr;
		    // If third or later entry with this name
		} else {
		  query_string[pair[0]].push(pair[1]);
		}
	  } 
    return query_string;
	} ();

  socket.emit('playerLogin',QueryString.playerid);
	
	/* // old code to use a pop up to get mturk id
  if(xpType == "amazona")
  {
	
	
    loginPrompt  = prompt(stringsArray[str_loginPrompt]);
    if(loginPrompt != null)
    {
      socket.emit('playerLogin',loginPrompt);
    }
	
  }
	*/

 
  //Socket Server Listener
  socket.on("message",function(data){
        serverMessageParser_Space(data);
  });   

  socket.on("partnerLost",function(){
        socket.emit('partnerLost');
  }); 

  socket.on("sendEmail",function(){
        socket.emit('sendEmail');
  });

  socket.on("updateTime",function(m){
        socket.emit('updateTime',m); // to know the waiting time in the lobby
  });
}

function serverMessageParser_Space(data)
{
      var splittedData = data.split(',');
      switch (splittedData[0])
      {
        case 'UPDATE':
          updateScreen_Space(splittedData);
        break;
        case 'INFO':
        /*
          document.getElementById("id").innerHTML = stringsArray[str_playerId]+splittedData[1];
          document.getElementById("repetition").innerHTML = stringsArray[str_playerRep]+splittedData[2];
          document.getElementById("score").innerHTML = stringsArray[str_playerScore]+splittedData[3];

          document.getElementById("xpName").innerHTML = stringsArray[str_xpName]+splittedData[4];
          document.getElementById("xpIter").innerHTML = stringsArray[str_xpRep]+splittedData[5];
          document.getElementById("xpGame").innerHTML = stringsArray[str_xpGame]+splittedData[6];
          */
        break;
        case 'GIVEN_AMMOUNT':
          ClearShareState_Space();
          ClearShareWait_Space();
          DrawGivenAmmount(splittedData[1], splittedData[2]);
        break;
        case 'GAME_START':
          isXPRunning = true;
          console.log("gamestart");
          //ClearGameState_Space();
          ClearLobbyState_Space();
          InitGameState_Space();
        break;
        case 'CLEARSHARE':
              for(var i = 0 ; i < EnemiesCont.getNumChildren() ; i++)
			  {
				EnemiesCont.getChildAt(i).alpha = 1;
			  }    
        break;
        case 'LOBBY':
          //ClearLobbyState_Space();
		  //canEndGame = true;
		  socket.emit('updateTime',true);
          ClearGameState_Space();    
          ClearShareState_Space();
          ClearShareWait_Space();     

     
		  //ClearDrawGivenAmmount_Space();
		  InitLobbyState_Space(splittedData); 
		  //InitLobbyState_Space(undefined); 
        break;
        case 'NO_XP':
          isXPRunning = false;
          ClearGameState_Space();
          //ClearLobbyState_Space();
          InitNoXP_Space();
        break;
        case 'REMOVE_MOTHERSHIP':
			stage.removeChild(mothership);
			stage.removeChild(score);			
			stage.update();
        break;
        case 'SHARE_STATE':
		  if (xpGame == "dg") {score_value = 1000;}
		  isXPRunning = true;
		  ClearLobbyState_Space();
          ClearGameState_Space();
          //ClearLobbyState_Space();
          InitShareState_Space();
        break;
        case 'SHARE_WAIT':
		  if (xpGame == "dg") {score_value = 1000;}
		  isXPRunning = true;
          ClearGameState_Space();
          ClearLobbyState_Space();
          InitShareWait_Space();
        break;
        case 'REDIRECT':
			if (xpGame == "dg") {window.location.replace('/end5');} 
			else {window.location.replace('/end1');}
		break;
        case 'EXIT':
			window.location.replace('/exit');
        break;
      }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Init State Functions
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function InitGameState_Space()
{

  
  progressText.text = stringsArray[str_gameTuto]; 
  progressText.y = 20;
  progressText.x = 400 ;
  progressText.textAlign = "center";

  ship.x = 350;
  ship.y = 550;
  ship.alpha = 1.0;

  allyShip.x = 450;
  allyShip.y = 550;

  EnemiesCont.x = 100;
  EnemiesCont.y = 150;

  mothership.x = 100;
  mothership.y = 20;

  stage.addChild(progressText);
  stage.addChild(ship);
  stage.addChild(allyShip);
  stage.addChild(mothership);
  stage.addChild(score);
  stage.addChild(EnemiesCont);

  state = state_game;  
}

function InitLobbyState_Space(data)
{
/*
  if(data == undefined)
  {
    var score = 0;
  }
  else
  {
    var score = data[1].player.score;   
  }

  if ((xpGame == 'dg') && (score == 0))
  {
    progressText.text = "Please wait for another person to join.";
  }
  else if (score == 0)
  {
    progressText.text = stringsArray[str_lobby];
  }
  else
  {
    progressText.text = stringsArray[str_lobby]+'\n You have '+score+' points';
  }
*/ 
  progressText.text = "";
  if (typeof data[2] !== 'undefined' && data[2] == 'disconnection')
  {
	progressText.text = "Your partner has disconnected. \n\n Please wait for another person to join.";
  } else
  {
	progressText.text = "Please wait for another person to join. \n\n Keep this tab active or the task will not start.  ";
  }
  progressText.y = 20;
  progressText.x = 400 ;
  progressText.textAlign = "center";



  var circleSize = 80;
  var elemSize = 20;
  var elemNum = 8;
  var stageCenterX = 400;
  var stageCenterY = 300;
  var angle = 2*Math.PI / elemNum;

  WaitWheel = null;
  WaitWheel = new createjs.Container();

  for(var i = 0 ; i < elemNum ; i++)
  {
    var tmpCircle = new createjs.Shape();
    tmpCircle.graphics.beginFill("white").drawCircle( circleSize/2 * Math.cos(i*angle),  circleSize/2 * Math.sin(i*angle), elemSize);
    tmpCircle.alpha = 0.75;
    WaitWheel.addChild(tmpCircle);
  }
  WaitWheel.x = stageCenterX + 30 - circleSize/2;
  WaitWheel.y = stageCenterY - circleSize/2;
  stage.addChild(WaitWheel);
  stage.addChild(progressText);
  stage.update();

  window.setInterval(function(){
    if(wheelInc < WaitWheel.getNumChildren())
    {
      wheelInc++;
    }
    else
    {
      wheelInc = 0;
    }
    for(var i = 0 ; i < WaitWheel.getNumChildren() ; i++  )
    {
      if(i == wheelInc)
      {
            WaitWheel.getChildAt(i).alpha = 0;
            if(i-1 >= 0){WaitWheel.getChildAt(i-1).alpha = 0.125;}
            if(i-2 >= 0){WaitWheel.getChildAt(i-2).alpha = 0.25;} 
            if(i-3 >= 0){WaitWheel.getChildAt(i-3).alpha = 0.375;} 
            if(i-4 >= 0){WaitWheel.getChildAt(i-4).alpha = 0.50;} 
            if(i-5 >= 0){WaitWheel.getChildAt(i-5).alpha = 0.625;}                         
      }
      else
      {
        WaitWheel.getChildAt(i).alpha = 0.75;
      }
    }
  },100);

  state = state_lobby;  
}



function InitNoXP_Space()
{
  progressText.text = stringsArray[str_noxp];  
  progressText.y = 20;
  progressText.x = 400 ;
  progressText.textAlign = "center";

  stage.addChild(progressText);
  stage.update();
  state = state_noxp;  
}

function InitShareState_Space()
{
  share = -1;
  canEndGame = true;
  canSendAmount = true;
  if (xpGame == "dg")
  {progressText.text = "You have been randomly attributed the role of giver.\n\n Before going on to the next task, please share the points with the other person. \n\n\n\nIndicate how much you want to give by clicking on the scale below.\n\n\n\n\n\n\n\n I want to GIVE:";
  progressText2.text = "Validate by pressing space.";
  }
  else 
  {
	progressText.text = stringsArray[str_doShare] + "\n\n\n\n\n\n\n\n\n\n\n\n I want to GIVE:";
	progressText2.text = "Validate by pressing space.";
  }
  progressText.y = 20;
  progressText.x = 400;
  progressText.textAlign = "center";
  progressText2.y = 500;
  progressText2.x = 400;
  progressText2.textAlign = "center";

  maxAmmount.x = 700;
  maxAmmount.y = 400;
  maxAmmount.width = 100;
  maxAmmount.text = score_value;

  minAmmount.x = 100;
  minAmmount.y = 400;
  minAmmount.width = 100;
  minAmmount.text = "0";
  minAmmount.textAlign = "right";

  givenAmmount.x = 390;
  givenAmmount.y = 350;
  givenAmmount.width = 100;
  givenAmmount.text = "";

  slider = new createjs.Shape();
  slider.graphics.beginFill("white").drawRect(100,400,600,20);
  ship.x = 100;
  ship.y = 390;
  ship.alpha = 0.0;

  arrow.x=100;
  arrow.y = 400;
  arrow.alpha = 0.0;
  
  stage.addChild(slider);
  stage.addChild(ship);
  stage.addChild(maxAmmount);
  stage.addChild(minAmmount);
  stage.addChild(givenAmmount);
  stage.addChild(progressText);
  stage.addChild(progressText2);
  stage.addChild(arrow);
  stage.update();
  state = state_share;  
  handleKeyDown_Space2();
}

function InitShareWait_Space()
{
  share = -1;
  canEndGame = true;
  canSendAmount = true;
  if (xpGame == "dg")
  {progressText.text = "You have been randomly attributed the role of receiver.\n \n Please wait while the other person is sharing the points.";}
  else 
  {progressText.text = stringsArray[str_waitShare];} 
  progressText.y = 20;
  progressText.x = 400 ;
  progressText.textAlign = "center";

  stage.addChild(progressText);
  stage.update();
  state = state_wait; 
}



function DrawGivenAmmount(data, role)
{
  var given = parseInt(data);
  var left = 1000 - parseInt(data);
  if(role == "RECIEVER")
  { 

	  if (xpGame == "dg")
	  {progressText.text = "The other person shared the points and gave you "+given+" out of 1000 points. \n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n Press SPACE to continue."; }
	  else 
	  {progressText.text = "The other player shared the points and gave you "+given+" out of 1000 points. \n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n Press SPACE to continue."; } 
	  
	  progressText.y = 20;
	  progressText.x = 400 ;
	  progressText.textAlign = "center";
/*
	  button = new createjs.Shape();
	  button.graphics.beginFill("white").drawRect(325,400,150,50);
      buttonText = new createjs.Text("", "20px Arial", "#000000");
      buttonText.textAlign = "center";
	  buttonText.text = "Continue";
	  buttonText.y = 415;
	  buttonText.x = 400;

	  stage.addChild(button);
	  stage.addChild(buttonText);
//*/
	  stage.addChild(progressText);

	  stage.update();
	  state = state_displayShare; 
    
  }
  else if(role == "SHARER")
  {
	  if (xpGame == "dg")
	  {progressText.text = "You have given "+given+" out of 1000 points to the other person.\n\n Your points for this experiment are thus "+left+".\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n Press SPACE to continue."; }
	  else 
	  {progressText.text = "You have given "+given+" out of 1000 points to the other player.\n\n Your points for this game are thus "+left+".\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n Press SPACE to continue."; } 
	
	  progressText.y = 20;
	  progressText.x = 400 ;
	  progressText.textAlign = "center";
	  /*button = new createjs.Shape();
	  button.graphics.beginFill("white").drawRect(325,400,150,50);
      buttonText = new createjs.Text("", "20px Arial", "#000000");
      buttonText.textAlign = "center";
	  buttonText.text = "Continue";
	  buttonText.y = 415;
	  buttonText.x = 400;

	  stage.addChild(button);
	  stage.addChild(buttonText); */
	  stage.addChild(progressText);
	  stage.update();
	  state = state_displayShare; 
 
    
  }
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Clear State Functions
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function ClearGameState_Space()
{
  stage.removeChild(WaitWheel);
  stage.removeChild(progressText);
  stage.removeChild(ship);
  stage.removeChild(allyShip);
  stage.removeChild(EnemiesCont);
  stage.removeChild(mothership);
  stage.removeChild(score);
  for(var i = 0 ; i < EnemiesCont.getNumChildren() ; i++)
  {
    EnemiesCont.getChildAt(i).alpha = 1;
  }
  for(var j = 0; j < bulletArray.length; j ++)
  {
    stage.removeChild(bulletArray[j]);
  }
  stage.update();
}

function ClearLobbyState_Space()
{
  stage.removeChild(progressText);
  stage.removeChild(WaitWheel);
  stage.update();
}

function ClearShareWait_Space()
{
  stage.removeChild(progressText);
  stage.update();
}

function ClearShareState_Space()
{
  stage.removeChild(slider);
  stage.removeChild(ship);
  stage.removeChild(maxAmmount);
  stage.removeChild(minAmmount);
  stage.removeChild(givenAmmount);
  stage.removeChild(progressText);
  stage.removeChild(progressText2);
  stage.removeChild(arrow);
  stage.update();
}


function ClearDrawGivenAmmount_Space()
{
  stage.removeChild(progressText);
  socket.emit('ici');
  //stage.removeChild(button);
  //stage.removeChild(buttonText);
  //stage.removeChild(button); //sometimes the button and button text is not removed (about 1 out of ten 10). don't know why. removing it twice is an unelegant but effective way to deal with this problem
  //stage.removeChild(buttonText);
  //stage.removeAllChildren();
  stage.update();
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Screen Default Update
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function tick_Space(event) {
  stage.update(event); 

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Input Callbacks
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function handleKeyDown_Space2()
{
  if(state == state_game)
  {
	var tmpLeft = 0;
	var tmpRight = 0;
	var tmpSpace = 0;
    if (keys[KEYCODE_LEFT]) {
        tmpLeft = 1;
    }
    if (keys[KEYCODE_RIGHT]) {
        tmpRight = 1;
    }
    if (keys[KEYCODE_SPACE]) {
	  tmpSpace = 1;      
    }
    if (tmpLeft+tmpRight+tmpSpace != 0) {
		sendInputs_Space(tmpLeft,tmpRight,tmpSpace);
    }


  }
  else if (state == state_share)
  {

    if (keys[KEYCODE_LEFT]) {
      if(canMoveArrow)
      {
        //sendInputs_Space(1,0,0);
		UpdateShareAmmount_Space(-1);
        canMoveArrow = false;
        setTimeout(function(){canMoveArrow = true},150);
      }
    }
    if (keys[KEYCODE_RIGHT]) {
      if(canMoveArrow)
      {
        //sendInputs_Space(0,1,0);
		UpdateShareAmmount_Space(-2);
        canMoveArrow = false;
        setTimeout(function(){canMoveArrow = true},150);
      }
    }
    if (keys[KEYCODE_SPACE]) {
        if(share >= 0 && canSendAmount)
        {
		  canSendAmount = false;
          SendShareAmmount_Space();
        }
    }

  }
  else if (state == state_displayShare)
  {
    setTimeout(function(){ //to prevent skipping this stage with the space key presses of the previous stage
		if (keys[KEYCODE_SPACE] && canEndGame) { 
			canEndGame = false;
			//ClearDrawGivenAmmount_Space();
			socket.emit("message",'ENDED');              
		}
	},1000);


  }

}


function handleClick(e)
{
  if(state == state_share)
  {
    var mousePos = getMousePos(canvas,e);
    sendMouseInput(mousePos.x);
    UpdateShareAmmount_Space(mousePos.x);
  } 
  else if (state == state_displayShare)
  {
	/*
	var mousePos = getMousePos(canvas,e);
    if ((mousePos.x >= 325) && (mousePos.x <= 425) && (mousePos.y >= 400) && (mousePos.y <= 450)) //if click on button
	{
		ClearDrawGivenAmmount_Space();
		socket.emit("message",'ENDED');
	}
	*/
  }
}
function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}
function UpdateShareAmmount_Space(x)
{
  
  if(arrow.alpha == 1.0) //execute only if player has clicked once - prohibit using left and right keys first
  {

	  if (x == -1) // if left key is pressed - see above function handleKeyDown_Space
	  {
		share -= 10;
		if(share < 0){share = 0;}
		arrow.x = parseInt((share / score_value) * 600 + 100) - 9;
	  }
	  else if (x == -2) // if right key is pressed - see above function handleKeyDown_Space
	  {
		share += 10;
		if(share > score_value){share = score_value;}
		arrow.x = parseInt((share / score_value) * 600 + 100) - 9;
	  }
	  else // if click
	  {
		  var X = x;
		  if(X < 100){X = 100;}
		  if(X > 700){X = 700;}
		  share = parseInt(score_value * (X -100)/(600));
		  share = Math.round(share / 10) * 10; // round to closest 10
		  arrow.x= parseInt((share / score_value) * 600 + 100) - 9;
		  
	  }
	  //console.log(share);
	  maxAmmount.text = score_value;
	  minAmmount.text = 0;
	  givenAmmount.text = share;
  }
}
function SendShareAmmount_Space()
{
  socket.emit("message",'SHARE,'+ share);
}

function sendInputs_Space(left,right,shoot)
{	
  if(isXPRunning)
  {
    socket.emit("message",'INPUT,'+left+','+right+','+shoot);
  }
}
function sendMouseInput(x)
{
  var X = x;
  //console.log(X);
  if(X < 100){X = 100;}
  if(X > 700-18){X = 700-18;}
  socket.emit("message",'MOUSE_INPUT,'+ X);
  UpdateShareAmmount_Space();
  if(arrow.alpha == 0.0)
  {
    arrow.alpha = 1.0;
  }
  /*
  if(ship.alpha == 0.0)
  {
    ship.alpha = 1.0;
  }
  */
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Drawing Functions
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//   Update Message Anatomy
//      Element 0 = 'UPDATE'
//      Element 1 = own ship x
//      Element 2 = ally ship x
//      Element 3 = enemy pack data (x position then 1 if alive 0 else)
//      Element 4 = mothership x
//      Element 5 = shots
//      Element 6 = score
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function updateScreen_Space(data)
{
  handleKeyDown_Space2();
  drawOwnShip_Space(data[1]);
  drawAllyShip_Space(data[2]);
  drawEnemies_Space(data[3]);
  drawMothership_Space(data[4]);
  drawShots_Space(data[5]);
  drawScore_Space(data[6]);
}

function drawOwnShip_Space(data)
{
  ship.x = data;
}

function drawAllyShip_Space(data)
{
  allyShip.x = data;
}

function drawEnemies_Space(data)
{
  var splittedData = data.split('#');
  EnemiesCont.x = splittedData[0];
  for(var i = 1; i < splittedData.length; i ++)
  {
    if(splittedData[i] == '0')
    {
      if(EnemiesCont.getChildAt(i-1))
      {
        EnemiesCont.getChildAt(i-1).alpha = 0;
      }
      
    }
  }
}

function drawMothership_Space(data)
{
  var splittedData = data.split('#');
  mothership.x = splittedData[0];
  scoreX = splittedData[0] +5;
  mothership.y = splittedData[1];
}

function drawShots_Space(data)
{
  var splittedData = data.split('#');

  for(var i = 0; i < splittedData.length / 4; i++)
  {

    for(var j = 0; j < bulletArray.length; j++)
    {
      if(bulletArray[j].uid == splittedData[i*4+3])
      {
        bulletArray[j].x = splittedData[i*4];
        bulletArray[j].y = splittedData[i*4+1];
        bulletArray[j].isUpdated = true;
        splittedData.splice(i*4,4);
      }
    }    
  }
  for(var i = 0; i < (splittedData.length / 4); i++)
  {
    var tmpShot = shot.clone();
    tmpShot.x = splittedData[i*4];
    tmpShot.y = splittedData[i*4+1];
    tmpShot.uid = splittedData[i*4+3];
    tmpShot.isUpdated = true;
    bulletArray.push(tmpShot);
    stage.addChild(bulletArray[bulletArray.length - 1]);  
  }
  for(var j = 0; j < bulletArray.length; j++)
  {
    if(!bulletArray[j].isUpdated)
    {
      stage.removeChild(bulletArray[j]);
      bulletArray.splice(j,1);
    }
    else
    {
      bulletArray[j].isUpdated = false;
    }
  }   
  stage.update();
}

function drawScore_Space(data)
{
  if(state == state_game)
  {
    //score.text =stringsArray[str_score] + data;
	score.text =data;   
	if (data == 1000)
	{addx = parseInt(mothership.x) + 10;}
	else if (data == 0) {addx = parseInt(mothership.x) + 25;}
	else {addx = parseInt(mothership.x) + 17;}
	score.x = addx.toString();
    addy = parseInt(mothership.y) + 20;
	score.y = addy.toString();
    score_value = data;
    if (score_value < 1000)
	{
		score_value = 1000; //makes sure the score value at the end of the expe is 1000, so that sharing is always on 1000 - found a bug in which it was only 975 (rabbits game, without touching a single key during the whole game)
	}
	
    stage.update();
  }
}
