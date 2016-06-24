//=========
//"IMPORTS"
//=========
var cheerio = require("cheerio");
var request = require("request");


//===================
//FUNCTIONS TO EXPORT
//===================
/*
  Parses the html of a sherdog fight fighter search results page and
  returns an object representing the first result in the fighter results page.
  @param html The html content of a Sherdog fighter search results page.
  @return an object containing the first result of the search (if any).
*/
function parseSearchResults(html, firstName, lastName) {
  
  var result = { };
  var $ = cheerio.load(html);
  
  var targElement = $(`a[href^='/fighter/${titleCase(firstName)}-${titleCase(lastName)}']`); //using the "starts with" selector  
  var siblingsList = targElement.parent().siblings(); //offsets 2, 3, and 4 have the stats you're looking for
  var heightOffset = 2; var weightOffset = 3; var assocOffset = 4;
  
  result["name"] = titleCase(firstName) + " " + titleCase(lastName);
  result["height"] = $(siblingsList[heightOffset]).text();
  result["weight"] = $(siblingsList[weightOffset]).text();
  result["association"] = $(siblingsList[assocOffset]).text(); 
  result["url"] = "http://www.sherdog.com/" + targElement.attr("href"); //targElement.attr("href") will be undefined if there are no results!
    
  return result;
    
}


/*
  Gets the data (e.g., stats, record, fight history) for a particular fighter.
  @param fighterObj An object representing a Sherdog fight finder result.
  @param res An object representing the HTTP response to be sent back to the client.
*/
function getFighterData(fighterObj, res) {
  //Should you leave checking if searcg results exist for here or for the code that calls this function?
  
  request({ uri: fighterObj.url }, function(error, response, body) {
    
      var fighterData = parseFighterPage(body);    
      res.json(fighterData);
  });
  
}


/*
  Parses the html of a fight fighter page and returns an object containing 
  the fighter's stats, record, and fight history.
  @param html The html of a fighter's stats page
  @return an object containing a fighter's stats, record, and fight history.
*/
function parseFighterPage(html) {
  
  var $ = cheerio.load(html);
  var fighter = {};
  parseStats(fighter, $);
  parseRecord(fighter, $);
  parseFightHistory(fighter, $);
  
  return fighter;
}



//================
//HELPER FUNCTIONS
//================
/*
  Capitalizes the first letter in a word.
  @param s The word
  @return A new string with the first letter capitalized
*/
function titleCase(s) { 
  return s.charAt(0).toUpperCase() + s.slice(1); 
}


/*
  Takes a string indicating either height or weight and returns an object containing customary and
  metric units for either height or weight.
  @param heightOrWeight a string with value "height" or "weight".
  @param $ The loaded DOM courtesy of cheerio.
  @return An object containing height or weight data in customary or metric units.
*/
function heightOrWeightParser(heightOrWeight, $) {
  var result = {};
  result["customary"] = $(".item."+heightOrWeight).children("strong").text(); //non-metric
  var metricInfo = ($(".item."+heightOrWeight).contents().filter(function() { return this.nodeType === 3; }).text())
  result["metric"] = metricInfo.slice(metricInfo.indexOf(titleCase(heightOrWeight))+titleCase(heightOrWeight).length).trim(); //metric
  return result;
}


/*
  Populates an object representing a fighter's data with properties for his/her stats (e.g., height, weight, age) by parsing
  the fighter's Sherdog page.
  @param fighter An object representing a fighter's info
  @param $ The loaded DOM courtesy of cheerio.
*/
function parseStats(fighter, $) {  
  
  //TODO: Extract the nickname (if any)
  
  console.log("BIRTHDAY:");
  fighter["birthday"] = $("span.birthday").children("span[itemprop='birthDate']").text();
  console.log(fighter["birthday"]);
  
  console.log("AGE:");
  var ageInfo = $("span.birthday").children("strong").text();
  fighter["age"] = ageInfo.slice(ageInfo.indexOf(" ")+1);
  console.log(fighter["age"]);
  
  console.log("NATIONALITY:");
  fighter["nationality"] = $("strong[itemprop='nationality']").text()
  console.log(fighter["nationality"]);
  
  heightData = heightOrWeightParser("height", $);
  console.log("HEIGHT (FEET):");
  fighter["height(ft)"] = heightData["customary"]
  console.log(fighter["height(ft)"]);
  
  console.log("HEIGHT (CM):");
  fighter["height(cm)"] = heightData["metric"]
  console.log(fighter["height(cm)"]);
  
  weightData = heightOrWeightParser("weight", $);
  console.log("WEIGHT (LBS):");
  fighter["weight(lbs)"] = weightData["customary"];
  console.log(fighter["weight(lbs)"]);
  
  console.log("WEIGHT (KGS):");
  fighter["weight(kgs)"] = weightData["metric"]; 
  console.log(fighter["weight(kgs)"]);

  console.log("ASSOCIATION:");
  fighter["association"] = $("span[itemprop='memberOf']").text();
  console.log(fighter["association"]);
  
  console.log("WEIGHT CLASS:");
  fighter["weightClass"] = $("h6.wclass").children("strong.title").text(); 
  //Could have just said $("strong.title") but wanted to be more descriptive
  console.log(fighter["weightClass"]);
}


/*
  Populates an object representing a fighter's data with properties for his/her win/loss/nc/draw record by parsing
  the fighter's Sherdog page.
  @param fighter An object representing a fighter's info
  @param $ The loaded DOM courtesy of cheerio.
*/
function parseRecord(fighter, $) {
  
  console.log("WINS:"); //There's always a slot for wins
  var winElement = $("span:contains('Wins').result"); //Seems that if you want to combine selection conditions, just write them all together...
  fighter["winCount"] = winElement.siblings(".counter").text();
  console.log(fighter["winCount"]);
  
  //console.log("WITHOUT DOLLAR === WITH DOLLAR: ");
  //console.log(winElement.siblings() === $(winElement.siblings()));
  
  console.log("LOSSES:"); //There's always a slot for losses
  var lossElement = $("span:contains('Losses').result");
  fighter["lossCount"] = lossElement.siblings(".counter").text();
  console.log(fighter["lossCount"]);
  
  console.log("NO CONTESTS:"); //There's not always a slot for no contests
  var noContestElement = $("span:contains('N/C').result"); //if none, object will still be returned but w/o a property for a matched element
  fighter["ncCount"] = noContestElement.siblings(".counter").text(); //If fighter has none of these, then numNoContests is the empty string
  console.log(fighter["ncCount"]); 
  
  console.log("DRAWS:"); //There's not always a slot for draws
  var drawElement = $("span:contains('Draws').result"); //if none, object will still be returned but w/o a property for a matched element
  fighter["drawCount"] = drawElement.siblings(".counter").text(); //If fighter has none of these, then numDraws is the empty string
  console.log(fighter["drawCount"]); 
}


/*
  Populates an object representing a fighter's data with properties for his/her fight history by parsing
  the fighter's Sherdog page.
  @param fighter An object representing a fighter's info
  @param $ The loaded DOM courtesy of cheerio.
*/
function parseFightHistory(fighter, $) {
  
  //TODO: Fix the weird stuff that happens when the fighter has an upcoming fight!!!
  
  var resultsTable = $(".fight_history").children(".content").children("table");
  fighter["fightHistory"] = [];
  resultsTable.children().each(function() {
    //Let's create an object for each fight result
    if ($(this).attr("class") != "table_head") { //"this" is essentially each row of the results table.
      var fightInfo = {};      
      var properties = ["result", "opponent", "event", "date", "method", "referee", "round", "time"];
      var propIdx = 0;
      
      $(this).children().each(function() {
        //result, opponent, event/date (crap, these two go together), method/ref (crap, these two go together), round, time
        var curData = $(this);  //the current "data" is sort of like the current column.
        
        var subline = $(curData).find(".sub_line");
        if (subline.length != 0) {
          
          //In here you need to increment propIdx twice because of how the element that contains the class sub_line
          //has text content in two different parts of it.
          fightInfo[properties[propIdx]] = curData.text().slice(0, curData.text().indexOf(subline.text()));
          propIdx++;
          
          fightInfo[properties[propIdx]] = subline.text();
          propIdx++;

        }
        else {          
          fightInfo[properties[propIdx]] = curData.text();
          propIdx++;
        }
      });            
      fighter["fightHistory"].push(fightInfo);
    }
  });

  console.log("FIGHT HISTORY: "); //FOR TESTING
  console.log(fighter["fightHistory"]); //FOR TESTING
}



//================
//EXPORT THE GOODS
//================
module.exports = {
  parseSearchResults: parseSearchResults,
  parseFighterPage: parseFighterPage,
  getFighterData: getFighterData
};