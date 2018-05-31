const path = require('path');
let secretConfig;
try {
	secretConfig = require('./secret');
} catch (e) {
	console.log(e);
	secretConfig = '';
}

const departureTimes = [
	'09:00:00 +0530',
	'10:00:00 +0530',
	'11:00:00 +0530',
	'18:00:00 +0530',
	'19:00:00 +0530',
	'20:00:00 +0530',
	'23:00:00 +0530',
	'05:00:00 +0530'
];

const calcLimit = 4; // Maximum no. of lat long pairs to perform calculations on

module.exports = {
	googMapsApiUrl: 'https://maps.googleapis.com/maps/api/directions/json',
	googMapsApiKey: secretConfig && secretConfig.googMapsApiKey || '', // REPLACE '' WITH YOUR API KEY
	pathToInputSheet: './example.xlsx', // YOU CAN REPLACE './example.xlsx' WITH A CORRESPONDING PATH
	pathToOutputSheet: './output.xlsx', // YOU CAN REPLACE './output.xlsx' WITH A CORRESPONDING PATH
	departureTimes,
	apiRateLimit: calcLimit * departureTimes.length,
}
