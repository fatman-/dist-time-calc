const Excel = require('exceljs');
const config = require('./config');
const moment = require('moment');
const axios = require('axios');
const path = require('path');

const asyncForEach = async (arr, callback) => {
	for (let idx = 0, len = arr.length; idx < len; idx += 1) {
		await callback(arr[idx], idx, arr);
	}
};

const createEmptyOutputWorkbook = () => {
	const outputWorkbook = new Excel.Workbook();
	const dateNow = new Date();
	outputWorkbook.creator = 'Distance/Ideal Time Calculator App';
	outputWorkbook.lastModifiedBy = 'Distance/Ideal Time Calculator App';
	outputWorkbook.created = dateNow;
	outputWorkbook.modified = dateNow;
	outputWorkbook.lastPrinted = dateNow;

	const outputWorkSheet1 = outputWorkbook.addWorksheet('Sheet1');

	return { outputWorkbook, outputWorkSheet1 };
};

const makeApiUrls = (apiUrl, apiKey, depTimes, tomorrowString, origin, destination, oriDestSwap = false) => {
	const depUnixTimes = (Array.isArray(depTimes) ? depTimes : [depTimes]).map(
		t => moment(tomorrowString + t).format('X')
	);
	return depUnixTimes.map(t => {
		return oriDestSwap
			? (
				`${apiUrl}?key=${apiKey}` +
				`&origin=${destination}` +
				`&destination=${origin}` +
				`&departure_time=${t}`
			)
			: (
				`${apiUrl}?key=${apiKey}` +
				`&origin=${origin}` +
				`&destination=${destination}` +
				`&departure_time=${t}`
			);
	});
};

const run = async inputWorkbook => {
	console.time('LatLong Pairs Distance/Duration Calculation');
	try {
		await inputWorkbook.xlsx.readFile(path.normalize(config.pathToInputSheet))
	} catch (e) {
		console.log('No input (excel) file found at %s. Please update your config.js', config.pathToInputSheet)
	}

	const inputWorkSheet1 = inputWorkbook.getWorksheet('Sheet1');
	const { outputWorkbook, outputWorkSheet1 } = createEmptyOutputWorkbook();

	const tomorrowString = moment().add('1', 'days').format('ddd, DD MMM YYYY ');
	let apiCalls = 0;

	const rows = []
	inputWorkSheet1.eachRow({ includeEmpty: true }, row => rows.push(row));

	let dataRowNum = 0;
	await asyncForEach(rows, async (row, idx) => {
		const rowNumber = idx + 1;
		// HACK: The following code assumes the structure of the input sheet
		const isDataRow = row.values.length === 6;
		const isHeaderRow = !isDataRow && row.values.length === 14;
		const depTimesRow = isHeaderRow && row.values.includes('Longitude');

		if (depTimesRow) {
			const rowValues = [
				'Longitude',
				'Latitude',
				'Longitude',
				'Latitude',
				'Highway',
				'Distance',
			].concat(config.departureTimes);
			outputWorkSheet1.addRow(rowValues);
		}

		if (isDataRow) {
			dataRowNum += 1;
			if (apiCalls < config.apiRateLimit) {
				const origin = `${row.values[2]},${row.values[1]}`; // 'Latitude,Longitude'
				const destination = `${row.values[4]},${row.values[3]}`;

				const depUnixTimes = config.departureTimes.map(t => moment(tomorrowString + t).format('X'));

				console.log('#%s', dataRowNum);
				const additionalRowValues = row.values;
				const apiPointsToCall = makeApiUrls(
					config.googMapsApiUrl,
					config.googMapsApiKey,
					config.departureTimes,
					tomorrowString,
					origin,
					destination
				);
				const apiPointsToCallWithOriDistSwap = makeApiUrls(
					config.googMapsApiUrl,
					config.googMapsApiKey,
					config.departureTimes,
					tomorrowString,
					origin,
					destination,
					true
				);
				const [firstApiPoint, ...otherApiPointsToCall] = apiPointsToCall;
				const [
					firstApiPointWithOriDistSwap,
					...otherApiPointsToCallWithOriDistSwap
				] = apiPointsToCallWithOriDistSwap;

				console.log(
					'Calculating distance, and duration in traffic, for this Origin—Destination: %s—%s (Highyway: %s)',
					origin,
					destination,
					row.values[5],
				);
				console.log('...for the following time on %s:', tomorrowString.trim());
				console.log(config.departureTimes[0]);
				const result = await axios.get(firstApiPoint);
				console.log('The distance is: %s', result.data.routes[0].legs[0].distance.text);

				console.log(
					'Calculating distance, and duration in traffic, for this Origin—Destination: %s—%s (Highyway: %s)',
					destination,
					origin,
					row.values[5],
				);
				console.log('...for the following time on %s:', tomorrowString.trim());
				console.log(config.departureTimes[0]);
				const resultWithOriDistSwap = await axios.get(firstApiPointWithOriDistSwap);
				console.log('The distance is: %s', resultWithOriDistSwap.data.routes[0].legs[0].distance.text);

				const shouldSwapOriDist = (
					parseInt(result.data.routes[0].legs[0].distance.text.split('km')[0]) >
					parseInt(resultWithOriDistSwap.data.routes[0].legs[0].distance.text.split('km')[0])
				);

				console.log('Swapping origin, destination:', shouldSwapOriDist, '\n');

				const distanceText = shouldSwapOriDist
					? resultWithOriDistSwap.data.routes[0].legs[0].distance.text
					: result.data.routes[0].legs[0].distance.text;
				console.log('The distance is: %s', distanceText);

				const durationInTrafficText = shouldSwapOriDist
					? resultWithOriDistSwap.data.routes[0].legs[0].duration_in_traffic.text
					: result.data.routes[0].legs[0].duration_in_traffic.text;

				additionalRowValues.push(distanceText);
				console.log(
					'At %s, you should reach your destination in %s',
					config.departureTimes[0],
					durationInTrafficText
				);
				additionalRowValues.push(durationInTrafficText);
				apiCalls += 2;

				const [firstDepartureTime, ...restDepartureTimes] = config.departureTimes;

				const [newOrigin, newDestination] = shouldSwapOriDist ? [destination, origin] : [origin, destination];
				console.log(
					'Calculating distance, and duration in traffic, for this Origin—Destination: %s—%s (Highyway: %s)',
					newOrigin,
					newDestination,
					row.values[5],
				);
				console.log('...for the following times on %s:', tomorrowString.trim());
				console.log(restDepartureTimes);
				const newApiPointsToCall = shouldSwapOriDist
					? otherApiPointsToCallWithOriDistSwap
					: otherApiPointsToCall
				await asyncForEach(newApiPointsToCall, async (apiPoint, index) => {
					try {
						const result = await axios.get(apiPoint);
						const { data, status } = result;
						const [route] = data.routes;
						const [leg] = route.legs;
						const { distance, duration_in_traffic } = leg;
						console.log(
							'At %s, you should reach your destination in %s',
							config.departureTimes[index + 1],
							duration_in_traffic.text
						);
						additionalRowValues.push(duration_in_traffic.text);
						apiCalls += 1;
					} catch (e) {
						console.log(e);
					}
				});
				console.log('***\n');
				outputWorkSheet1.addRow(additionalRowValues);
			} else {
				outputWorkSheet1.addRow(row.values);
			}
		}
	});
	console.timeEnd('LatLong Pairs Distance/Duration Calculation');
	return outputWorkbook.xlsx.writeFile(path.normalize(config.pathToOutputSheet));
}

run(new Excel.Workbook());
