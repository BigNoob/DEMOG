////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Varibles declaration
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var canvas;
var stage;

//Ticker
var tkr = new Object;

//IO Socket
var socket ;

//Views
var ship;
var allyShip;
var circle;
var background;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Entry Point (Function called by the HTML canvas element)
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function init(login,xp) {
      console.log(login+" , "+xp); 
      canvas = document.getElementById("demoCanvas");
      stage = new createjs.Stage(canvas);
      socket = io.connect('http://localhost:8099');
      socket.emit('ack',login+","+xp);

      ship = new createjs.Bitmap("/public/images/Ship.png");
      allyShip = new createjs.Bitmap("/public/images/Ship.png");
      
 
      socket.on("message",function(data){
            serverMessageParser(data);
      });

      createjs.Ticker.on("tick", tick); 
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Server listening relative code
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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

function sendShipPosition(coord)
{
      coord.unshift('UM');
      serverMessageSender(coord);
}

function serverMessageSender(data)
{
      var tmpString;
      for(var i = 0; i < data.length; i++)
      {
            tmpString += data[i]+",";
      }
      socket.emit('message',tmpString);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Game Loop
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function tick(event) {
      stage.update(event);
      //console.log("ticked");
      //sendShipPosition({ship.x,ship.y});
}