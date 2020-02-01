//=========
//"IMPORTS"
//=========
var cheerio = require("cheerio");
var request = require("request");



//===================
//FUNCTIONS TO EXPORT
//===================
/*
  Gets the data (i.e., stats, record, fight history) for a particular fighter.
  @param fighterObj An object representing a Sherdog fight finder result.
  @param res An object representing the HTTP response to be sent back to the client.
*/
function getFighterData(fighterObj, res) {
  //Should you leave checking if search results exist for here or for the code that calls this function?
  
  request({ uri: fighterObj.url }, function(error, response, body) {
    
      var fighterData = parseFighterPage(body);    
      res.json(fighterData);
    
  });
  
}


/*
  Parses the html of a sherdog fight fighter search results page and
  returns an object representing the first result in the fighter results page.
  @param html The html content of a Sherdog fighter search results page.
  @return an object containing the first result of the search (if any).
*/
function parseSearchResults(html, firstName, lastName) {
  
  var result = { };
  var $ = cheerio.load(html);
  
  var targElement = $(`a[href^='/fighter/${titleCase(firstName)}-${titleCase(lastName)}']`); //using the "starts with" selector here  
  var siblingsList = targElement.parent().siblings(); //offsets 2, 3, and 4 have the stats you're looking for
  var heightOffset = 2; var weightOffset = 3; var assocOffset = 4;
  
  //Having all these properties aside from URL can be useful if you decide to make a results list of some sort 
  result["name"] = titleCase(firstName) + " " + titleCase(lastName);
  result["height"] = $(siblingsList[heightOffset]).text();
  result["weight"] = $(siblingsList[weightOffset]).text();
  result["association"] = $(siblingsList[assocOffset]).text(); 
  result["url"] = "http://www.sherdog.com/" + targElement.attr("href"); //targElement.attr("href") will be undefined if there are no results!
    
  return result;
    
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
  
  //parseFightHistory(fighter, $); 
  //^Let this happen first so we can get stats directly from the fighter's fight history list rather than the DOM?
  parseBio(fighter, $);
  parseRecord(fighter, $);
  parseFightHistory(fighter, $);
  //Perhaps I should have a fillFightHistoryStats(fighter) function?
  
  return fighter;
  
}



//================
//HELPER FUNCTIONS
//================
/*
  Populates an object representing a fighter's data with properties for his/her bio (e.g., height, weight, age) by parsing
  the fighter's Sherdog page.
  @param fighter An object representing a fighter's info
  @param $ The loaded DOM courtesy of cheerio.
*/
function parseBio(fighter, $) {  
    
  fighter["name"] = $("span.fn").text(); //fn for fighter name. How convenient!
  fighter["nickname"] = $("span.nickname").text();
  fighter["birthday"] = $("span.birthday").children("span[itemprop='birthDate']").text();
  var ageInfo = $("span.birthday").children("strong").text(); //Maybe I can just do the math...
  fighter["age"] = ageInfo.slice(ageInfo.indexOf(" ")+1);
  fighter["nationality"] = $("strong[itemprop='nationality']").text()
  
  heightData = heightOrWeightParser("height", $);
  fighter["height(ft)"] = heightData["customary"]
  fighter["height(cm)"] = heightData["metric"]
  weightData = heightOrWeightParser("weight", $);
  fighter["weight(lbs)"] = weightData["customary"];
  fighter["weight(kgs)"] = weightData["metric"]; 
  
  fighter["association"] = $("span[itemprop='memberOf']").text();
  fighter["weightClass"] = $("h6.wclass").children("strong.title").text(); 
  //Could have just said $("strong.title") but wanted to be more descriptive
}


/*
  Populates an object representing a fighter's data with properties for his/her win/loss/nc/draw record by parsing
  the fighter's Sherdog page.
  @param fighter An object representing a fighter's info
  @param $ The loaded DOM courtesy of cheerio.
*/
function parseRecord(fighter, $) {
  
  var winElement = $("span:contains('Wins').result"); //Seems that if you want to combine selection conditions in $(), just write them all together...
  fighter["wins"] = Number(winElement.siblings(".counter").text());
  var lossElement = $("span:contains('Losses').result");
  fighter["losses"] = Number(lossElement.siblings(".counter").text());
  //Note that there's not always a slot for no contests on the Sherdog fighter page
  var noContestElement = $("span:contains('N/C').result"); //if none, object will still be returned but w/o a property for a matched element
  fighter["ncs"] = Number(noContestElement.siblings(".counter").text()); //If fighter has none of these, then numNoContests is the empty string
  //Note that there's not always a slot for draws on the Sherdog fighter page
  var drawElement = $("span:contains('Draws').result"); //if none, object will still be returned but w/o a property for a matched element
  fighter["draws"] = Number(drawElement.siblings(".counter").text()); //If fighter has none of these, then numDraws is the empty string
  
  //Having these extra DOM traversals could slow things down quite a bit...
  var koTkoOutcomes = parseOutcomeType("KO/TKO", $);
  fighter["koTkoWins"] = getOutcomeWins(koTkoOutcomes);
  fighter["koTkoWinPercent"] = getOutcomeWinPercentage(fighter, "koTko");
  fighter["koTkoLosses"] = getOutcomeLosses(koTkoOutcomes);
  fighter["koTkoLossPercent"] = getOutcomeLossPercentage(fighter, "koTko");
  
  var submissionOutcomes = parseOutcomeType("SUBMISSIONS", $);
  fighter["submissionWins"] = getOutcomeWins(submissionOutcomes); 
  fighter["submissionWinPercent"] = getOutcomeWinPercentage(fighter, "submission");
  fighter["submissionLosses"] = getOutcomeLosses(submissionOutcomes);
  fighter["submissionLossPercent"] = getOutcomeLossPercentage(fighter, "submission");
  
  var decisionOutcomes = parseOutcomeType("DECISIONS", $);
  fighter["decisionWins"] = getOutcomeWins(decisionOutcomes); 
  fighter["decisionWinPercent"] = getOutcomeWinPercentage(fighter, "decision");
  fighter["decisionLosses"] = getOutcomeLosses(decisionOutcomes);
  fighter["decisionLossPercent"] = getOutcomeLossPercentage(fighter, "decision");
  
  var otherOutcomes = parseOutcomeType("OTHER", $);
  fighter["otherWins"] = getOutcomeWins(otherOutcomes);
  fighter["otherWinPercent"] = getOutcomeWinPercentage(fighter, "other");
  fighter["otherLosses"] = getOutcomeLosses(otherOutcomes);
  fighter["otherLossPercent"] = getOutcomeLossPercentage(fighter, "other")
  
}


/*
  Populates an object representing a fighter's data with properties for his/her fight history by parsing
  the fighter's Sherdog page.
  @param fighter An object representing a fighter's info
  @param $ The loaded DOM courtesy of cheerio.
*/
function parseFightHistory(fighter, $) {
    
  //var resultsTable = $(".fight_history").children(".content").children("table");
  var resultsTable = $("h2:contains('Fight History')").parent().siblings(".content").children("table");
  fighter["fightHistory"] = [];
  resultsTable.children().each(function() {
    //Let's create an object for each fight result
    
    if ($(this).attr("class") != "table_head") { //"this" is essentially each row of the results table.
      var fightInfo = {};      
      var properties = ["result", "opponent", "event", "date", "method", "referee", "round", "time"];
      var propIdx = 0;
      
      $(this).children().each(function() {
        var curData = $(this);  //the current "data" is sort of like the current column.
        var subline = $(curData).find(".sub_line");
        if (subline.length != 0) {
          
          //In here you need to increment propIdx twice because of how the element that contains the class "subline"
          //has relevant text content in two different parts of it.
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
}


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
  @return An object containing height or weight data in customary and metric units.
*/
function heightOrWeightParser(heightOrWeight, $) {
  
  var result = {};
  result["customary"] = $(`.item.${heightOrWeight}`).children("strong").text(); //non-metric
  var metricInfo = ($(".item."+heightOrWeight).contents().filter(function() { return this.nodeType === 3; }).text())
  result["metric"] = metricInfo.slice(metricInfo.indexOf(titleCase(heightOrWeight))+titleCase(heightOrWeight).length).trim();
  return result;
  
}


/*
  Takes a string for an outcome (KO/TKO, SUBMISSIONS, DECISION, OTHER) and returns the DOM element containing wins and losses
  corresponding to these types of outcomes.
  @param outcome The outcome to parse for
  @return the DOM element containing win/loss information corresponding to the provided outcome type.
*/
function parseOutcomeType(outcome, $) {
  return $("div.bio_graph").find(`span.graph_tag:contains(${outcome})`);
}


/*
  Takes a string indicating wins and losses for an outcome type and returns the number of wins
  for that particular type of outcome.
  @param outcomeType An outcome type
  @return the number of wins for that outcome type
*/
function getOutcomeWins(outcomeType) {
  return Number(outcomeType.first().text().split(" ")[0]);
  //text looks like, say: "9 KO/TKO (41%)0 KO/TKO (0%)"
}


/*
  Takes a string indicating wins and losses for an outcome type and returns the number of losses
  for that particular type of outcome.
  @param outcomeType An outcome type
  @return the number of wins for that outcome type
*/
function getOutcomeLosses(outcomeType) {
  return Number(outcomeType.last().text().split(" ")[0]);
}


/*
  Takes a fighter object and returns a percentage rounded to the nearest integer corresponding to the fighter's wins for
  a particular outcome type.
  @param fighter The fighter object.
*/
function getOutcomeWinPercentage(fighter, outcomeType) {  
  return fighter["wins"] != 0 ? Math.round((fighter[`${outcomeType}Wins`]/fighter["wins"])*100): 0;
}


/*
  Takes a fighter object and returns a percentage rounded to the nearest integer corresponding to the fighter's losses for
  a particular outcome type.
  @param fighter The fighter object.
*/
function getOutcomeLossPercentage(fighter, outcomeType) {
  return fighter["losses"] != 0 ? Math.round((fighter[`${outcomeType}Losses`]/fighter["losses"])*100): 0;
}



//================
//EXPORT THE GOODS
//================
module.exports = {
  parseSearchResults: parseSearchResults,
  parseFighterPage: parseFighterPage,
  getFighterData: getFighterData
};