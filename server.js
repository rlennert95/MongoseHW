var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var mongojs = require("mongojs");
var axios = require("axios");
var cheerio = require("cheerio");

var db = require("./models");

var PORT = 3000;

var app = express();

app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));


app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname + "./public/index.html"));
});

var databaseUrl = "movie_scraper_db";
var collections = ["MovieData"];

// Hook mongojs configuration to the db variable
var db = mongojs(databaseUrl, collections);
db.on("error", function(error) {
  console.log("Database Error:", error);
});



// Retrieve data from the db
app.get("/all", function(req, res) {
  // Find all results from the scrapedData collection in the db
  db.scrapedData.find({}, function(error, found) {
    // Throw any errors to the console
    if (error) {
      console.log(error);
    }
    // If there are no errors, send the data to the browser as json
    else {
      res.json(found);
    }
  });
});
// Scrape data from one site and place it into the mongodb db
app.get("/scrape", function(req, res) {
    // Make a request via axios for the news section of `ycombinator`
    axios.get("https://news.ycombinator.com/").then(function(response) {
      // Load the html body from axios into cheerio
      var $ = cheerio.load(response.data);
      // For each element with a "title" class
      $(".title").each(function(i, element) {
        // Save the text and href of each link enclosed in the current element
        var title = $(element).children("a").text();
        var link = $(element).children("a").attr("href");
  
        // If this found element had both a title and a link
        if (title && link) {
          // Insert the data in the scrapedData db
          db.scrapedData.insert({
            title: title,
            link: link
          },
          function(err, inserted) {
            if (err) {
              // Log the error if one is encountered during the query
              console.log(err);
            }
            else {
              // Otherwise, log the inserted data
              console.log(inserted);
            }
          });
        }
      });
    });
  
    // Send a "Scrape Complete" message to the browser
    res.send("Scrape Complete");
  });
  
  
  // Listen on port 3000
  app.listen(3000, function() {
    console.log("App running on port 3000!");
  });
  