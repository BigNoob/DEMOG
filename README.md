DEMOG
=====

Dictator Experiment through Multiplayer Online Games

What is Dictator Game?
http://en.wikipedia.org/wiki/Dictator_game


1) INSTALLATION:
===================================================================================================================
	1) Download Node.js at http://nodejs.org/
	2) Install Node.js
	3) Clone this repository (if not done yet)
	4) Execute "npm install" to install the modules


2) HOW DOES IT WORK:
===================================================================================================================
	The server contains a current experiment which is the only active experiment. This experiment can be tweaked from
	the administration page.

	The most important options are the number of repetitions and the ype of game.
	For now only the space coop works totally (some problems with the trajectories of the game rabbits avoid us to publish it)

	An experiment must be running before clients connects to the server and play (by default an experiment is created and 
	launched)


3) USE:
===================================================================================================================
	1) Execute "node app.js" (in terminal or cmd for windows users)
	2) *IN LOCAL: type "http://localhost:8099/admin" to access the administration page
	                    "http://localhost:8099/game" to access the game page
	   *ON A SERVER: "url of the server/admin" or "url of the server/game"
