//=========
//"IMPORTS"
//=========
var express = require("express");
var http = require("http");  //for making requests to other servers
var request = require("request");
var fightFinder = require("./fightFinder.js");



//==============================
//Instantiate express app object
//==============================
var app = express();



//====================
//APPLICATION SETTINGS
//====================
var port = process.env.PORT || 3000;

//This is for allowing cross-domain requests
app.all('*', function(req, res, next) {  
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next(); //next() for the next piece of middleware to fire
});



//==========================
//ESTABLISH ENDPOINTS/ROUTES
//==========================
app.get("/", function(req, res) {    
  
  /*
  //Testing a request within a request:
  request({uri: "http://www.example.com"}, function(error, response, body) {
    
    console.log("FIRST BODY (example.com): " + body);
    
    request( { uri: "http://www.google.com"}, function(error, response, body) {
      
     console.log("SECOND BODY (google.com): " + body); 
      
    });
  });
  */
  
});


app.get("/data/:fighter", function(req, res) {
  var uri = "http://www.sherdog.com/stats/fightfinder?SearchTxt=";
  var name = req.params.fighter.split("_");
  var first_name = name[0];
  var last_name = name[1];
  uri += first_name + "+" + last_name;
  
  console.log("Hi my name is " + first_name + " " + last_name); //FOR TESTING  
  request({ uri: uri }, function(error, response, body) {
    if (!error) {          
      fighter = fightFinder.parseSearchResults(body, first_name, last_name);
      fightFinder.getFighterData(fighter, res);
    }
    else {
      //have res send back an error message or something
    }
  });
});



//==============
//RUN THE SERVER
//==============
app.listen(port); //Don't forget to pass in port!
console.log("LISTENING on port " + port);