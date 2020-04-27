//=========
//"IMPORTS"
//=========
var express = require("express");
var request = require("request");
var utils = require("./utils.js");



//==============================
//Instantiate express app object
//==============================
var app = express();



//====================
//APPLICATION SETTINGS
//====================
var port = process.env.PORT || 5000;

//This is for allowing cross-domain requests. all() will allow the settings, which
//constitutes the middleware, in the function body to apply for all routes.
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
  var uri = "http://www.sherdog.com/stats/fightFinder?SearchTxt=";
  var name = req.params.fighter.split("_"); //user types in "_" in between names in the URL
  var first_name = name[0]; //Watch out, some fighters might have middle names too...
  var last_name = name[1];
  uri += first_name + "+" + last_name;


  console.log("Hi my name is " + first_name + " " + last_name); //FOR TESTING
  request({ uri: uri }, function(error, response, body) {
    if (!error) {
      fighter = utils.parseSearchResults(body, first_name, last_name);
      utils.getFighterData(fighter, res); //The server's response (res) will be prepared n the getFighterData function
    }
    else {
      //have res send back an error message or something
    }
  });
});


//==============
//RUN THE SERVER
//==============
app.listen(port, '0.0.0.0'); //Don't forget to pass in port!
console.log("Listening on port " + port + "...(hope you're using Nodemon!!)");
module.exports = app;

/*
app.listen(3000, '0.0.0.0', function() {
    console.log('Listening to port:  ' + 3000);
});
*/
