////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Varibles declaration
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
var isXPRunning = false;
var canvas;
var stage;
var stagewidth;
var stageheight;
//Proto FSM
var lastState;
var state;
//Proto States
var firstState = "state_first";
var loadingState = "state_loading";
var waitAnotherState = "state_another";
var gameState = "state_game";
var shareState = "state_share";


//IO Socket
var socket;

//Views
var ship;
var allyShip;
var background;
var enemy;
var shot;
var mothership;

var progressText ;
//Game Variables
var score;

var canfire = true;
var invaderArray = [];
var bulletArray = [];

var xSpeed = 5;
var shotSpeed = 10;
var invaderWidth = 32;
var leftBounds = 25;
var rightBounds = 575;
var invaderSpeed = 6;
var changeDirection = false;
var alphaThreshold = 0.75;

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
//Constants
var KEYCODE_LEFT = 37;
var KEYCODE_RIGHT = 39;
var KEYCODE_SPACE = 32;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Entry Point (Function called by the HTML canvas element)
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function Main() {


      canvas = document.getElementById("viewport");
      stage = new createjs.Stage(canvas);

      stagewidth = stage.canvas.width;
      stageheight = stage.canvas.height;

      //state = firstState;

      startServerListen(); 

      background = new createjs.Bitmap("/public/images/SpaceBackground.png");
      stage.addChild(background);
      stage.update();

      //Game Loop Listener
      createjs.Ticker.setFPS(60);
      createjs.Ticker.on("tick", tick); 


      window.addEventListener("keydown", function(e) {
      // space and arrow keys
      if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
            e.preventDefault();
      }
      }, false);

      StartLoading();
}

function StartLoading()
{
      //lastState = state;
      //state = loadingState;
      //Loading Progression text
      progressText = new createjs.Text("", "20px Arial", "#FFFFFF")
      progressText.y = 100;
      progressText.x = 100; 

      stage.addChild(progressText);
      stage.update();
      //Loading Manifest
      manifest = [
                        {src:"/public/images/SpaceBackground.png", id:"background"},
                        {src:"/public/images/Ship.png", id:"ship"},
                        {src:"/public/images/AllyShip.png", id:"allyShip"},
                        {src:"/public/images/Enemy.png", id:"enemy"},
                        {src:"/public/images/ShootGradius.png", id:"shot"},
                        {src:"/public/images/Boss.png", id:"mother"},

                  ];
      //loading Events and Callbacks
      preloader = new createjs.LoadQueue(true)
      preloader.installPlugin(createjs.Sound);
      preloader.on("progress",handleProgress);
      preloader.on("complete" , handleComplete);
      preloader.on("fileload" , handleFileLoad);
      preloader.on("error", loadError);
      preloader.loadManifest(manifest);
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Preloading callback functions
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function handleFileLoad (event)
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
      if(event.item.id == "enemy"){
            enemy = new createjs.Bitmap(event.result);
             for(var i = 0 ; i < 10 ; i ++)
              {
                var tmpEnemy = new createjs.Bitmap(event.result);
                tmpEnemy.x = EnemiesCont.x + 50 * i;
                tmpEnemy.y = EnemiesCont.y;
                EnemiesCont.addChild(tmpEnemy);
              }
      }
      if(event.item.id == "shot"){
            shot = new createjs.Bitmap(event.result);
      }
}
function loadError (event)
{
      console.log("PRELOAD ERROR : "+evt.text);
}
function handleProgress (event)
{
     progressText.text = (preloader.progress*100|0) + " % Loaded";
     stage.update(); 
}
function handleComplete (event)
{
     //console.log("Finished Loading Assets");
     //stage.addChild(background);
     //lastState = state;
     //state = waitAnotherState;
     
     InitLobbyState();
     
}



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Server listening relative code
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function startServerListen()
{
      //Socket init
      
      var tmpAddress = document.URL;
      var serverAddress = tmpAddress.substring(0,tmpAddress.lastIndexOf('/'));
      socket = io.connect(serverAddress);
      console.log('connection message sent to : '+serverAddress);
      //Socket Server Listener

      socket.on("message",function(data){
            serverMessageParser(data);
      });

      
}

function serverMessageParser(data)
{
      var splittedData = data.split(',');
      console.log('message recieved from server : '+ data);
      switch (splittedData[0])
      {
        case 'UPDATE':
          updateScreen(splittedData);
        break;
        case 'INFO':
          document.getElementById("id").innerHTML = "Player ID: "+splittedData[1];
          document.getElementById("repetition").innerHTML = "Current Repetition: "+splittedData[2];
          document.getElementById("score").innerHTML = "Total Score: "+splittedData[3];

          document.getElementById("xpName").innerHTML = "Experience Name : "+splittedData[4];
          document.getElementById("xpIter").innerHTML = "Number of Repetition : "+splittedData[5];
          document.getElementById("xpGame").innerHTML = "Game : "+splittedData[6];
        break;
        case 'GAME_START':
          isXPRunning = true;
          ClearGameState();
          ClearLobbyState();
          InitGameState();
        break;
        case 'LOBBY':
          ClearLobbyState();
          ClearGameState();
          InitLobbyState();
        break;
        case 'NO_XP':
          isXPRunning = false;
          ClearGameState();
          ClearLobbyState();
          InitNoXP();
        break;
        case 'SHARE_STATE':
          ClearGameState();
          ClearLobbyState();
          InitShareState();
        break;
        case 'SHARE_WAIT':
          ClearGameState();
          ClearLobbyState();
          InitShareWait();
        break;
      }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Init State Functions
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function InitGameState()
{
  ship.x = 400;
  ship.y = 550;
  stage.addChild(ship);

  allyShip.x = 400;
  allyShip.y = 550;
  stage.addChild(allyShip);

  EnemiesCont.x = 100;
  EnemiesCont.y = 150;

  mothership.x = 100;
  mothership.y = 20;
  stage.addChild(mothership);
  stage.addChild(EnemiesCont);
  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;
}

function InitLobbyState()
{
  progressText.text = "You are now in Lobby : Waiting For another Player to join";
    var circleSize = 100;
    var elemSize = 30;
    var elemNum = 10;
    var stageCenterX = stagewidth / 2;
    var stageCenterY = stageheight / 2;
    var angle = 2*Math.PI / elemNum;

    for(var i = 0 ; i < elemNum ; i++)
    {
      var tmpCircle = new createjs.Shape();
      tmpCircle.graphics.beginFill("white").drawCircle( circleSize * Math.cos(i*angle),  circleSize * Math.sin(i*angle), elemSize);
      tmpCircle.x = 100;
      tmpCircle.y = 100;
      tmpCircle.alpha = 0.75;
      WaitWheel.addChild(tmpCircle);
    }
    WaitWheel.x = stageCenterX - 2*circleSize;
    WaitWheel.y = stageCenterY - 2*circleSize;
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
}

function InitNoXP()
{
  progressText.text = "You are now in Lobby : No XP is currently running"; 
  stage.addChild(progressText);
  stage.update();
  
}

function InitShareState()
{
  progressText.text = "You can now share the points with the other player"; 
  stage.addChild(progressText);
  stage.update();
}

function InitShareWait()
{
  progressText.text = "The other player will now share a fraction of the points with you.\nWait until he is done"; 
  stage.addChild(progressText);
  stage.update();
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Clear State Functions
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function ClearGameState()
{
  stage.removeChild(progressText);
  stage.removeChild(ship);
  stage.removeChild(EnemiesCont);
  stage.update();
}

function ClearLobbyState()
{
  stage.removeChild(progressText);
  stage.removeChild(WaitWheel);
  stage.update();
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Game Loop
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function tick(event) {
      switch (state)
      {
            case firstState:
                  firstStateUpdate();
            break;
            case waitAnotherState:
                  waitStateUpdate();
            break;
            case gameState:
                  gameStateUpdate();
            break;
            case shareState:
                  shareStateUpdate();
            break;
      }
      stage.update(event);
}

function firstStateUpdate()
{

}

function waitStateUpdate()
{

}

function gameStateUpdate()
{

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Input Callbacks
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function handleKeyDown(e)
{

  switch (e.keyCode) {
    case KEYCODE_LEFT:
      sendInputs(1,0,0);
      break;
    case 65:  // A
      sendInputs(1,0,0);
        break;
    case KEYCODE_RIGHT:
      sendInputs(0,1,0);
      break;
    case 68:  // D
      sendInputs(0,1,0);
        break;
  }
  
}

function handleKeyUp(e)
{
  
  switch (e.keyCode) {
    case KEYCODE_SPACE:
      sendInputs(0,0,1);
    break;
    case 69:
      debugAddScore();
    break;
    case 70:
      debugShare();
    break;
    case 71:
      debugEnd();
    break;
  }  
  
}

function debugAddScore()
{
  socket.emit("message",'SCORE');
}

function debugShare()
{
  socket.emit("message",'SHARE');
}

function debugEnd()
{
  socket.emit("message",'END');
}

function sendInputs(left,right,shoot)
{
  if(isXPRunning)
  {
    socket.emit("message",'INPUT,'+left+','+right+','+shoot);
  }
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
//      Element 3 = enemy pack x
//      Element 4 = mothership x
//      Element 5 --> End = shots
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function updateScreen(data)
{
  drawOwnShip(data[1]);
  drawAllyShip(data[2]);
  drawEnemies(data[3]);
  drawMothership(data[4]);
  drawShots(data);
}

function drawOwnShip(data)
{
  ship.x = data;
}

function drawAllyShip(data)
{
  allyShip.x = data;
}

function drawEnemies(data)
{
  EnemiesCont.x = data;
}
function drawMothership(data)
{
  mothership.x = data;
}
function drawShots(data)
{

}
