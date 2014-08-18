
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Entry Point (Function called by the HTML canvas element)
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function Main(xp_type) {
  console.log(xp_type);
  if(xp_type == "space_coop")
  {
    console.log("space");
    Main_Space();
  }
  else
  {
    console.log("rabbits");
    Main_Rabbits();
    //console.log("space");
    //Main_Space();
  }    
}

/*
    <script src="/public/js/game/main_space_client.js"></script>
    <script src="/public/js/game/main_rabbits_client.js"></script>
*/

