// Twilio Credentials
const accountSid = 'ACa280ebee55197ee9778f56bad859e768';
const authToken = '11a1b1dd4549e9482aa369506767da06';

// require the Twilio module and create a REST client
var twilio = require('twilio');
var client = twilio(accountSid, authToken);

client.messages
  .create({
    to: '+19797211879',
    from: '+18163071770',
    body: 'This is the ship that made the Kessel Run in fourteen parsecs?',
  })
  .then((message) => console.log(message.sid))
  .catch(function (err) {
		console.log('Error while trying to retrieve data', err);
  });	

