'use strict';

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').ApiAiApp;
const functions = require('firebase-functions');
const noderequest = require('request-promise');
const twilio = require('twilio');
const validator = require('validator');

const DATABASE_URL = "https://vml-mobi-first-thing.firebaseio.com/";

const SSML_SPEAK_START = '<speak>';
const SSML_SPEAK_END = '</speak>';

// API.AI actions
const UNRECOGNIZED_DEEP_LINK = 'deeplink.unknown';
const READ_LIST = 'read.list';
const CREATE_LIST = 'create.list';
const ADD_TASK = 'add.task';
const FETCH_LISTS = 'fetch.lists';
const ADD_PHONENUMBER = 'add.phonenumber';
const INPUT_WELCOME = 'input.welcome';
const STOP_NOTIFICATION = 'stop.notification';

// API.AI parameter names
const GIVEN_NAME = 'given-name';
const LIST_NAME = 'list_name';
const LIST_ITEM = 'list_items';
const RECURRING_VALUE = 'recurring_value';
const PHONE_NUMBER = 'phone_number';

//API.AI contexts
const GUIDED_TOUR = 'guided-tour';

// Twilio Credentials
const accountSid = 'ACa280ebee55197ee9778f56bad859e768';
const authToken = '11a1b1dd4549e9482aa369506767da06';
const TWILIO_NUMBER = '+18163071770';

//creates title case for functions
function toTitleCase(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

exports.firstThing = functions.https.onRequest((request, response) => {

	const app = new App({ request, response });
	console.log('Request headers: ' + JSON.stringify(request.headers));
	console.log('Request body: ' + JSON.stringify(request.body));

	function addPhoneNumber (app) {
		//let userId = app.getUser().userId;
		let userId = 'APhe68FJEPAHW8d9MpRdxOCluodn';
		let phoneNumber = app.getArgument(PHONE_NUMBER);

		let postUri = DATABASE_URL + 'profiles/' + userId +'.json';
		
		const postOptions ={
  			method: 'PUT',
  			uri: postUri,
  			json: {"phone": phoneNumber,
  					"name": "directory assistance",
  					"notification": "yes"
				}
  		}
  		noderequest(postOptions)  
		.then(function (response) {
			let successMsg = 'Got it. I\'ll send you a text when your users have arrived and started their lists. You can cancel this at any time by telling me to stop notifications. Ready to start a guided tour?';
			app.ask({speech: successMsg,
				     displayText: successMsg});
		})
		.catch(function (err) {
			console.log('Error while posting data', err);
		});

		/*if(validator.isMobilePhone(phoneNumber,'en-US')){
			let successMsg = 'Got it. I\'ll send you a text when your users have arrived and started their lists. You can cancel this at any time by telling me to stop notifications. Ready to start a guided tour?';
			app.ask({speech: successMsg,
				     displayText: successMsg});
		}else{
			let errorMsg = phoneNumber + ' is not a valid number! Would you like to enter phone number again?';
			app.ask({speech: errorMsg,
				     displayText: errorMsg});
			app.setContext('welcome-guided-tour',0);
		}*/
		
		return;
	}

	function welcome (app) {
		console.log('inside welcome');
		//let userId = app.getUser().userId;
		let userId = 'APhe68FJEPAHW8d9MpRdxOCluodn';
		let profileUri = DATABASE_URL + 'profiles/' + userId +'.json';
		let message = "Welcome to FirstThing. You can create to-do lists for yourself or any person, add tasks, and read them. Ready to start?";
		let profileOptions ={
  			method: 'GET',
  			uri: profileUri,
  			json: true
  		}
  		noderequest(profileOptions)  
		.then(function (response) {
			console.log('Response: '+response);
			if(response!=null){
				console.log('adding context');
				app.setContext('add-phone-number',0);
				app.setContext('defaultwelcomeintent-followup',0);
				app.setContext('phone-number-added',1);
				message = "Welcome to FirstThing. You can create to-do lists for yourself or any person, add tasks, and read them. Ready to start a guided tour?";
			}
			console.log(app.getContexts());
			app.ask({speech: message, displayText: message});
		})
		.catch(function (err) {
			console.log('Error while getting data', err);
		});
		
		return;
	}

	//gets tasks for a lists for a user
	function readList (app) {
		//let userId = app.getUser().userId;
		let userId = 'APhe68FJEPAHW8d9MpRdxOCluodn';
		let givenName = app.getArgument(GIVEN_NAME).toLowerCase();
		let listName = app.getArgument(LIST_NAME).toLowerCase();
		let sendNotification = false;
		console.log(userId);
		console.log(givenName);
		console.log(listName);

		let getUri = DATABASE_URL + userId + '.json';
		let options = {  
		  method: 'GET',
		  uri: getUri,
		  json: true
		}
		noderequest(options)  
		  .then(function (response) { 
		  	console.log('response from database: '+ JSON.stringify(response));

		  	let people = Object.keys(response);

		  	if(people.indexOf(givenName) == -1){
		  		//givenName does not have any list
		  		app.ask({speech: 'Sorry! There is no list for '+ givenName,
	      			displayText: 'Sorry! There is no list for '+ toTitleCase(givenName)});

		  		return;
		  	}
		  	console.log(people)
		  	let lists = Object.keys(response[givenName]);

		  	if(lists.indexOf(listName) == -1){
		  		app.ask({speech: 'Sorry! There is no list by the name '+listName+' for '+ givenName ,
	      		displayText: 'Sorry! There is no list by the name '+listName+' for '+ toTitleCase(givenName)});
	      		return;
		  	}

		  	let tasks = Object.keys(response[givenName][listName]);
		  	let taskArray = [];

	  		tasks.forEach(function(task){
				let value = response[givenName][listName][task]['task'];
				//If list is empty
				if(!value){
					app.ask({speech: 'There are no tasks currently for '+givenName+'\'s '+listName+' list',
			      		displayText: 'There are no tasks currently for '+toTitleCase(givenName)+'\'s '+listName+' list'});
			    	return;
				}
				taskArray.push(value);
			});
			
		    let taskListString = "";
		    let taskListSpeech = SSML_SPEAK_START + 'Alright! here are the tasks for '+givenName+ '<break time="0.5s" />';

		    taskArray.forEach(function(task){
				taskListString = taskListString + task + '  \n';
				taskListSpeech = taskListSpeech + task + '<break time="0.5s" />';
			});
			taskListSpeech = taskListSpeech + SSML_SPEAK_END;
			console.log('debugggg '+taskListString);
		    app.ask(app.buildRichResponse()
		       .addSimpleResponse({ speech: taskListSpeech, displayText: 'Alright! here are the tasks for '+toTitleCase(givenName) })
		       .addBasicCard(app.buildBasicCard(taskListString) 
		       .setTitle('List of tasks for '+toTitleCase(givenName)))
		    );
		    
		    let profileUri = DATABASE_URL + 'profiles/' + userId +'.json';
		
			let profileOptions ={
	  			method: 'GET',
	  			uri: profileUri,
	  			json: true
	  		}
	  		let phoneNumber = "";
	  		noderequest(profileOptions)  
			.then(function (response) {
				if(response!=null){
					console.log("Notification: "+response['notification']);
					sendNotification = response['notification']=="no" ? false : true;
					phoneNumber = response['phone'];
					console.log('sendNotification: '+sendNotification);
				    if(sendNotification){
				    	let client = twilio(accountSid, authToken);
					    client.messages
						  .create({
						    to: phoneNumber,
						    from: TWILIO_NUMBER,
						    body: toTitleCase(givenName)+'\'s ' + listName +' list has been accessed',
						  })
						  .then((message) => console.log(message.sid))
						  .catch(function (err) {
								console.log(err);
						  });
					}
			    }
			})
			.catch(function (err) {
				console.log('Error while getting data', err);
			});
		    
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

		let createListSuccessTxt = 'List created by the name \''+listName+'\' for '+toTitleCase(givenName);
		let createListSuccessSpeech = 'List created by the name '+listName+' for '+givenName;
		let errorMsg = 'There is already a list by the name \''+listName+'\' for '+toTitleCase(givenName);
		let errorSpeech = 'There is already a list by the name '+listName+' for '+givenName;

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
					app.ask({speech: createListSuccessSpeech,
			      		displayText: createListSuccessTxt});
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
				  		app.ask({speech: createListSuccessSpeech,
			      		displayText: createListSuccessTxt});
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
				  		app.ask({speech: errorSpeech,
			      		displayText: errorMsg});
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
					  		app.ask({speech: createListSuccessSpeech,
				      		displayText: createListSuccessTxt});
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
		let recurringValue = app.getArgument(RECURRING_VALUE);

		recurringValue = recurringValue ? recurringValue.toLowerCase() : "no";
		console.log('recurring_value= '+recurringValue);

		let itemAddedMsg = recurringValue == "no" ? 'Got it. \''+listItem+ '\' added to '+toTitleCase(givenName)+'\'s '+listName+' list' : 'Got it. \''+listItem+'\' will repeat '+recurringValue+' for '+toTitleCase(givenName);
		let itemAddedMsgGuided = 'Perfect! To read this list you can say \'OK Google, ask FirstThing what\'s on '+ toTitleCase(givenName)+ '\'s '+listName+' list?';
		let addItemToListError = '\''+listItem +'\''+ ' is already there in '+toTitleCase(givenName)+'\'s '+ listName +' list';
		
		let isGuidedTour = app.getContext(GUIDED_TOUR) ? true : false;
		console.log('isGuidedTour'+isGuidedTour);
		//remove the guided tour context
		app.setContext(GUIDED_TOUR,0);

		

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
            								"recurring" : recurringValue,
            								"task" : listItem
        								 }] 
        					}
        				}
		  		}
		  		noderequest(putOptions)  
				.then(function (response) {
					if(isGuidedTour){
						app.ask({speech: itemAddedMsgGuided, displayText: itemAddedMsgGuided});
					}else{
						app.ask({speech: itemAddedMsg, displayText: itemAddedMsg});
					}
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
            								"recurring" : recurringValue,
            								"task" : listItem
        								}]
        				}
		  			}
		  			noderequest(putOptions)  
				  	.then(function (response) {
				  		if(isGuidedTour){
							app.ask({speech: itemAddedMsgGuided, displayText: itemAddedMsgGuided});
						}else{
							app.ask({speech: itemAddedMsg, displayText: itemAddedMsg});
						}
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
            								"recurring" : recurringValue,
            								"task" : listItem
        							}]
			  			}
			  			noderequest(putOptions)  
					  	.then(function (response) {
					  		if(isGuidedTour){
								app.ask({speech: itemAddedMsgGuided, displayText: itemAddedMsgGuided});
							}else{
								app.ask({speech: itemAddedMsg, displayText: itemAddedMsg});
							}
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
		  				let alreadyPresent = false;
		  				tasks.forEach(function(task){
							let value = response[givenName][listName][task]['task'];		
							if(!value){
								console.log('Empty List');
								count = 0;
							}
							if(value===listItem){
								alreadyPresent = true;
							}
						});
		  				if(alreadyPresent){
		  					app.ask({speech: addItemToListError,
			      			displayText: addItemToListError});
			      			console.log('value===listItem');
			      			return;
		  				}else{
		  					let putUri = DATABASE_URL + userId + '/' + givenName + '/' + listName +'/'+ count.toString() +'.json';
							console.log('PUT URL: '+putUri);
				  			const putOptions ={
					  			method: 'PUT',
					  			uri: putUri,
					  			json: {
	            						"recurring" : recurringValue,
	            						"task" : listItem
	        						  }
				  			}
				  			noderequest(putOptions)  
						  	.then(function (response) {
						  		if(isGuidedTour){
									app.ask({speech: itemAddedMsgGuided, displayText: itemAddedMsgGuided});
								}else{
									app.ask({speech: itemAddedMsg, displayText: itemAddedMsg});
								}
							})
							.catch(function (err) {
					    		console.log('Error while trying to retrieve data', err);
					  		});	
		  				}
		  			}
		  		}
		  	}
		})
		  .catch(function (err) {
		    console.log('Error while trying to retrieve data', err);
		});

		return; 
	}

	function readListsForOwner (app) {
		//let userId = app.getUser().userId;
		let userId = 'APhe68FJEPAHW8d9MpRdxOCluodn';
		let givenName = app.getArgument(GIVEN_NAME).toLowerCase();
		let getUri = DATABASE_URL + userId + '/' + givenName + '.json';
		const getOptions = {  
		  method: 'GET',
		  uri: getUri,
		  json: true
		}
		noderequest(getOptions)  
	  	.then(function (response) {
	  	
	  	//If there are no lists for the user
		 if(response == null){
		 	app.ask({speech: 'There are currently no lists for '+givenName,
			      	displayText: 'There are currently no lists for '+toTitleCase(givenName)});
			return;
		 }else{
		 	let lists = Object.keys(response);
		  	let listArray = [];

	  		
			
		    let listString = "";
		    let listSpeech = SSML_SPEAK_START + 'Alright! here are the lists for ' + givenName + '<break time="0.5s" />';

		    lists.forEach(function(list){
				listString = listString + list + '  \n';
				listSpeech = listSpeech + list + '<break time="0.5s" />';
			});
		    
			listSpeech = listSpeech + SSML_SPEAK_END;
			console.log('ListString '+listString);
		    app.ask(app.buildRichResponse()
		      .addSimpleResponse({ speech: listSpeech,
	        displayText: 'Alright! here are the lists for ' + toTitleCase(givenName) })
		      .addBasicCard(app.buildBasicCard(listString) // Note the two spaces before '\n' required for a
		                            // line break to be rendered in the card
		      .setTitle('Lists for '+toTitleCase(givenName)))
		    );
		    return;
	  		}
		 })
	  	.catch(function (err) {
	    	console.log('Error while trying to retrieve data', err);
	  	});

	}

	function stopNotification(app){
		//let userId = app.getUser().userId;
		let userId = 'APhe68FJEPAHW8d9MpRdxOCluodn';
		let uri = DATABASE_URL + 'profiles/' + userId +'/notification.json';
		
		let options ={
  			method: 'PUT',
  			uri: uri,
  			json: "no"
  		}
  		noderequest(options)  
		.then(function (response) {
			let successMsg = 'Okay! You have opted out of notifications.';
			app.ask({speech: successMsg, displayText: successMsg});
		})
		.catch(function (err) {
			console.log('Error while posting data', err);
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
	actionMap.set(ADD_TASK,addItemToList);
	actionMap.set(FETCH_LISTS,readListsForOwner);
	actionMap.set(ADD_PHONENUMBER,addPhoneNumber);
	actionMap.set(INPUT_WELCOME, welcome);
	actionMap.set(STOP_NOTIFICATION, stopNotification);

	app.handleRequest(actionMap);

});