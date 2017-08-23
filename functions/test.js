var response = {
    "ian": {
        "home": [
            "__empty_list"
        ],
        "work": [
            "__empty_list"
        ]
    },
    "preston": {
        "home": [
            {
                "recurring": "no",
                "task": "get milk"
            },
            {
                "recurring": "daily",
                "task": "feed the cat"
            },
            {
                "recurring": "monday, wednesday, friday",
                "task": "take the girls to dance practice"
            }
        ],
        "work": [
            "__empty_list"
        ]
    }
};


let givenName = "'\"Pres\"ton'";
let listName = 'home';
//let people = Object.keys(response);
//let lists = Object.keys(response[givenName]);
//let tasks = Object.keys(response[givenName][listName]);

console.log(givenName.toLowerCase().replace(/[']/g, ''))
/*
let taskArray = [];
tasks.forEach(function(task){
	let value = response[givenName][listName][task]['task'];
	
	taskArray.push(value);
});
var listItem = 'take the girls to dance practice';

taskArray.forEach(function(task){
	//console.log(task);
});

var books = {[givenName]: 
		  		{[listName]: [{
            				"recurring": "no",
            				"task": listItem
        					}] 
        		}
 			}
// console.log(JSON.stringify(books));
//console.log(people);
//console.log(lists);
console.log(JSON.stringify(tasks));
//console.log(taskArray)

var validator = require('validator');
console.log(validator.isMobilePhone('797211879','en-US'))
resourceName = 'people/123123123123';

console.log(resourceName.split('/')[1]);
*/
