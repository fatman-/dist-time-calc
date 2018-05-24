const getGoogMapsApiKey = (secretConfigPath) => {
	try {
		const secretConfig = require(secretConfigPath);
		return secretConfig.googMapsApiKey
	} catch (e) {
		return ''
	}
};

const getPathToInputSheet = (secretConfigPath) => {
	try {
		const secretConfig = require(secretConfigPath);
		return secretConfig.pathToInputSheet
	} catch (e) {
		return './example.xlsx'
	}
};

const getPathToOutputSheet = (secretConfigPath) => {
	try {
		const secretConfig = require(secretConfigPath);
		return secretConfig.pathToOutputSheet
	} catch (e) {
		return './output.xlsx'
	}
};

const getDepartureTimes = (secretConfigPath) => {
	try {
		const secretConfig = require(secretConfigPath);
		return secretConfig.departureTimes;
	} catch (e) {
		return [
			'09:00:00 +0530',
			'10:00:00 +0530',
			'11:00:00 +0530',
			'18:00:00 +0530',
			'19:00:00 +0530',
			'20:00:00 +0530',
			'23:00:00 +0530',
			'05:00:00 +0530'
		];
	}
};

module.exports = {
	googMapsApiUrl: 'https://maps.googleapis.com/maps/api/directions/json',
	googMapsApiKey: getGoogMapsApiKey('./secret.js'), // REPLACE THIS WITH YOUR API KEY
	pathToInputSheet: getPathToInputSheet('./secret.js'), // YOU CAN REPLACE THIS WITH A CORRESPONDING PATH
	pathToOutputSheet: getPathToOutputSheet('./secret.js'), // YOU CAN REPLACE THIS WITH A CORRESPONDING PATH
	departureTimes: getDepartureTimes('./secret.js'),
	apiRateLimit: recordLimit * getDepartureTimes('./secret.js').length,
}
