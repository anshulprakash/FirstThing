'use strict';

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').ApiAiApp;
const functions = require('firebase-functions');
const noderequest = require('request-promise');
const admin = require("firebase-admin");

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

	const serverKey = 'AIzaSyBB3VMJTKdH14dg0tbCkByGo0cmpUY1lgo';
	const googleProfileUrl = 'https://people.googleapis.com/v1/people/me?requestMask.includeField=person.emailAddresses%2Cperson.names&key=' + serverKey;
	
	let googleProfileRequestOptions = {
		    method: 'GET',
		    uri: googleProfileUrl,
		    headers: {Authorization: 'Bearer ' + app.getUser().accessToken},
		    json: true
	};

	let serviceAccount = {
	  "type": "service_account",
	  "project_id": "vml-mobi-first-thing",
	  "private_key_id": "2ac9f16390cc3ebd20a2c31ee5056fea228a0bc0",
	  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDGNqz60headjlk\n8OGzGasvqkG5bhfoH7qiGMv3Jrew4vFAip/ZjVlPxoaJtPL1MBz7D1MvA929XKFm\nd7Pr+3Gz6F38gJ5Na+WsIHrXzji7PRosYKtoy5gb/D/by06p21UKXU/2zG8VJo2H\nbtCawwWJpVcjNBCrs6oeekJqm/KS3V9ZlWF7UTcVwgzgm5deKTVODyrMJBFD5FKD\nPWejC9urVC7g+LIKc6sh66jxZj+ifshhCOPGH8+6/3d3JgHnVSFpoBjxuZwvwA+d\nOqzf1H25nF/7w0snWo9Vf3e38gJSJFqyfnYOw75ri8e5P7oktjj/7e8Lllr7n1MW\niWxPf+53AgMBAAECggEAJf8HK9GoSqjNGcd/TIjoIuv9S2GKXanvafFc8BTQ86yd\nWKT6PYb2Du/cjHtOc6f0dkAazxFrqUgffHgH2n3J7xXlJmk1b1v2nAdh5QqYH3R4\nFve1BBK7Juo1B5oyiycLZ0A5+vJ3fNN2H/cjL/egkSFL0ejCJVf8jXkcUDlyx6on\nn0JHMtZs74Zhzn4ROGgXuNf2Z9I6G8vY+ACIrZoFoDQnTGwcYsRkHBcjatuHYoww\nt3HCfJKFpCTmYk4r4wqa4cMySMhGYxc+IZse3/sVbm55HHj9XfllwworUan91Rcc\nn/pRSEhMbwayavrQPmuYK0Mec7WEGnGUwJyD+PfG8QKBgQDnTzIerWrgYP8waoai\ndFIlZ/k9FDh8AXufQECQjvPItOLb84K1CpQW4jh7E3wdMEd5dGGAFCp/MtDBXUXO\nX7c7cbaV5DSFz9UtzMe8EAuSxXepuEDvfiOXm65M8yP5TgNxixsNPpLk0eFppn5/\nFTLa+nUQUXiEckPZGBlJNFmjGQKBgQDbXxkjr5DMpqIbrJf9EzhSAQfnZ+f1Eq+t\n3WBO6iSu2Cqf9mC34dd95869QxGPR52jQM1qNYjH3kP5dtiYvU0K8hpgMAxJjhRi\n2K0g4TAZm3Fmq8xUtovYMXlVZscTkeUB3qR9PUymgfwCoGSHojulxdP2XkGf2D6J\namQ5koZgDwKBgQCdGk0QSPiuLTMlzzRiYl7oyRWfRnyWvOsZ3qn7hRxO1Yy/l0TP\ncb/jSwLRlQpXSNNCyqjuNMQoYHso2hDvelMZLMK2S6jguagw00VVlhBGP5hmzZ5N\nC39hGXvpB7sHONVd6P0WocljYKmY+FwyNFO2JyYbTzprurAaYyPJdKTtAQKBgBD3\nqQ0ejjeWB+HWFqdnbirBk6ftXH6TJG1xOvq/l3jClYFr4A049Z7yaAYxgtEvO90d\nrQWzAFJdOaq464Xc1nGrSij4bmreB2uh0LpDUKIaaMoFLbe7qtNc+EKHwYwc87aS\nTuy06hHS6fgWCdCH1s86nutmXPMNGcEtLnVZhPU3AoGAZ5hOmqetDvTbVijZHryt\nL+rjcPDTsEetn4BUAxhoasdAbL7XDbnuFH893jm4Ted1ciUj50uFxvRlCiY97yT/\n18grE1whczQGAcnZrDQSZxLT8hUljuibkUCz3VmRj21wvWXicaJwyCmuVlAnKtXM\no8R8oez5gM40vZS+fqsva9w=\n-----END PRIVATE KEY-----\n",
	  "client_email": "firebase-adminsdk-el5dl@vml-mobi-first-thing.iam.gserviceaccount.com",
	  "client_id": "104918217062942236554",
	  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
	  "token_uri": "https://accounts.google.com/o/oauth2/token",
	  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
	  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-el5dl%40vml-mobi-first-thing.iam.gserviceaccount.com"
	};

	function helpUser (app){
		
		let helpString = 'OK Google, ask FirstThing to start a list.  \nAdd \'pick up dry cleaning\' to my work list.  \nWhat\'s on my work list?  \nWhat lists do I have?  \nCreate a new list for Preston called home.  \nAdd \'make bed\' to Preston\'s home list as a daily task.  \nWhat\'s on Preston\'s home list?  \nStop text notifications.' ;
	    let helpSpeech = SSML_SPEAK_START + 'To use this skill, you can say things like:'+ '<break time="0.5s" />' +'OK Google, ask FirstThing to start a list. Add \'pick up dry cleaning\' to my work list. What\'s on my work list? What lists do I have? Create a new list for Preston called home. Add \'make bed\' to Preston\'s home list as a daily task. What\'s on Preston\'s home list? Or, stop text notifications.'+ SSML_SPEAK_END;

	    app.ask(app.buildRichResponse()
	       .addSimpleResponse({ speech: helpSpeech, displayText: 'To use this skill, you can say things like:'})
	       .addBasicCard(app.buildBasicCard(helpString))
	    );
	}


	function welcome (app) {
		console.log('inside welcome');

		admin.credential.cert(serviceAccount).getAccessToken().then(function(response){
			let DATABASE_ACCESS_TOKEN = "?access_token="+response.access_token;
			console.log('DATABASE_ACCESS_TOKEN: '+DATABASE_ACCESS_TOKEN);
			app.data.accessToken = DATABASE_ACCESS_TOKEN;

			noderequest(googleProfileRequestOptions)
		    .then(function (profileResponse) {
		        if (profileResponse) {
		            const personId = profileResponse.resourceName.split('/')[1];
		            console.log('person_id: '+personId);
		            app.data.personId = personId;

		            let userId = app.data.personId;
					let profileUri = DATABASE_URL + 'profiles/' + userId +'.json' + DATABASE_ACCESS_TOKEN;
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
							//app.setContext('defaultwelcomeintent-followup',0);
							app.setContext('phone-number-added',1);
							message = "Welcome to FirstThing. You can create to-do lists for yourself or any person, add tasks, and read them. Ready to start a guided tour?";
						}
						console.log(app.getContexts());
						app.ask({speech: message, displayText: message});
					})
					.catch(function (err) {
						console.error(err);
					});
		        }
		    })
		    .catch(function (err) {
		        console.error(err);
		    });
		}).catch(function (err) {
			console.error(err);
		});

		return;
	}
	//function to start notifications or to add phone number
	function addPhoneNumber (app) {

		if(!app.data.accessToken){
			admin.credential.cert(serviceAccount).getAccessToken().then(function(response){
				app.data.accessToken = "?access_token="+response.access_token;
				console.log('DATABASE_ACCESS_TOKEN: '+app.data.accessToken);
				addPhoneNumberFetchProfile();
			}).catch(function (err) {
				       console.error(err);
			});
		}else{
			addPhoneNumberFetchProfile();
		}
		
		function addPhoneNumberFetchProfile(){
			if(!app.data.personId){
				noderequest(googleProfileRequestOptions)
			    .then(function (profileResponse) {
			        if (profileResponse) {
			        	const personId = profileResponse.resourceName.split('/')[1];
			            console.log('person_id: '+personId);
			            app.data.personId = personId;
			            subAddPhoneNumber();
			            }
			    })
			    .catch(function (err) {
			        console.error(err);
			    });
			}else{
				subAddPhoneNumber();
			}
		}
		
		function subAddPhoneNumber(){
			let DATABASE_ACCESS_TOKEN = app.data.accessToken;
			let userId = app.data.personId;
			let phoneNumber = app.getArgument(PHONE_NUMBER);
			let postUri = DATABASE_URL + 'profiles/' + userId +'.json'+ DATABASE_ACCESS_TOKEN;
			let isWelcomeFlow = app.getContext('add-phone-number') == null ? false : true;
			let successMsg = 'Got it. I\'ll send you a text to '+phoneNumber+' when your users access their lists. You can cancel this at any time by telling me to stop notifications.';
			let successMsgSpeech = 'Got it. I\'ll send you a text to '+phoneNumber.split("").join(" ")+' when your users access their lists. You can cancel this at any time by telling me to stop notifications.';
			if(isWelcomeFlow){
				successMsg = successMsg + ' Ready to start a guided tour?';
			}
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
				app.ask(app.buildRichResponse()
	       					.addSimpleResponse({speech: successMsgSpeech, displayText: successMsg}))
			})
			.catch(function (err) {
				console.error(err);
			});
			
			return;
		}
		
	}

	//gets tasks for a lists for a user
	function readList (app) {
		
		if(!app.data.accessToken){
			admin.credential.cert(serviceAccount).getAccessToken().then(function(response){
				app.data.accessToken = "?access_token="+response.access_token;
				console.log('DATABASE_ACCESS_TOKEN: '+app.data.accessToken);
				readListFetchProfile();
			}).catch(function (err) {
				       console.error(err);
			});
		}else{
			readListFetchProfile();
		}

		function readListFetchProfile(){
			if(!app.data.personId){
				noderequest(googleProfileRequestOptions)
			    .then(function (profileResponse) {
			        if (profileResponse) {
			        	const personId = profileResponse.resourceName.split('/')[1];
			            console.log('person_id: '+personId);
			            app.data.personId = personId;
			            subReadlist();
			            }
			    })
			    .catch(function (err) {
			        console.error(err);
			    });
			}else{
				subReadlist();
			}
		}

		function subReadlist(){
			console.log('inside readList and personId is: '+ app.data.personId);
			let DATABASE_ACCESS_TOKEN = app.data.accessToken;
			let userId = app.data.personId;
			let givenName = app.getArgument(GIVEN_NAME).toLowerCase();
			let listName = app.getArgument(LIST_NAME).toLowerCase();
			let sendNotification = false;
			console.log(userId);
			console.log(givenName);
			console.log(listName);

			let getUri = DATABASE_URL + userId + '.json'+ DATABASE_ACCESS_TOKEN;
			let options = {  
			  method: 'GET',
			  uri: getUri,
			  json: true
			}
			noderequest(options)  
			  .then(function (response) { 
			  	console.log('response from database: '+ JSON.stringify(response));

			  	if(response==null){
			  		app.ask({speech: 'Sorry! There is no list for '+ givenName,
		      			displayText: 'Sorry! There is no list for '+ toTitleCase(givenName)});

			  		return;
			  	}else{
			  		var people = Object.keys(response);
			  	}

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
			    let taskListSpeech = SSML_SPEAK_START + 'Alright! here are the tasks for '+givenName+'\'s '+listName+' list'+ '<break time="0.5s" />';

			    taskArray.forEach(function(task){
					taskListString = taskListString + task + '  \n';
					taskListSpeech = taskListSpeech + task + '<break time="0.5s" />';
				});
				taskListSpeech = taskListSpeech + SSML_SPEAK_END;
				console.log('debugggg '+taskListString);
			    app.ask(app.buildRichResponse()
			       .addSimpleResponse({ speech: taskListSpeech, displayText: 'Alright! here are the tasks for '+toTitleCase(givenName) +'\'s '+listName+' list'})
			       .addBasicCard(app.buildBasicCard(taskListString) 
			       .setTitle(toTitleCase(givenName)+'\'s '+listName+' list'))
			    );
			    
			    let profileUri = DATABASE_URL + 'profiles/' + userId +'.json'+ DATABASE_ACCESS_TOKEN;
			
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
									console.error(err);
							  });
						}
				    }
				})
				.catch(function (err) {
					console.error(err);
				});
			    
			    return;
			  })
			  .catch(function (err) {
			     console.error(err);
			  });
		}

	}
	//This function is used to create lists
	function createList (app) {
		if(!app.data.accessToken){
			admin.credential.cert(serviceAccount).getAccessToken().then(function(response){
				app.data.accessToken = "?access_token="+response.access_token;
				console.log('DATABASE_ACCESS_TOKEN: '+app.data.accessToken);
				createListFetchProfile();
			}).catch(function (err) {
				       console.error(err);
			});
		}else{
			createListFetchProfile();
		}

		function createListFetchProfile(){
			if(!app.data.personId){
				noderequest(googleProfileRequestOptions)
			    .then(function (profileResponse) {
			        if (profileResponse) {
			        	const personId = profileResponse.resourceName.split('/')[1];
			            console.log('person_id: '+personId);
			            app.data.personId = personId;
			            subCreateList();
			            }
			    })
			    .catch(function (err) {
			        console.error(err);
			    });
			}else{
				subCreateList();
			}
		}
		
		function subCreateList(){
			console.log('inside createList and personId is: '+ app.data.personId);
			let DATABASE_ACCESS_TOKEN = app.data.accessToken;
			let userId = app.data.personId;
			let givenName = app.getArgument(GIVEN_NAME).toLowerCase();
			let listName = app.getArgument(LIST_NAME).toLowerCase();

			let createListSuccessTxt = 'Absolutely! The list \''+listName+'\' has been created for '+toTitleCase(givenName);
			let createListSuccessSpeech = 'Absolutely! The list '+listName+' has been created for '+givenName;
			let errorMsg = 'There is already a list by the name \''+listName+'\' for '+toTitleCase(givenName);
			let errorSpeech = 'There is already a list by the name '+listName+' for '+givenName;

			let getUri = DATABASE_URL + userId + '.json'+ DATABASE_ACCESS_TOKEN;
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
						console.error(err);
					 });
			  	}else{
			  		let people = Object.keys(response);

			  		//givenName does not exist under the userId
			  		if(people.indexOf(givenName) == -1){
			  			console.log('givenName does not have any list');
			  			let putUri = DATABASE_URL + userId + '/' + givenName +'.json'+ DATABASE_ACCESS_TOKEN;
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
					    	console.error(err);
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
					  		let putUri = DATABASE_URL + userId + '/' + givenName + '/' + listName +'.json'+ DATABASE_ACCESS_TOKEN;
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
						    	console.error(err);
						  	});
					  	}
			  		}

			  	}
			 })
			  .catch(function (err) {
			    console.error(err);
			 });

			 return; 
		}

	}

	function addItemToList (app) {
		if(!app.data.accessToken){
			admin.credential.cert(serviceAccount).getAccessToken().then(function(response){

				app.data.accessToken = "?access_token="+response.access_token;
				console.log('DATABASE_ACCESS_TOKEN: '+app.data.accessToken);
				addItemtoListFetchProfile();
			}).catch(function (err) {
				       console.error(err);
			});
		}else{
			addItemtoListFetchProfile();
		}
		
		function addItemtoListFetchProfile (){
			if(!app.data.personId){
				noderequest(googleProfileRequestOptions)
			    .then(function (profileResponse) {
			        if (profileResponse) {
			        	const personId = profileResponse.resourceName.split('/')[1];
			            console.log('person_id: '+personId);
			            app.data.personId = personId;
			            subAddItemToList();
			            }
			    })
			    .catch(function (err) {
			        console.error(err);
			    });
			}else{
				subAddItemToList();
			}
		}
		

		function subAddItemToList () {
			console.log('inside addItemToList and personId is: '+ app.data.personId);
			let DATABASE_ACCESS_TOKEN = app.data.accessToken;
			let userId = app.data.personId;
			let givenName = app.getArgument(GIVEN_NAME).toLowerCase();
			let listName = app.getArgument(LIST_NAME).toLowerCase();
			let listItem = app.getArgument(LIST_ITEM).toLowerCase();
			let recurringValue = app.getArgument(RECURRING_VALUE);

			recurringValue = recurringValue ? recurringValue.toLowerCase() : "no";
			console.log('recurring_value= '+recurringValue);

			let itemAddedMsg = recurringValue == "no" ? 'Got it. \''+listItem+ '\' added to '+toTitleCase(givenName)+'\'s '+listName+' list' : 'Got it. \''+listItem+'\' will repeat '+recurringValue+' for '+toTitleCase(givenName);
			let itemAddedMsgGuided = 'Perfect! To read this list you can say \'What\'s on '+ toTitleCase(givenName)+ '\'s '+listName+' list?\'';
			let addItemToListError = '\''+listItem +'\''+ ' is already there in '+toTitleCase(givenName)+'\'s '+ listName +' list';
			
			let isGuidedTour = app.getContext(GUIDED_TOUR) ? true : false;
			console.log('isGuidedTour'+isGuidedTour);
			//remove the guided tour context
			app.setContext(GUIDED_TOUR,0);

			

			let getUri = DATABASE_URL + userId + '.json'+ DATABASE_ACCESS_TOKEN;
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
						console.error(err);
					});
			  	}else{
			  		let people = Object.keys(response);
			  		//If the givenName is not there under the userId
			  		if(people.indexOf(givenName) == -1){
			  			console.log('If the givenName is not there under the userId');
			  			//create a list with listName for givenName and add listItem to it
			  			let putUri = DATABASE_URL + userId + '/' + givenName +'.json'+ DATABASE_ACCESS_TOKEN;
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
					    	console.error(err);
					  	});
			  		}else{
			  			let lists = Object.keys(response[givenName]);
			  			//if there is no list by the name of listName
			  			if(lists.indexOf(listName) == -1){
			  				console.log('if there is no list by the name of listName');
			  				//add listName under givenName and add listItem to it
			  				let putUri = DATABASE_URL + userId + '/' + givenName + '/' + listName +'.json'+ DATABASE_ACCESS_TOKEN;
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
						    	console.error(err);
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
			  					let putUri = DATABASE_URL + userId + '/' + givenName + '/' + listName +'/'+ count.toString() +'.json'+ DATABASE_ACCESS_TOKEN;
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
						    		console.error(err);
						  		});	
			  				}
			  			}
			  		}
			  	}
			})
			  .catch(function (err) {
			    console.error(err);
			});

			return;
		} 
	}

	function readListsForOwner (app) {
		if(!app.data.accessToken){
			admin.credential.cert(serviceAccount).getAccessToken().then(function(response){

				app.data.accessToken = "?access_token="+response.access_token;
				console.log('DATABASE_ACCESS_TOKEN: '+app.data.accessToken);
				readListsForOwnerFetchProfile();
			}).catch(function (err) {
				       console.error(err);
			});
		}else{
			readListsForOwnerFetchProfile();
		}

		function readListsForOwnerFetchProfile(){
			if(!app.data.personId){
				noderequest(googleProfileRequestOptions)
			    .then(function (profileResponse) {
			        if (profileResponse) {
			        	const personId = profileResponse.resourceName.split('/')[1];
			            console.log('person_id: '+personId);
			            app.data.personId = personId;
			            subReadListforOwner();
			            }
			    })
			    .catch(function (err) {
			        console.error(err);
			    });
			}else{
				subReadListforOwner();
			}

		}
		
		function subReadListforOwner(){
			console.log('inside addItemToList and personId is: '+ app.data.personId);
			let DATABASE_ACCESS_TOKEN = app.data.accessToken;
			let userId = app.data.personId;
			let givenName = app.getArgument(GIVEN_NAME).toLowerCase();
			let getUri = DATABASE_URL + userId + '/' + givenName + '.json'+ DATABASE_ACCESS_TOKEN;
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
		    	console.error(err);
		  	});
		}

	}

	function stopNotification(app){
		if(!app.data.accessToken){
			admin.credential.cert(serviceAccount).getAccessToken().then(function(response){
				app.data.accessToken = "?access_token="+response.access_token;
				console.log('DATABASE_ACCESS_TOKEN: '+app.data.accessToken);
				stopNotificationFetchProfile();
			}).catch(function (err) {
				       console.error(err);
			});
		}else{
			stopNotificationFetchProfile();
		}

		function stopNotificationFetchProfile(){
			if(!app.data.personId){
				noderequest(googleProfileRequestOptions)
			    .then(function (profileResponse) {
			        if (profileResponse) {
			        	const personId = profileResponse.resourceName.split('/')[1];
			            console.log('person_id: '+personId);
			            app.data.personId = personId;
			            subStopNotification();
			            }
			    })
			    .catch(function (err) {
			        console.error(err);
			    });
			}else{
				subStopNotification();
			}
		}
		
		function subStopNotification(){
			let DATABASE_ACCESS_TOKEN = app.data.accessToken;
			let userId = app.data.personId;
			let uri = DATABASE_URL + 'profiles/' + userId +'/notification.json'+ DATABASE_ACCESS_TOKEN;
			
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
				console.error(err);
			});

			return;
		}
	}
	//lists all users for a google account
	function listUsers(){
		if(!app.data.accessToken){
			admin.credential.cert(serviceAccount).getAccessToken().then(function(response){

				app.data.accessToken = "?access_token="+response.access_token;
				console.log('DATABASE_ACCESS_TOKEN: '+app.data.accessToken);
				listUsersFetchProfile();
			}).catch(function (err) {
				       console.error(err);
			});
		}else{
			listUsersFetchProfile();
		}

		function listUsersFetchProfile(){
			if(!app.data.personId){
				noderequest(googleProfileRequestOptions)
			    .then(function (profileResponse) {
			        if (profileResponse) {
			        	const personId = profileResponse.resourceName.split('/')[1];
			            console.log('person_id: '+personId);
			            app.data.personId = personId;
			            sublistUsers();
			            }
			    })
			    .catch(function (err) {
			        console.error(err);
			    });
			}else{
				sublistUsers();
			}

		}
		
		function sublistUsers(){
			console.log('inside list users and personId is: '+ app.data.personId);
			let DATABASE_ACCESS_TOKEN = app.data.accessToken;
			let userId = app.data.personId;
			let getUri = DATABASE_URL + userId + '.json'+ DATABASE_ACCESS_TOKEN;
			const getOptions = {  
			  method: 'GET',
			  uri: getUri,
			  json: true
			}
			noderequest(getOptions)  
		  	.then(function (response) {
		  	
		  	//If there are no lists for the user
			 if(response == null){
			 	app.ask({speech: 'There are currently no users.',
				      	displayText: 'There are currently no users.'});
				return;
			 }else{
			 	let users = Object.keys(response);
			  	let usersArray = [];

			    let usersString = "";
			    let usersSpeech = SSML_SPEAK_START + 'Alright! here are the name of users for your account' + '<break time="0.5s" />';

			    users.forEach(function(user){
					usersString = usersString + user + '  \n';
					usersSpeech = usersSpeech + user + '<break time="0.5s" />';
				});
			    
				usersSpeech = usersSpeech + SSML_SPEAK_END;
				console.log('usersString '+usersString);
			    app.ask(app.buildRichResponse()
			      .addSimpleResponse({ speech: usersSpeech,
		        displayText: 'Alright! here are the name of users for your account'})
			      .addBasicCard(app.buildBasicCard(usersString)
			      .setTitle('Name of users for your account: '))
			    );
			    return;
		  		}
			 })
		  	.catch(function (err) {
		    	console.error(err);
		  	});
		}
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

	function exit (app) {
	    app.tell('Thank you for using FirstThing.');
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
	actionMap.set('help.user',helpUser);
	actionMap.set('exit',exit);
	actionMap.set('list.users',listUsers);
	app.handleRequest(actionMap);

});