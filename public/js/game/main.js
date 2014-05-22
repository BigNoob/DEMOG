////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Varibles declaration
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
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

//
var waintingForAnotherPlayer = true;
//Client relative variables
var login;
var xp;

//IO Socket
var socket;
var isSyncer = false;
var stopListenSync = false;
//Views
var ship;
var allyShip;
var background;
var enemy;
var shot;

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
function Main(loginQuery,xpQuery) {
      login = loginQuery;
      xp = xpQuery;
      console.log(login+" , "+xp); 

      canvas = document.getElementById("demoCanvas");
      stage = new createjs.Stage(canvas);

      stagewidth = stage.canvas.width;
      stageheight = stage.canvas.height;

      state = firstState;



      background = new createjs.Bitmap("/public/images/SpaceBackground.png");
      stage.addChild(background);
      stage.update();

      //Game Loop Listener
      createjs.Ticker.setFPS(30);
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
      lastState = state;
      state = loadingState;
      //Loading Progression text
      progressText = new createjs.Text("", "20px Arial", "#FFFFFF")
      progressText.y = 20;
      progressText.x = stagewidth - progressText.getMeasuredWidth() / 2; 

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
            case 'UM':
                  moveAllyShip(splittedData);
                  break;
            case 'S':
                  SyncShoot(splittedData);
                  break;
            case 'SYNCER':
                  isSyncer = true;
                  //console.log(isSyncer);
                  break;
            case 'EU':
                  //console.log("Enemies Sync Message :"+data)
                  if(!isSyncer && !stopListenSync){syncEnemies(splittedData);}
                  break;
      }
}

function initOwnShipPosition(coord)
{
      ship.x = coord[2];
      ship.y = coord[3];
      if (state != gameState){stage.addChild(ship); }
}

function initOtherShipPosition(coord)
{
      allyShip.x = coord[2];
      allyShip.y = coord[3];
      stage.addChild(allyShip);
      
}

function moveAllyShip(coord)
{
     allyShip.x = coord[2]; 
}

function syncEnemies(coord)
{
      stopListenSync = true;
      for (var i = 0; i < 4; i++) {
            for (var j = 0; j < 7; j++) {
                  var index = i+j*4;
                  //console.log(index);
                  invaderArray[index].x = parseInt(coord[1]) + (j * 45);
                  invaderArray[index].y = parseInt(coord[2]) + (i * 46);
                  
            }
      }
      console.log("Coord position : "+coord[1]+";"+coord[2]);
      console.log("Invaders"+0+";"+0+" position : "+invaderArray[0+0].x+";"+invaderArray[0+0].y);
      stopListenSync = false;
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
      setupInvaders();
      document.onkeydown = handleKeyDown;
      document.onkeyup = handleKeyUp;
}

function setupInvaders() {
   
    var xPos = 148;
    var yPos = 18;
    for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 7; j++) {
            tempInvader = enemy.clone()
            tempInvader.x = xPos + j * 45;
            tempInvader.y = yPos + i * 46;
            stage.addChild(tempInvader);
            invaderArray.push(tempInvader);
        }
    }
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
      if(isSyncer)
      {
            moveEnemies();
      }


      if(bulletArray.length){
            for(var i=0;i<bulletArray.length;i++){
                  bulletArray[i].y -= 10;
            }
      }
      socket.emit("message",'UM,' + ship.x + ',' + ship.y + ',' + 0 + ',' + 0);
      checkCollisions();
}

function moveEnemies()
{
      for(var i = 0; i < invaderArray.length; i++){
            invaderArray[i].x += invaderSpeed;
        
            if(invaderArray[i].x > rightBounds - invaderWidth || invaderArray[i].x < leftBounds){
                  changeDirection = true;
            }
      }    

      if(changeDirection){
            invaderSpeed *= -1;
            for(var j=0;j < invaderArray.length; j++){
                  invaderArray[j].y += 10;
            }
            changeDirection = false;    
      }
      socket.emit("message",'EU,' + invaderArray[0].x + ',' + invaderArray[0].y); 
}

function shareStateUpdate()
{

}
function InstantiateShoot()
{
      if(canfire){
      var tempBullet = shot.clone();
      tempBullet.y = ship.y;
      tempBullet.x = ship.x;

      socket.emit("message",'S,' + tempBullet.x + ',' + tempBullet.y + ',' + 0 );

      //console.log(tempBullet.x+","+tempBullet.y);
      bulletArray.push(tempBullet);
      stage.addChild(tempBullet);
      canfire = false;

      //createjs.Sound.play("./sound/laser.mp3");
      setTimeout(function(){canfire = true},750);
      }
}
function SyncShoot(coord)
{
      
      var tempBullet = shot.clone();
      tempBullet.x = coord[2];
      tempBullet.y = coord[3];
      bulletArray.push(tempBullet);
      stage.addChild(tempBullet);

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
      switch (e.keyCode) {
        case KEYCODE_SPACE:
            InstantiateShoot();
        break;
      }  
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Helpers Functions
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function checkCollisions(){
       if (bulletArray.length) {
        for (var i = invaderArray.length - 1; i >= 0; i--) {
            for (var j = bulletArray.length - 1; j >= 0; j--) {
                  if(invaderArray[i].alpha != 0)
                  {
                        var collision = ndgmr.checkPixelCollision(invaderArray[i], bulletArray[j],alphaThreshold) ;
                        if(collision){
                              //stage.removeChild(invaderArray[i]);
                              //invaderArray.splice(i, 1);
                              invaderArray[i].alpha = 0;
                              stage.removeChild(bulletArray[j]);
                              bulletArray.splice(j, 1);                    
                  }}
            }
        }
    }
    
    for(var i=0;i<invaderArray.length;i++){
      if(invaderArray[i].alpha != 0)
                  {
         var collision = ndgmr.checkPixelCollision(invaderArray[i], ship,alphaThreshold) ;
         if(collision){
            doGameOver();                    
         }
      }
    }
    
}
function checkWin(){
    if(invaderArray.length == 0){
        doGameOver();
    }
    
}
function doGameOver(){
    createjs.Ticker.removeEventListener("tick", tick);
    var gameOverText = new createjs.Text("Game Over", "50px Arial", "#FFFFFF");
    gameOverText.x = stagewidth/2 - gameOverText.getMeasuredWidth()/2;
    gameOverText.y = stageheight/2 - gameOverText.getMeasuredHeight()/2;
    stage.addChild(gameOverText);
    
}