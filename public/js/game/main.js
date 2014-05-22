////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Varibles declaration
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
var canvas;
var stage;

//Proto FSM
var lastState;
var state;
//Proto States
var firstState = "state_first";
var loadingState = "state_loading";
var waitAnotherState = "state_another";
var gameState = "state_game";
var shareState = "state_share";

//
var waintingForAnotherPlayer = true;
//Client relative variables
var login;
var xp;

//IO Socket
var socket;

//Views
var ship;
var allyShip;
var background;
var enemy;
var shot;

var progressText ;
//Game Variables
var score;

var xSpeed = 5;
var shotSpeed = 10;

var enemySpeed = 4;

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
//Constants
var KEYCODE_LEFT = 37;
var KEYCODE_RIGHT = 39;
var KEYCODE_SPACE = 32;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Entry Point (Function called by the HTML canvas element)
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function Main(loginQuery,xpQuery) {
      login = loginQuery;
      xp = xpQuery;
      console.log(login+" , "+xp); 

      canvas = document.getElementById("demoCanvas");
      stage = new createjs.Stage(canvas);

      state = firstState;

      document.onkeydown = handleKeyDown;
      document.onkeyup = handleKeyUp;

      background = new createjs.Bitmap("/public/images/SpaceBackground.png");
      stage.addChild(background);
      stage.update();

      //Game Loop Listener
      createjs.Ticker.setFPS(30);
      createjs.Ticker.on("tick", tick); 

      StartLoading();
}

function StartLoading()
{
      lastState = state;
      state = loadingState;
      //Loading Progression text
      progressText = new createjs.Text("", "20px Arial", "#FFFFFF")
      progressText.x = 300 - progressText.getMeasuredWidth() / 2;
      progressText.y = 20;
      stage.addChild(progressText);
      stage.update();
      //Loading Manifest
      manifest = [
                        {src:"/public/images/SpaceBackground.png", id:"background"},
                        {src:"/public/images/Ship.png", id:"ship"},
                        {src:"/public/images/Ship.png", id:"allyShip"},
                        {src:"/public/images/Enemy.png", id:"enemy"},
                        {src:"/public/images/ShootGradius.png", id:"shot"},

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
      console.log("A file has loaded of type: " + event.item.type);
      if(event.item.id == "background"){
            background = new createjs.Bitmap(event.result);
      }
      if(event.item.id == "ship"){
            ship = new createjs.Bitmap(event.result);
      }
      if(event.item.id == "allyShip"){
            allyShip = new createjs.Bitmap(event.result);
      }
      if(event.item.id == "enemy"){
            enemy = new createjs.Bitmap(event.result);
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
     console.log("Finished Loading Assets");
     //stage.addChild(background);
     lastState = state;
     state = waitAnotherState;
     InitWaitState();
     
     startServerListen(); 
}



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Server listening relative code
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function startServerListen()
{
      //Socket init
      socket = io.connect('http://localhost:8099');
      
      //Socket Server Listener
      socket.on("message",function(data){
            serverMessageParser(data);
      });
      socket.emit('ack',login+","+xp);
}

function serverMessageParser(data)
{
      var splittedData = data.split(',');
      switch(splittedData[0])
      {
            case 'I':
                  console.log('I message recieved');
                  initOwnShipPosition(splittedData);
            break;
            case 'C':
                  console.log('C message recieved');
                  initOtherShipPosition(splittedData);
            break;
            case 'K':
                  alert('You have been kicked by the server');
            break;
            case 'G':
                  waintingForAnotherPlayer = false;
                  lastState = state;
                  state = gameState;
                  InitGameState();
            break;
      }
}

function initOwnShipPosition(coord)
{
      ship.x = coord[2];
      ship.y = coord[3];
      stage.addChild(ship);  
      console.log("move own ship to position: "+coord[1]+","+coord[2]);
}

function initOtherShipPosition(coord)
{
      allyShip.x = coord[2];
      allyShip.y = coord[3];
      stage.addChild(allyShip);
      console.log("move ally ship to position: "+coord[2]+","+coord[3]);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Init Functions
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function InitWaitState()
{
      progressText.text = "Wainting For another Player to join";
      var circleSize = 100;
      var elemSize = 30;
      var elemNum = 10;
      var stageCenterX = stage.canvas.width / 2;
      var stageCenterY = stage.canvas.height / 2;
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
function InitGameState()
{
      stage.removeChild(WaitWheel);
      stage.removeChild(progressText);
}
function InitShareState()
{

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

function shareStateUpdate()
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
        case 65:  // A
            ship.x -= xSpeed;
            break;
        case KEYCODE_RIGHT:
        case 68:  // D
            ship.x += xSpeed;
            break;
    }
}

function handleKeyUp(e)
{
      
}