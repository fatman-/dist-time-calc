const path = require('path');

const getGoogMapsApiKey = (secretConfigPath) => {
	try {
		const secretConfig = require(path.normalize(secretConfigPath));
		return secretConfig.googMapsApiKey;
	} catch (e) {
		return '';
	}
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

const calcLimit = 4;

module.exports = {
	googMapsApiUrl: 'https://maps.googleapis.com/maps/api/directions/json',
	googMapsApiKey: getGoogMapsApiKey('./secret.js'), // REPLACE THIS WITH YOUR API KEY
	pathToInputSheet: './example.xlsx', // YOU CAN REPLACE THIS WITH A CORRESPONDING PATH, TRY './example.xlsx'
	pathToOutputSheet: './output.xlsx', // YOU CAN REPLACE THIS WITH A CORRESPONDING PATH, TRY './output.xlsx'
	departureTimes,
	apiRateLimit: calcLimit * departureTimes.length,
}
