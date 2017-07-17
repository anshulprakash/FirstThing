'use strict';

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').ApiAiApp;
const functions = require('firebase-functions');
const noderequest = require('request-promise');
const databaseurl = "https://vml-mobi-first-thing.firebaseio.com/";

const SSML_SPEAK_START = '<speak>';
const SSML_SPEAK_END = '</speak>';

// API.AI actions
const UNRECOGNIZED_DEEP_LINK = 'deeplink.unknown';
const READ_LIST = 'read.list';
const CREATE_LIST = 'create.list';

// API.AI parameter names
const GIVEN_NAME = 'given-name';
const LIST_NAME = 'list_name';

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

		//let uri = databaseurl + userId + '.json';
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
		  		app.tell({speech: 'Sorry! There is no list for '+ givenName,
	      			displayText: 'Sorry! There is no list for '+ givenName});

		  		return;
		  	}
		  	console.log(people)
		  	let lists = Object.keys(response[givenName]);

		  	if(lists.indexOf(listName) == -1){
		  		app.tell({speech: 'Sorry! There is no list by the name '+listName+' for '+givenName,
	      		displayText: 'Sorry! There is no list by the name '+listName+' for '+givenName});
	      		return;
		  	}

		  	let tasks = Object.keys(response[givenName][listName]);
		  	let taskArray = [];

			tasks.forEach(function(task){
				let value = response[givenName][listName][task]['task'];
				taskArray.push(value);
			});
			
		    let taskListString = "";
		    let taskListSpeech = SSML_SPEAK_START + 'Alright! here are your tasks ' + '<break time="1s" />';

		    taskArray.forEach(function(task){
				taskListString = taskListString + task + '  \n';
				taskListSpeech = taskListSpeech + task + '<break time="1s" />';
			});

		    taskListSpeech = taskListSpeech + SSML_SPEAK_END;

		    app.ask(app.buildRichResponse()
		      .addSimpleResponse({ speech: taskListSpeech,
	        displayText: 'Alright! here are your tasks' })
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

	app.handleRequest(actionMap);

});