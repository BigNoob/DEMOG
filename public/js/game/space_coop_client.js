////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Varibles declaration
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var frame_time = 100/1000;
var stage;

var preloader;
var manifest;
var totalLoaded = 0;

var ship;
var allyShip;
var background;
var enemy;
var shot;

var progressText ;
//Game Variables
var score;	
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Game Core Constructor
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var game_core = function(viewport)
{
		this.viewport = viewport;
		this.world = 
		{
            width : 800,
            height : 600
        };
       	stage = new createjs.Stage(viewport);
};

game_core.prototype.init = function()
{
	console.log("init of the game core client");

	this.StartLoading();
};

game_core.prototype.StartLoading = function()
{

      progressText = new createjs.Text("", "20px Arial", "#FFFFFF")
      progressText.y = 20;
      progressText.x = this.world.width - progressText.getMeasuredWidth() / 2; 

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
      preloader.on("progress",this.handleProgress);
      preloader.on("complete" , this.handleComplete);
      preloader.on("fileload" , this.handleFileLoad);
      preloader.on("error", this.loadError);
      preloader.loadManifest(manifest);
};
game_core.prototype.handleFileLoad = function (event)
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
game_core.prototype.loadError = function  (event)
{
      console.log("PRELOAD ERROR : "+evt.text);
}
game_core.prototype.handleProgress = function  (event)
{
     progressText.text = (preloader.progress*100|0) + " % Loaded";
     stage.update(); 
}
game_core.prototype.handleComplete = function  (event)
{
     console.log("Finished Loading Assets");
}

game_core.prototype.update = function(t) {
    
        //Work out the delta time
    this.dt = this.lastframetime ? ( (t - this.lastframetime)/1000.0).fixed() : 0.016;

        //Store the last frame time
    this.lastframetime = t;

}; //game_core.update