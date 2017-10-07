/************************************************************************************
Program Name:	Fitness Application Home Page AJAX/Events script.
Author:			Howard Chen
Description:	Script that sets up event handlers and AJAX requests from the
				client page.
Last Modified:	3-16-2017

NOTE: 	This code has repeated elements and could be refactored into some global functions.
		But this was my first time writing such an application, so I accept
		that I was inefficient. At least it seems to work!
***********************************************************************************/

//Global objects from the DOM
var table = document.getElementById("table");
var table_body = document.getElementById("table_body");
var editForm = document.getElementById("editForm");
var submit_exercise = document.getElementById("submit_exercise");

//This code will be called when page is loaded to get existing data from the
//database and build a table with it.
function buildTable() {
	
	//Step 1: Make asynchronous POST request to server for the data.
	var req = new XMLHttpRequest();
	var address = "http://flip1.engr.oregonstate.edu:5445/getTable";
	req.open("POST", address, true);
	req.setRequestHeader('Content-Type', 'application/json');
	var payload = {};	//empty payload
	
	//Step 2: Add event listener to use data to build a table when the
	//data arrives.
	req.addEventListener('load', function(event) {
		event.preventDefault();
		
		//Get array of data from database.
		var response = JSON.parse(req.responseText);
		console.log(response);
		
		//Make a table row for each entry in the data.
		response.table.forEach(function(e) {
			//Add a row to the table
			var newRow = table_body.insertRow();
			
			//Add cells to the rows, and fill them with data.
			var idCell = newRow.insertCell(0);
			idCell.textContent = e.id;
			idCell.className = "hidden";
			var nameCell = newRow.insertCell(1);
			nameCell.textContent = e.name;
			var repsCell = newRow.insertCell(2);
			repsCell.textContent = e.reps;
			var weightCell = newRow.insertCell(3);
			weightCell.textContent = e.weight;
			var dateCell = newRow.insertCell(4);
			dateCell.textContent = e.date.slice(0,10);
			var typeCell = newRow.insertCell(5);
			if(e.lbs == "1") {
				typeCell.textContent = "lbs";
			}
			else {
				typeCell.textContent = "kg";
			}
			
			//Add a remove button for the row.
			var removeCell = newRow.insertCell(6);
			removeCell.className = "button";
			var remove = document.createElement("button");
			remove.textContent = "Remove";
			removeCell.appendChild(remove);
			
			//Add an edit button for the row.
			var editCell = newRow.insertCell(7);
			editCell.className = "button";
			var edit = document.createElement("button");
			edit.textContent = "Edit";
			editCell.appendChild(edit);
			
			
			//Add event handler to remove button that will
			//make a request to remove the row from the database
			//when the button is clicked.
			var bindRemoveButton = function() {
				remove.addEventListener('click', function(event) {
					event.stopPropagation();
					event.preventDefault();
					console.log("remove clicked");
					
					//Make remvoe request to server, passing server the row's hidden ID.
					var address = "http://flip1.engr.oregonstate.edu:5445/removeExercise";
					var req = new XMLHttpRequest();
					req.open("POST", address, true);
					req.setRequestHeader('Content-Type', 'application/json');
					
					var payload = {};
					payload.id = idCell.textContent;
					
					//If server response comes back with a result of TRUE,
					//you can remove the row from the table. Otherwise, do nothing.
					req.addEventListener('load', function() {
						if(req.status >= 200 && req.status < 400) {
							//Get response of the server.
							var response = JSON.parse(req.responseText);
							console.log(response);
							
							//If database removal was successful, then delete the
							//specified row.
							if(response.success == true)
							{
								var rowId = newRow.rowIndex;
								console.log(rowId);
								table.deleteRow(rowId);
							}
							else {
								console.log("SECONDARY REMOVAL ERROR");
							}
						}
						else {
							console.log("ERROR IN REMOVE ATTEMPT");
						}
						
					});
					
					//Send request and wait for response
					req.send(JSON.stringify(payload));
					
				});
			};
			
			//Add event handler to edit button that will show a pre-populated
			//edit form for editng the data 
			var bindEditButton = function (iCell, nCell, rCell, wCell, dCell, tCell) {
				edit.addEventListener('click', function(event) {
					event.stopPropagation();
					event.preventDefault();
					console.log("edit clicked");
					
					//Unhide the remove form. It will be hidden again later.
					editForm.className="";
					
					//Populate the form with row's existing data.
					document.getElementById("ed_id").value = iCell.textContent;
					document.getElementById("ed_name").value = nCell.textContent;
					document.getElementById("ed_reps").value = rCell.textContent;
					document.getElementById("ed_weight").value = wCell.textContent;
					document.getElementById("ed_date").value = dCell.textContent;
					var wt_choices = document.getElementsByClassName("ed_wt_type");
					for(var index = 0; index < wt_choices.length; index++) {
						//If the radio button matches the text content, then
						//check it, otherwise uncheck it.
						if(tCell.textContent == wt_choices[index].value) {
							wt_choices[index].checked = true;
							console.log(wt_choices[index].value + " was checked!");
						}
						else {
							wt_choices[index].checked = false;
						}
					}
					
					//inactivate all buttons on page until the edit form
					//is submitted. This prevents multiple edits at the same time.
					var buttons = document.getElementsByTagName("button");
					for(var index = 0; index < buttons.length; index++) {
						buttons[index].disabled = true;
					}
					submit_exercise.disabled = true;
					
					
					//Give the edit form an event handler so that when the
					//information is submitted, the entered data is sent to
					//server to update the server.
					var ed_button = document.getElementById("ed_submit_change");
					var bindEdit = function(event) {
						event.preventDefault();
						
						//Send updated data to the server from the edit form.
						var req = new XMLHttpRequest();
						var address = "http://flip1.engr.oregonstate.edu:5445/updateExercise";
						req.open("POST", address, true);
						req.setRequestHeader('Content-Type', 'application/json');
						var payload = {};
						payload.id = document.getElementById('ed_id').value;
						payload.name = document.getElementById('ed_name').value;
						payload.reps = document.getElementById('ed_reps').value;
						payload.weight = document.getElementById('ed_weight').value;
						payload.date = document.getElementById('ed_date').value;
						var ed_wt_type = document.getElementsByClassName('ed_wt_type');
						for(var index = 0; index < ed_wt_type.length; index++)
						{
							if(ed_wt_type[index].checked == true)
							{
								payload.wt_type = ed_wt_type[index].value;
							}
						}
						
						//If the database update query succeeds, use the
						//database's response data to update the
						//appropariate rows in the table.
						req.addEventListener('load', function() {
							
							var response = JSON.parse(req.responseText);
							console.log(response);
							
							if(response.success) {
								iCell.textContent = response.row.id;
								nCell.textContent = response.row.name;
								rCell.textContent = response.row.reps;
								wCell.textContent = response.row.weight;
								dCell.textContent = response.row.date.slice(0,10);
								if(response.row.lbs == "1") {
									tCell.textContent = "lbs";
								}
								else {
									tCell.textContent = "kg";
								}
								
						//hide the form and reactivate all the buttons.
								editForm.className = "hidden";	
								
								for(var index = 0; index < buttons.length; index++) {
									buttons[index].disabled = false;
								}
								submit_exercise.disabled = false;
							}
						});
						
						//Send request and wait for response
						req.send(JSON.stringify(payload));
						
						
						//Once the edit form's submit button has been clicked,
						//remove the event handler on it, since I don't want
						//multiple event handlers to grow on it like moss.
						ed_button.removeEventListener('click', bindEdit);
						
					}
					ed_button.addEventListener('click', bindEdit);
				});
				
			};
			
			bindRemoveButton();
			bindEditButton(idCell, nameCell, repsCell, weightCell, dateCell, typeCell);
			
		});
		
	});
	
	//Step 3: Request the data from the server.
	req.send(JSON.stringify(payload));
}
buildTable();


//This code will be called every time the submit button is pressed on the
//Add Exercise form. It will add the specified exercise data to the databse
//and add a row for the data into the table.
var bindSubmitButton = function() {
	submit_exercise.addEventListener('click', function(event) {
		event.preventDefault();
		
		//Step 1: Send a POST request to the server with the
		//data.
		var req = new XMLHttpRequest();
		var address = "http://flip1.engr.oregonstate.edu:5445/addExercise";
		req.open("POST", address, true);
		req.setRequestHeader('Content-Type', 'application/json');
		var payload = {};
		payload.name = document.getElementById('name').value;
		payload.reps = document.getElementById('reps').value;
		payload.weight = document.getElementById('weight').value;
		payload.date = document.getElementById('date').value;
		var wt_type = document.getElementsByClassName('wt_type');
		for(var index = 0; index < wt_type.length; index++)
		{
			if(wt_type[index].checked == true)
			{
				payload.wt_type = wt_type[index].value;
			}
		}
		
		//Step 2: When the server sends the response back,
		//If the response says the database add succeeded, then
		//add the data to the table.
		req.addEventListener('load', function() {
			if(req.status >= 200 && req.status < 400) {
				var response = JSON.parse(req.responseText);
				console.log(response);
				
				//If response was successful, use the response data from the database
				//to make a new row for the table.
				if(response.success == true) {
					
					//Add a row to the table
					var newRow = table_body.insertRow();
					
					//Add cells to row, and fill them with data.
					var idCell = newRow.insertCell(0);
					idCell.textContent = response.row[0].id;
					idCell.className = "hidden";
					var nameCell = newRow.insertCell(1);
					nameCell.textContent = response.row[0].name;
					var repsCell = newRow.insertCell(2);
					repsCell.textContent = response.row[0].reps;
					var weightCell = newRow.insertCell(3);
					weightCell.textContent = response.row[0].weight;
					var dateCell = newRow.insertCell(4);
					dateCell.textContent = response.row[0].date.slice(0,10);
					var typeCell = newRow.insertCell(5);
					if(response.row[0].lbs == "1") {
						typeCell.textContent = "lbs";
					}
					else {
						typeCell.textContent = "kg";
					}
					
					//Add a remove button for the row.
					var removeCell = newRow.insertCell(6);
					removeCell.className = "button";
					var remove = document.createElement("button");
					remove.textContent = "Remove";
					removeCell.appendChild(remove);
					
					//Add an edit button for the row.
					var editCell = newRow.insertCell(7);
					editCell.className = "button";
					var edit = document.createElement("button");
					edit.textContent = "Edit";
					editCell.appendChild(edit);
					
					
					//Add event handler to remove button that will
					//make a request to remove the row from the database
					//when the button is clicked.
					var bindRemoveButton = function() {
						remove.addEventListener('click', function(event) {
							event.stopPropagation();
							event.preventDefault();
							console.log("remove clicked");
							
							//Send server the id of the row to be removed.
							var address = "http://flip1.engr.oregonstate.edu:5445/removeExercise";
							var req = new XMLHttpRequest();
							req.open("POST", address, true);
							req.setRequestHeader('Content-Type', 'application/json');
							var payload = {};
							payload.id = idCell.textContent;
							
							//If the remove query succeeded, update the table to reflect that.
							req.addEventListener('load', function() {
								if(req.status >= 200 && req.status < 400) {
									//Get response of the server.
									var response = JSON.parse(req.responseText);
									console.log(response);
									
									//If database removal was successful, then delete the
									//specified row.
									if(response.success == true)
									{
										var rowId = newRow.rowIndex;
										console.log(rowId);
										table.deleteRow(rowId);
									}
									else {
										console.log("SECONDARY REMOVAL ERROR");
									}
								}
								else {
									console.log("ERROR IN REMOVE ATTEMPT");
								}
								
							});
							
							//Send request and wait for response
							req.send(JSON.stringify(payload));
							
						});
						
					};
					
					//Add event handler to edit button that will show a pre-populated
					//edit form for editng the data 
					var bindEditButton = function () {
						edit.addEventListener('click', function(event) {
							event.stopPropagation();
							event.preventDefault();
							console.log("edit clicked");
							
							//Unhide the edit form. We will hide it again later.
							editForm.className="";
							
							//Populate the form with row's existing data.
							document.getElementById("ed_id").value = idCell.textContent;
							document.getElementById("ed_name").value = nameCell.textContent;
							document.getElementById("ed_reps").value = repsCell.textContent;
							document.getElementById("ed_weight").value = weightCell.textContent;
							document.getElementById("ed_date").value = dateCell.textContent;
							var wt_choices = document.getElementsByClassName("ed_wt_type");
							for(var index = 0; index < wt_choices.length; index++) {
								//If the radio button matches the text content, then
								//check it, otherwise uncheck it.
								if(typeCell.textContent == wt_choices[index].value) {
									wt_choices[index].checked = true;
									console.log(wt_choices[index].value + " was checked!");
								}
								else {
									wt_choices[index].checked = false;
								}
							}
							
							//inactivate all buttons on page until the edit form is submitted.
							//We don't want multiple edits or removes to happen at the same time.
							var buttons = document.getElementsByTagName("button");
							for(var index = 0; index < buttons.length; index++) {
								buttons[index].disabled = true;
							}
							submit_exercise.disabled = true;
							
							
							//Set behavior of edit form's submit button. When it is clicked,
							//send the update data to server.
							var ed_button = document.getElementById("ed_submit_change");
							var bindEdit = function(event) {
								event.preventDefault();
								
								var req = new XMLHttpRequest();
								var address = "http://flip1.engr.oregonstate.edu:5445/updateExercise";
								req.open("POST", address, true);
								req.setRequestHeader('Content-Type', 'application/json');
								var payload = {};
								payload.id = document.getElementById('ed_id').value;
								payload.name = document.getElementById('ed_name').value;
								payload.reps = document.getElementById('ed_reps').value;
								payload.weight = document.getElementById('ed_weight').value;
								payload.date = document.getElementById('ed_date').value;
								var ed_wt_type = document.getElementsByClassName('ed_wt_type');
								for(var index = 0; index < ed_wt_type.length; index++)
								{
									if(ed_wt_type[index].checked == true)
									{
										payload.wt_type = ed_wt_type[index].value;
									}
								}
								
								//When response from server comes back, if
								//update was successful, update the rows of the
								//table to reflect the updated database.
								req.addEventListener('load', function() {
									var response = JSON.parse(req.responseText);
									console.log(response);
									
									if(response.success) {
										idCell.textContent = response.row.id;
										nameCell.textContent = response.row.name;
										repsCell.textContent = response.row.reps;
										weightCell.textContent = response.row.weight;
										dateCell.textContent = response.row.date.slice(0,10);
										if(response.row.lbs == "1") {
											typeCell.textContent = "lbs";
										}
										else {
											typeCell.textContent = "kg";
										}
									
										//No matter what, after edit form button is clicked,
										//rehide the form and re-enable all the buttons.
										editForm.className = "hidden";	
										for(var index = 0; index < buttons.length; index++) {
											buttons[index].disabled = false;
										}
										submit_exercise.disabled = false;
									}
								});
								
								console.log(payload);
								//Send request and wait for response
								req.send(JSON.stringify(payload));
								
								//Remove the event handler on the edit form's submit button.
								//So event handler's don't build up on it like moss.
								ed_button.removeEventListener('click', bindEdit);
							};
							ed_button.addEventListener('click', bindEdit);
						});
						
					};
					
					//Bind the removing and editing buttons!
					bindRemoveButton();
					bindEditButton();
				}
				else {
					console.log("Adding to database failed!");
				}
			}
			else {
				console.log("Error: " + req.statusText);
			}
		});
		
		//Send request and wait for response
		req.send(JSON.stringify(payload));
		
	});
};

bindSubmitButton();