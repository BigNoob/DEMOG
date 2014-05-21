////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//		This Class Listen to the server messages
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function ServerListener(data)
{

}

function.prototype.ParseMessage = function(data)
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
};

function.prototype.ParseMessage =function initOwnShipPosition(coord)
{
      ship.x = coord[2];
      ship.y = coord[3];
      stage.addChild(ship);  
      console.log("move own ship to position: "+coord[1]+","+coord[2]);
};

function.prototype.ParseMessage =function initOtherShipPosition(coord)
{
      allyShip.x = coord[2];
      allyShip.y = coord[3];
      stage.addChild(allyShip);
      console.log("move ally ship to position: "+coord[2]+","+coord[3]);
};