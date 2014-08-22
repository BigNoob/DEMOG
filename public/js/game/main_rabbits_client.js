////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Varibles declaration
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
var isXPRunning = false;
var xpType;
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
var state_wait = 'STATE_WAIT';
var state_lobby = 'STATE_LOBBY';
var state_noxp = 'STATE_NOXP';
var state_xpEnd = 'STATE_ENDXP';
var state_login = 'STATE_LOGIN';
var state_reload = 'STATE_RELOAD';
var state_fall = 'STATE_FALL';

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

//Strings Array
var stringsArray = [];
var score_value = 0;

//IO Socket
var socket;

//Views
var launcherSpriteSheet;
var launcher;
var flyerSpriteSheet;
var flyer;
var arrow;

var background;
var enemy;
var mothership;
var mothershipEndBitmap;

var progressText ;
var score;

var maxAmmount;
var minAmmount;
var givenAmmount;
var slider;
//Game Variables

var ownNumber;
var launcherNumber;

var share = 0;
var canfire = true;
var cooldown = 20;
var reloadTime = 2000;
var isFlyer;


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
var enemiesX_spacing = 60;
var enemiesY_spacing = 60;
var lines = 3;
var number = 10;


//Constants
var KEYCODE_LEFT = 37;
var KEYCODE_RIGHT = 39;
var KEYCODE_SPACE = 32;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Entry Point of Rabbits Coop (Function called by main.jst)
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function Main_Rabbits(type) {
  xpType = type;
  canvas = document.getElementById("viewport");
  stage = new createjs.Stage(canvas);

  stagewidth = stage.canvas.width;
  stageheight = stage.canvas.height;

  //Game Loop Listener
  createjs.Ticker.setFPS(60);
  createjs.Ticker.on("tick", tick); 
  window.addEventListener('keydown', function(event) { handleKeyDown(event); }, false);
  canvas.addEventListener('mousedown',function(event) {handleClick(event); }, false);

  StartLoading();
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//   Loading Functions
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function StartLoading()
{
  state = state_load;
  LoadStrings();

  background = new createjs.Bitmap("/public/images/RabbitBackground.png");
  stage.addChild(background);
  stage.update();

  progressText = new createjs.Text("", "20px Arial", "#FFFFFF");
  progressText.textAlign = "center";
  progressText.y = 20;
  progressText.x = 400 ;

  score = new createjs.Text("Score : 0","10px Arial","#FFFFFF");

  maxAmmount= new createjs.Text("", "20px Arial", "#FFFFFF");
  minAmmount= new createjs.Text("", "20px Arial", "#FFFFFF");
  givenAmmount= new createjs.Text("", "20px Arial", "#FFFFFF");

  stage.addChild(progressText);
  stage.update();
  //Loading Manifest
  manifest = [
                {src:"/public/images/RabbitBackground.png", id:"background"},
                {src:"/public/images/RedBalloon.png", id:"balloon"},
                {src:"/public/images/GoalBalloon.png", id:"goal"},
                {src:"/public/images/BalloonCatched.png,",id:"catched"},
                {src:"/public/images/Arrow.png", id:"arrowBMP"},
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

function LoadStrings()
{
  var XMLStrings;
  var XMLNode;
  if(window.XMLHttpRequest)
  {
    var xmlhttp = new XMLHttpRequest();
  }
  else
  {
    var xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");    
  }
  xmlhttp.open("GET","/public/localization/lang.xml",false);
  xmlhttp.send();
  
  XMLStrings= xmlhttp.responseXML;

  XMLNode = XMLStrings.getElementsByTagName(language)

  for(var i = 0; i < XMLNode[0].children.length ; i++)
  {
    stringsArray.push(XMLNode[0].children[i].innerHTML)
  }
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
  if(event.item.id == "goal"){
        mothership = new createjs.Bitmap(event.result);
  }
  if(event.item.id == "arrowBMP"){
        arrow = new createjs.Bitmap(event.result);
  }
  if(event.item.id == "catched"){
    mothershipEndBitmap = new createjs.Bitmap(event.result);
  }
  if(event.item.id == "balloon"){
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
}
function loadError (event)
{
  console.log("PRELOAD ERROR : "+event.text);
}
function handleProgress (event)
{
 progressText.text = (preloader.progress*100|0) + " % Loaded";
 stage.update(); 
}
function handleComplete (event)
{
  launcherSpriteSheet = new createjs.SpriteSheet(
    {
    images: ["/public/images/LauncherSheet.png"],
    frames: {width:96, height:53},
    }
  );

  flyerSpriteSheet = new createjs.SpriteSheet(
    {
    images: ["/public/images/FlyerSheet.png"],
    frames: {width:40, height:46},
    }
  );
  launcher = new createjs.Sprite(launcherSpriteSheet);
  flyer = new createjs.Sprite(flyerSpriteSheet);
  startServerListen();  //We start listening to the server after the loading of all the assets
  InitLobbyState(undefined); 
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
  if(xpType == "amazon")
  {
    loginPrompt  = prompt(stringsArray[str_loginPrompt]);
    if(loginPrompt != null)
    {
      socket.emit('playerLogin',loginPrompt);
    }
  }
  //Socket Server Listener
  socket.on("message",function(data){
      serverMessageParser(data);
  });   

}

function serverMessageParser(data)
{
      var splittedData = data.split(',');
      switch (splittedData[0])
      {
        case 'UPDATE':
          updateScreen(splittedData);
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
          ClearShareState();
          ClearWaitState();
          DrawGivenAmmount(splittedData[1],splittedData[2]);
        break;
        case 'GAME_START':
        console.log("gamestart");
          isXPRunning = true;
          //ClearGameState();
          ClearLobbyState();
          InitGameState();
        break;
        case 'LOBBY':
          //ClearLobbyState();
          ClearGameState();
          InitLobbyState(splittedData);
        break;
        case 'NO_XP':
          isXPRunning = false;
          ClearGameState();
          //ClearLobbyState();
          InitNoXP();
        break;
        case 'SHARE_STATE':
          ClearGameState();
          //ClearLobbyState();
          InitShareState();
        break;
        case 'SHARE_WAIT':
          ClearGameState();
          ClearLobbyState();
          InitShareWait();
        break;
        case 'ANIM_STATE':
          ClearFlyer();
          state=state_endAnim;
        break;
        case 'STATE_RELOAD':
          setTimeout(function(){
            if(ownNumber != launcherNumber)
            {
              socket.emit('message',"STATE_GAME");
              state = state_game;
            }
          },2000);
        break;
        case 'REDIRECT':
 
          window.location.replace('/end');
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
  progressText.text = stringsArray[str_gameTuto]; 
  progressText.y = 20;
  progressText.x = 400 ;
  progressText.textAlign = "center";

  launcher.x = 400;
  launcher.y = 550;
  launcher.alpha = 1.0;

  flyer.x = 380;
  flyer.y = 350;

  EnemiesCont.x = 100;
  EnemiesCont.y = 150;

  mothership.x = 100;
  mothership.y = 20;

  stage.addChild(progressText);
  stage.addChild(launcher);
  stage.addChild(flyer);
  stage.addChild(mothership);
  stage.addChild(score);
  stage.addChild(EnemiesCont);

  state = state_game;  
}

function InitLobbyState(data)
{
  if(data == undefined)
  {
    var score = 0;
  }
  else
  {
    var score = data[1].player.score;   
  }
  if(score == 0)
  {
    progressText.text = stringsArray[str_lobby];
  }
  else
  {
    progressText.text = stringsArray[str_lobby]+'\n You have '+score+' points';
  }
  progressText.y = 20;
  progressText.x = 400 ;
  progressText.textAlign = "center";

  var circleSize = 80;
  var elemSize = 20;
  var elemNum = 8;
  var stageCenterX = stagewidth / 2;
  var stageCenterY = stageheight / 2;
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
  WaitWheel.x = stageCenterX - circleSize/2;
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
  },60);
  state = state_lobby;  
}

function InitNoXP()
{
  progressText.text =  stringsArray[str_noxp];  
  progressText.y = 20;
  progressText.x = 400 ;
  progressText.textAlign = "center";

  stage.addChild(progressText);
  stage.update();
  state = state_noxp;  
}

function InitShareState()
{
  progressText.text = stringsArray[str_doShare]; 
  progressText.y = 20;
  progressText.x = 400 ;
  progressText.textAlign = "center";

  maxAmmount.x = 700;
  maxAmmount.y = 400;
  maxAmmount.width = 100;
  maxAmmount.text = score_value;

  minAmmount.x = 100;
  minAmmount.y = 400;
  minAmmount.width = 100;
  minAmmount.text = "0";
  minAmmount.textAlign = "right";

  givenAmmount.x = 350;
  givenAmmount.y = 350;
  givenAmmount.width = 100;
  givenAmmount.text = ""

  slider = new createjs.Shape();
  slider.graphics.beginFill("white").drawRect(100,400,600,20);
  launcher.x = 100;
  launcher.y = 390;
  launcher.alpha = 0.0;

  arrow.x=100;
  arrow.y = 400;
  arrow.alpha = 0.0;

  stage.addChild(slider);

  stage.addChild(launcher);
  stage.addChild(maxAmmount);
  stage.addChild(minAmmount);
  stage.addChild(givenAmmount);
  stage.addChild(progressText);
  stage.addChild(arrow);
  stage.update();
  state = state_share;  
}

function InitShareWait()
{
  progressText.text = stringsArray[str_waitShare];  
  progressText.y = 20;
  progressText.x = 400 ;
  progressText.textAlign = "center";

  stage.addChild(progressText);
  stage.update();
  state = state_wait; 
}

function DrawGivenAmmount(data, role)
{
  var recieved = 3000 - parseInt(data);
  if(role == "RECIEVER")
  { 
    alert("The other player shared the loot and gave you "+recieved+" points. Click to continue to the next game." );
    socket.emit("message",'ENDED'); 
  }
  else if(role == "SHARER")
  {
    
    alert("You have given "+recieved+" points out of 3000 to the other player.\n Your points for this game are thus "+data+".\n Click to continue to the next game." );
    socket.emit("message",'ENDED');
  }
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Clear State Functions
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function ClearGameState()
{
  stage.removeChild(progressText);
  stage.removeChild(launcher);
  stage.removeChild(EnemiesCont);
  stage.removeChild(mothership);
  stage.removeChild(score);
  stage.removeChild(flyer);
  //stage.removeChild(mothershipEndBitmap);
  for(var i = 0 ; i < EnemiesCont.getNumChildren() ; i++)
  {
    EnemiesCont.getChildAt(i).alpha = 1;
  }
  stage.update();
}

function ClearLobbyState()
{
  stage.removeChild(progressText);
  stage.removeChild(WaitWheel);
  stage.update();
}
function ClearShareState()
{
  stage.removeChild(slider);
  stage.removeChild(launcher);
  stage.removeChild(maxAmmount);
  stage.removeChild(minAmmount);
  stage.removeChild(givenAmmount);
  stage.removeChild(progressText);
  stage.removeChild(arrow);
}
function ClearWaitState()
{
  stage.removeChild(progressText);
}
function ClearFlyer()
{
  //stage.addChild(mothershipEndBitmap);
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Screen Default Update
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function tick(event) {
  stage.update(event);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Input Callbacks
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function handleKeyDown(e)
{
  if(state == state_game || state == state_reload || state == state_fall)
  {
    switch (e.keyCode) {
      case KEYCODE_LEFT:
        sendInputs(1,0,0);
        break;

      case KEYCODE_RIGHT:
        sendInputs(0,1,0);
        break;
    }
  }
  else if (state == state_share)
  {
    switch (e.keyCode) {

      case KEYCODE_SPACE:
        if(share)
        {
          console.log("sended");
          SendShareAmmount();
        }
      break;

    }
  }
}

function handleClick(e)
{
  if(state == state_share)
  {
    var mousePos = getMousePos(canvas,e);
    sendMouseInput(mousePos.x);
    UpdateShareAmmount(mousePos.x);
  } 
}
function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}
function UpdateShareAmmount(x)
{
  var X = x;
  if(X < 100){X = 100;}
  if(X > 700-18){X = 700;}
  arrow.x = X - 9 ;
  share = parseInt(score_value * (X -100)/(600));
  console.log(share);
  maxAmmount.text = score_value;
  minAmmount.text = 0;
  givenAmmount.text = share;
}

function SendShareAmmount()
{
  socket.emit("message",'SHARE,'+ share);
}

function sendInputs(left,right,shoot)
{
  if(isXPRunning && ownNumber == launcherNumber)
  {
    socket.emit("message",'INPUT,'+left+','+right+','+shoot);
  }
}

function sendMouseInput(x)
{
  var X = x;
  if(X < 100){X = 100;}
  if(X > 700-96){X = 700-96;}
  socket.emit("message",'MOUSE_INPUT,'+ X);
  UpdateShareAmmount();
  if(arrow.alpha == 0.0)
  {
    arrow.alpha = 1.0;
  }
  /*
  if(launcher.alpha == 0.0)
  {
    launcher.alpha = 1.0;
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
//      Element 1 = launcherRabbit x
//      Element 2 = Flyrabbit x & y
//      Element 3 = launcherString
//      Element 4 = baloons pack x
//      Element 5 = goalString
//      Element 6 = scoreString
//      
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function updateScreen(data)
{
  //console.log(data);
  drawLauncher(data[1]);
  if(state != state_endAnim)
  {
    drawFlyer(data[2]);
  }
  launcherNumber = parseInt(data[3]);
  if(launcherNumber == 1)
  {
    launcher.gotoAndStop(0);
    flyer.gotoAndStop(1);
    launcherNumber = 1;
  }
  else
  {
    launcher.gotoAndStop(1);
    flyer.gotoAndStop(0);
    launcherNumber = 2;
  }
  drawEnemies(data[4]);
  drawMothership(data[5]);
  drawScore(data[6]);
  ownNumber = parseInt(data[7]);
  //console.log(ownNumber +'/'+launcherNumber);
}

function drawLauncher(data)
{
  launcher.x = data;
}

function drawFlyer(data)
{
  var splittedData = data.split('#');
  if(splittedData[0]==NaN || splittedData[1]==NaN)
  {
    //flyer.x = 400;
    //flyer.y = 400;
  }
  else
  {
    flyer.x = splittedData[0];
    flyer.y = splittedData[1];
  }
  
  stage.update();
}

function drawEnemies(data)
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

function drawMothership(data)
{
  var splittedData = data.split('#');
  mothership.x = splittedData[0];
  mothership.y = splittedData[1];

  if(state == state_endAnim)
  {
    console.log(flyer.x+';'+flyer.y);
    flyer.x = splittedData[0];
    flyer.y = parseInt(splittedData[1]) + 56;
  }
}

function drawScore(data)
{
  if(state == state_game)
  {
    score.text =stringsArray[str_score] + data;
    score_value = data;
    stage.update();
  }
}