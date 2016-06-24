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
  //. Take the fighter's name and put it in a query string for a GET request to sherdog's fight finder.  
  
  //-----Code for making a request to another server using the request module:-----
  //var htmlContent = "";
  //Seems that request() is an asynchronous function
  request({ uri: uri }, function(error, response, body) {
    
    if (!error) {    
      
      //The idea here is to parse the HTML of the results page, get an object representing the first fight finder result,
      //make another HTTP request to get to that fighter's page, and then parse the fighter page...perhaps making the HTTP
      //request and parsing the fighter page should be separate somehow...
      
      //!!!!! START PARSING THE HTML HERE !!!!
      //. Parse the HTML content. Have the function that parses the HTML content ultimately return
      //   a javascript object. This javascript object could then be passed back as JSON formatted data
      //   with res.json(the_object). Btw, I think you should have the JSON contain a property whose value
      //   is an array that holds all of the results of the fight finder search. Be sure to include the link
      //   to the fighter's page for each object representing a search result?
      //console.log("OUTER request()");
      fighter = fightFinder.parseSearchResults(body, first_name, last_name);
      
      //res.json(fighter); //FOR TESTING
      
      //. OH SNAP. Be sure that you aren't calling res.json() after this call to getFighterStats(). Due to
      //   the asynchronous activity that will occur in getFighterStats(), res.json() could end up not send-
      //   ing back the the appropriate value if you called it outside of getFighterStats(). It's best to 
      //   pass res to getFighterStats() and then call res.json() in there.
      
      fightFinder.getFighterData(fighter, res);
    }
    else {
      //have res send back an error message or something
    }
  });
  
  
  /*
  //-----Code for making a request to another server using the http module:-----
  var pathName = "/stats/fightfinder?SearchTxt=";
  pathName += first_name+"+"+last_name;
  var options = {
    host: "www.sherdog.com", //NO NEED to prefix with http:// since that technically isn't part of the host name!!
    method: "GET",
    path: pathName
  };
  
  var htmlContent = "";
  
  //. We're using http.request() to make an HTTP request. This is an asynchronous function. http.request() returns an 
  //  instance of the http.ClientRequest class. The ClientRequest instance is a writable stream.
  //. The first argument, options, is an object with items specifying certain settings.
  //. After making the HTTP request, the function provided as the second argument will run. This
  //  function contains the response of the HTTP request.
  //. Note that http.get() is built on top of this function. http.get() will automatically set the HTTP method to GET and
  //  will automatically call end() on the request.
  var req = http.request(options, function(resp) {
    
    console.log("resp.status: " + resp.statusCode);
    //console.log("resp.headers: " +  JSON.stringify(resp.headers)); 
    //^stringify() converts a javascript value (e.g., an object) to a JSON string. Can be used with console.log() to see
    //a more informative string representation of an object with the curly braces and key-value pairs rather than just [object Object].
    
    //. The first argument indicates an event. The "data" event occurs when a piece of the HTTP response body is received.
    //. The second argument is a callback function.
    resp.on("data", function(chunk) { 
      //Note that we don't receive the data from the HTTP response all at once. Rather, we receive
      //the data in chunks (i.e., through a buffer in a stream)
      htmlContent += chunk;
    });
    
    resp.on("error", function(e) {
      console.log("PROBLEMO: " + e.message);
    });
    
    
    
    resp.on("end", function() {
      
      //!!!!! START PARSING THE HTML HERE !!!!
      //parse the HTML content. Have the function that parses the HTML content ultimately return
      //a javascript object. This javascript object could then be passed back as JSON formatted data
      //with res.json(the_object).
      res.send(htmlContent);
      
    });
  });
    
  req.end();
  */
});



//==============
//RUN THE SERVER
//==============
app.listen(port); //Don't forget to pass in port!
console.log("LISTENING on port " + port);