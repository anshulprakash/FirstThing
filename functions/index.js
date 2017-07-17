'use strict';

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').ApiAiApp;
const functions = require('firebase-functions');
const noderequest = require('request-promise');
const databaseurl = "https://vml-mobi-first-thing.firebaseio.com/";



exports.firstThing = functions.https.onRequest((request, response) => {

	const app = new App({ request, response });
	console.log('Request headers: ' + JSON.stringify(request.headers));
	console.log('Request body: ' + JSON.stringify(request.body));

function readList (app) {
	let userId = app.getUser().userId;
	let givenName = app.getArgument('given-name');
	let listName = app.getArgument('list_name');
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
	    app.ask(app.buildRichResponse()
              .addSimpleResponse(JSON.stringify(response)));
    	return;
	  })
	  .catch(function (err) {
	     console.log('Error while trying to retrieve data', err);
	  });

}

function createList (app) {
	
}

	let actionMap = new Map();
	actionMap.set('read.list', readList);


	app.handleRequest(actionMap);

});