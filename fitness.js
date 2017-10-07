/***********************************************************
Program Name: 	Server-Side Fitness Application
Author:			Howard Chen
Last Modified:	3-16-2017
Description:	Implements the server-side code for Fitness Application.
				Handles GET and POST requests that web spplication will send.
				Returns information from database to web application using MySQL
***********************************************************/

/****************************************************************************************
Boilerplate Code from the lectures to set up the
express-handlebars-bodyParser-sessions-request system.
***************************************************************************************/
var express = require('express');
var app = express();
var handlebars = require('express-handlebars').create({defaultLayout:'main'});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars'); //names are assumed to be .handlebars files.
app.set('port', 5445);   //while you're logged in to flip this should be all right

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Set up sessions for this app
var session = require('express-session');
app.use(session({secret:'potato'}));

//Set up request for this app
var request = require('request');

app.use(express.static('public'));

//Set up mysql
var mysql = require('./dbcon.js');



/****************************************************************************************
Code for handling GET and POST requests in the server.
***************************************************************************************/

//Sends a script to the client to handle rendering of the page.
//Script will also set up the client to make AJAX requests to this server
//	when the correct DOM elements are clicked.
app.get('/', function(req, res, next) {
	var context = {};
	context.script = "<script src='./js/events.js'></script>";
	res.render('app', context);	
});

//Handles requests from the client to add new data to the workouts database.
//This code verifies the new data has a name field before adding it, and then
//returns the results of the add so that the client can act appropriately.
app.post('/addExercise', function(req, res, next) {
	//Convert string to the correct boolean for the database.
	if(req.body.wt_type == "lbs") {
		req.body.wt_type = "1";
	}
	else {
		req.body.wt_type = "0";
	}
	
	console.log(req.body);
	
	//Initialize response object that will be sent back.
	//Default response is that the POST request failed.
	var resBody = {};
	resBody.success = false;
	
	//If name isn't empty, update the database.
	if(req.body.name != "") {
		//First, create a new entry based on the name.
		mysql.pool.query("INSERT INTO workouts (name) VALUES(?)",
			[req.body.name],
			function(err, result) {
				if(err) {
					next(err);
					return;
				}		
				else {
		//Once a new entry has been made, update it with the rest of the values
		//sent from the client.
					resBody.success = true;
					newId = result.insertId;
					mysql.pool.query("UPDATE workouts SET reps=?, weight=?, date=?, lbs=? WHERE id=? ",
						[req.body.reps, req.body.weight, req.body.date, req.body.wt_type, newId],
						function(err, result) {
							if(err) {
								next(err);
								return;
							}
							else {
		//once all that is done, tell the client the database query succeeded,
		//and give the client the database data so the client can render it.
								mysql.pool.query('SELECT * FROM workouts WHERE id=?', [newId],
								function(err, rows, field) {
									if(err) {
										next(err);
										return;
									}
									else {
										console.log(rows);
										
										console.log(rows[0].date);
										resBody.row = rows;
										res.send(JSON.stringify(resBody));
									}
								});
							}
						});
				}
			});
	}
	else {
		
		//Since name was empty, tell client the request failed.
		//through the resBody.success variable.
		console.log("NAME WAS NULL");
		res.send(JSON.stringify(resBody));
	}
	
});

//Handles requests from the client to remove database entries with the specified id.
app.post("/removeExercise", function(req,res,next) {
	
	//Create response object. Default is to say query failed.
	var resBody = {};
	resBody.success = false;
	
	//Attempt to delete the requested id.
	mysql.pool.query("DELETE FROM workouts WHERE id=?", [req.body.id],
		function(err, result) {
			if(err) {
				next(err);
				return;
			}
			else {
	//If delete succeeded, inform the client by sending a
	//response with success = true.
				resBody.success = true;
				mysql.pool.query('SELECT * FROM workouts',
				function(err, rows, field) {
					if(err) {
						next(err);
						return;
					}
					else {
						console.log(rows);
						res.send(JSON.stringify(resBody));
					}
				});
			}
		});
	
});

//Handles requests from the client to return the contents of the database.
app.post("/getTable", function(req,res,next) {
	//initialize response object.
	var resBody = {};
	
	//Attempt to get all rows of the database.
	mysql.pool.query('SELECT * FROM workouts',
		function(err, rows, field) {
			if(err) {
				next(err);
				return;
			}
	//If query succeeded, send the array of rows back to the client.
			else {
				console.log(rows);
				resBody.table = rows;
				res.send(JSON.stringify(resBody));
			}
		}
	);
	
	
});

//Handles requests to update a specific entry of the database (through row ID).
app.post("/updateExercise", function(req,res,next) {
	
	//Initialize response object. Default is that query failed.
	var resBody = {};
	resBody.success = false;
	
	//Change req.wt_type to a boolean value for the database.
	if(req.body.wt_type == "lbs") {
		req.body.wt_type = "1";
	}
	else {
		req.body.wt_type = "0";
	}
	console.log(req.body);
	
	//Perform safe update. First, get old values of the row from the database.
	mysql.pool.query("SELECT * FROM workouts WHERE id=?", [req.body.id], function(err, result) {
		if(err){
			next(err);
			return;
		}
	//Once you have the values of the row, update the database. If the client forgot to include
	//any database information, replace it with the old database information.
		if(result.length == 1) {
			var curRow = result[0];
			mysql.pool.query("UPDATE workouts SET name=?, reps=?, weight=?, date=?, lbs=? WHERE id=?",
				[req.body.name || curRow.name, req.body.reps || curRow.reps, req.body.weight || curRow.weight,
					req.body.date || curRow.date, req.body.wt_type || curRow.lbs, req.body.id], function(err, result) {
						if(err) {
							next(err);
							return;
						}
						else {
	//Once the database has been updated, return the updated row
	//to the client so the client can process and render it.
							mysql.pool.query("SELECT * FROM workouts WHERE id=?", [req.body.id],
								function(err, result) {
									if(err) {
										next(err);
										return;
									}
									else {
										resBody.row = result[0];
										resBody.success = true;
										res.send(JSON.stringify(resBody));
									}

								}
							);
						}
					}
			);
				
		}
		
	});
	
	
});


//Resets table for use in database. Database should now be empty.
//Code was provided by OSU, so I won't comment this code.
app.get('/reset-table',function(req,res,next){
	var context = {};
	mysql.pool.query("DROP TABLE IF EXISTS workouts", function(err){
		var createString = "CREATE TABLE workouts("+
			"id INT PRIMARY KEY AUTO_INCREMENT,"+
			"name VARCHAR(255) NOT NULL,"+
			"reps INT,"+
			"weight INT,"+
			"date DATE,"+
			"lbs BOOLEAN)";
		mysql.pool.query(createString, function(err){
			context.results = "Table reset";
			res.render('log',context);
		});
	});
});


/****************************************************************************************
Code for handling 404 and 500 errors (unknown resource errors and server errors)
***************************************************************************************/
//Handles unknown resource errors.
app.use(function(req,res) {
	res.status(404);
	res.render('404');
});

//handle server errors.
app.use(function(err, req, res, next) {
	console.error(err.stack);
	res.type('plain\text');
	res.status(500);
	res.render('500');
});

/****************************************************************************************
STARTS THE APPLICATION.
***************************************************************************************/
app.listen(app.get('port'), function() {
	console.log("Check started on port " + app.get("port") + "; press Ctrl-C to terminate.");
});