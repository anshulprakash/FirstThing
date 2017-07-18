'use strict';

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').ApiAiApp;
const functions = require('firebase-functions');
const noderequest = require('request-promise');

const DATABASE_URL = "https://vml-mobi-first-thing.firebaseio.com/";

const SSML_SPEAK_START = '<speak>';
const SSML_SPEAK_END = '</speak>';

// API.AI actions
const UNRECOGNIZED_DEEP_LINK = 'deeplink.unknown';
const READ_LIST = 'read.list';
const CREATE_LIST = 'create.list';

// API.AI parameter names
const GIVEN_NAME = 'given-name';
const LIST_NAME = 'list_name';
const LIST_ITEM = 'list_items';

exports.firstThing = functions.https.onRequest((request, response) => {

	const app = new App({ request, response });
	console.log('Request headers: ' + JSON.stringify(request.headers));
	console.log('Request body: ' + JSON.stringify(request.body));

	function readList (app) {
		let userId = app.getUser().userId;
		let givenName = app.getArgument(GIVEN_NAME).toLowerCase();
		let listName = app.getArgument(LIST_NAME).toLowerCase();
		console.log(userId);
		console.log(givenName);
		console.log(listName);

		//let uri = DATABASE_URL + userId + '.json';
		const options = {  
		  method: 'GET',
		  uri: "https://vml-mobi-first-thing.firebaseio.com/APhe68FJEPAHW8d9MpRdxOCluodn.json",
		  json: true
		}
		noderequest(options)  
		  .then(function (response) { 
		  	console.log('response from database: '+ JSON.stringify(response));

		  	let people = Object.keys(response);

		  	if(people.indexOf(givenName) == -1){
		  		//givenName does not have any list
		  		app.ask({speech: 'Sorry! There is no list for '+ givenName,
	      			displayText: 'Sorry! There is no list for '+ givenName});

		  		return;
		  	}
		  	console.log(people)
		  	let lists = Object.keys(response[givenName]);

		  	if(lists.indexOf(listName) == -1){
		  		app.ask({speech: 'Sorry! There is no list by the name '+listName+' for '+givenName,
	      		displayText: 'Sorry! There is no list by the name '+listName+' for '+givenName});
	      		return;
		  	}

		  	let tasks = Object.keys(response[givenName][listName]);
		  	let taskArray = [];

	  		tasks.forEach(function(task){
				let value = response[givenName][listName][task]['task'];
				//If list is empty
				if(!value){
					app.ask({speech: 'There are no tasks currently for the list '+listName,
			      		displayText: 'There are no tasks currently for the list '+listName});
			    	return;
				}
				taskArray.push(value);
			});
			
		    let taskListString = "";
		    let taskListSpeech = SSML_SPEAK_START + 'Alright! here are the tasks ' + '<break time="0.5s" />';

		    taskArray.forEach(function(task){
				taskListString = taskListString + task + '  \n';
				taskListSpeech = taskListSpeech + task + '<break time="0.5s" />';
			});
			taskListSpeech = taskListSpeech + SSML_SPEAK_END;
			console.log('debugggg '+taskListString)
		    app.ask(app.buildRichResponse()
		      .addSimpleResponse({ speech: taskListSpeech,
	        displayText: 'Alright! here are the tasks' })
		      .addBasicCard(app.buildBasicCard(taskListString) // Note the two spaces before '\n' required for a
		                            // line break to be rendered in the card
		      .setTitle('List of tasks'))
		    );
		    return;
		  })
		  .catch(function (err) {
		     console.log('Error while trying to retrieve data', err);
		  });

	}

	function createList (app) {
		//let userId = app.getUser().userId;
		let userId = 'APhe68FJEPAHW8d9MpRdxOCluodn';
		let givenName = app.getArgument(GIVEN_NAME).toLowerCase();
		let listName = app.getArgument(LIST_NAME).toLowerCase();

		let getUri = DATABASE_URL + userId + '.json';
		const getOptions = {  
		  method: 'GET',
		  uri: getUri,
		  json: true
		}

		noderequest(getOptions)  
		  .then(function (response) {
		  	//If the userId is not in the database
		  	if(response == null){
		  		const putOptions ={
		  			method: 'PUT',
		  			uri: getUri,
		  			json: {[givenName]: 
		  					{[listName]: [
            								"__empty_list"
        								] 
        					}
        				}
		  		}
		  		noderequest(putOptions)  
				.then(function (response) {
					app.ask({speech: 'List created by the name '+listName+' for '+givenName,
			      		displayText: 'List created by the name '+listName+' for '+givenName});
			      		return;
				})
				.catch(function (err) {
					console.log('Error while trying to retrieve data', err);
				 });
		  	}else{
		  		let people = Object.keys(response);

		  		//givenName does not exist under the userId
		  		if(people.indexOf(givenName) == -1){
		  			console.log('givenName does not have any list');
		  			let putUri = DATABASE_URL + userId + '/' + givenName +'.json';
		  			const putOptions ={
		  			method: 'PUT',
		  			uri: putUri,
		  			json: {[listName]: [
            								"__empty_list"
        								] 
        				}
		  			}
		  			noderequest(putOptions)  
				  	.then(function (response) {
				  		app.ask({speech: 'List created by the name '+listName+' for '+givenName,
			      		displayText: 'List created by the name '+listName+' for '+givenName});
			      		return;
					})
				  	.catch(function (err) {
				    	console.log('Error while trying to retrieve data', err);
				  	});
		  		}else{
		  			let lists = Object.keys(response[givenName]);
		  			//If there is already a list by the listName for givenName
		  			if(lists.indexOf(listName) > -1){
		  				console.log('list name already exits');
				  		app.ask({speech: 'There is already list by the name '+listName+' for '+givenName,
			      		displayText: 'There is already list by the name '+listName+' for '+givenName});
			      		return;
				  	}else{
				  		console.log('Creating list for' + givenName);
				  		let putUri = DATABASE_URL + userId + '/' + givenName + '/' + listName +'.json';
			  			const putOptions ={
				  			method: 'PUT',
				  			uri: putUri,
				  			json: ["__empty_list"]
			  			}
			  			noderequest(putOptions)  
					  	.then(function (response) {
					  		app.ask({speech: 'List created by the name '+listName+' for '+givenName,
				      		displayText: 'List created by the name '+listName+' for '+givenName});
				      		return;
						})
					  	.catch(function (err) {
					    	console.log('Error while trying to retrieve data', err);
					  	});
				  	}
		  		}

		  	}
		 })
		  .catch(function (err) {
		    console.log('Error while trying to retrieve data', err);
		 });

		 return; 

	}

	function addItemToList (app) {
		//let userId = app.getUser().userId;
		let userId = 'APhe68FJEPAHW8d9MpRdxOCluodn';
		let givenName = app.getArgument(GIVEN_NAME).toLowerCase();
		let listName = app.getArgument(LIST_NAME).toLowerCase();
		let listItem = app.getArgument(LIST_ITEM).toLowerCase();

		let getUri = DATABASE_URL + userId + '.json';
		const getOptions = {  
		  method: 'GET',
		  uri: getUri,
		  json: true
		}
		console.log("USER ID: "+userId);
		noderequest(getOptions)  
		  .then(function (response) {
		  	console.log("RESPONSE: "+response);
		  	//If the userId is not in the database
		  	if(response == null){
		  		//create a list and add item to it
		  		console.log('If the userId is not in the database');
		  		const putOptions ={
		  			method: 'PUT',
		  			uri: getUri,
		  			json: {[givenName]: 
		  					{[listName]: [{
            								"recurring" : "no",
            								"task" : listItem
        								 }] 
        					}
        				}
		  		}
		  		noderequest(putOptions)  
				.then(function (response) {
					app.ask({speech: listItem+ ' added to '+listName,
			      		displayText: listItem+ ' added to '+listName});
			      		return;
				})
				.catch(function (err) {
					console.log('Error while trying to retrieve data', err);
				});
		  	}else{
		  		let people = Object.keys(response);
		  		//If the givenName is not there under the userId
		  		if(people.indexOf(givenName) == -1){
		  			console.log('If the givenName is not there under the userId');
		  			//create a list with listName for givenName and add listItem to it
		  			let putUri = DATABASE_URL + userId + '/' + givenName +'.json';
		  			const putOptions ={
		  			method: 'PUT',
		  			uri: putUri,
		  			json: {[listName]:
            							[{
            								"recurring" : "no",
            								"task" : listItem
        								}]
        				}
		  			}
		  			noderequest(putOptions)  
				  	.then(function (response) {
				  		app.ask({speech: listItem+ ' added to '+listName,
			      		displayText: listItem+ ' added to '+listName});
			      		return;
					})
				  	.catch(function (err) {
				    	console.log('Error while trying to retrieve data', err);
				  	});
		  		}else{
		  			let lists = Object.keys(response[givenName]);
		  			//if there is no list by the name of listName
		  			if(lists.indexOf(listName) == -1){
		  				console.log('if there is no list by the name of listName');
		  				//add listName under givenName and add listItem to it
		  				let putUri = DATABASE_URL + userId + '/' + givenName + '/' + listName +'.json';
			  			const putOptions ={
				  			method: 'PUT',
				  			uri: putUri,
				  			json: [{
            								"recurring" : "no",
            								"task" : listItem
        							}]
			  			}
			  			noderequest(putOptions)  
					  	.then(function (response) {
					  		app.ask({speech: listItem+ ' added to '+listName,
				      		displayText: listItem+ ' added to '+listName});
				      		return;
						})
					  	.catch(function (err) {
					    	console.log('Error while trying to retrieve data', err);
					  	});
		  			}else{
		  				//add item to list
		  				console.log('add item to list');
		  				let tasks = Object.keys(response[givenName][listName]);
		  				let count = tasks.length;
		  				tasks.forEach(function(task){
							let value = response[givenName][listName][task]['task'];		
							if(!value){
								console.log('Empty List');
								count = 0;
							}
							if(value===listItem){
								app.ask({speech: listItem + ' is already there in '+listName,
			      				displayText: listItem + ' is already there in '+listName});
			      				return;
							}
						});
						let putUri = DATABASE_URL + userId + '/' + givenName + '/' + listName +'/'+ count.toString() +'.json';
						console.log('PUT URL: '+putUri);
			  			const putOptions ={
				  			method: 'PUT',
				  			uri: putUri,
				  			json: {
            						"recurring" : "no",
            						"task" : listItem
        						  }
			  			}
			  			noderequest(putOptions)  
					  	.then(function (response) {
					  		app.ask({speech: listItem+ ' added to '+listName,
				      		displayText: listItem+ ' added to '+listName});
				      		return;
						})
					  	.catch(function (err) {
					    	console.log('Error while trying to retrieve data', err);
					  	});
		  			}
		  		}
		  	}
		})
		  .catch(function (err) {
		    console.log('Error while trying to retrieve data', err);
		});

		return; 
	}

  	// Greet the user and direct them to next turn
	function unhandledDeepLinks (app) {
	    if (app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT)) {
	      app.ask(app.buildRichResponse()
	        .addSimpleResponse(`Welcome to FirstThing. You can create to-do lists for yourself or any person, add tasks, and read them. Ready to start?`));
	    } else {
	      app.ask(`Welcome to FirstThing. You can create to-do lists for yourself or any person, add tasks, and read them. Ready to start?`,
	        NO_INPUTS);
	    }
	}

	let actionMap = new Map();
	actionMap.set(READ_LIST, readList);
	actionMap.set(CREATE_LIST, createList);
	actionMap.set(UNRECOGNIZED_DEEP_LINK, unhandledDeepLinks);
	actionMap.set('add.task', addItemToList);

	app.handleRequest(actionMap);

});