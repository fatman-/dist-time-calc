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
				const apiPointsToCall = depUnixTimes.map(t => {
					return (
						`${config.googMapsApiUrl}?key=${config.googMapsApiKey}` +
						`&origin=${origin}` +
						`&destination=${destination}` +
						`&departure_time=${t}`
					);
				});
				console.log('#%s', dataRowNum);
				console.log(
					'Calculating distance, and duration in traffic, for this Origin—Destination: %s—%s (Highyway: %s)',
					origin,
					destination,
					row.values[5],
				);
				console.log('...for the following times on', tomorrowString, ':');
				console.log(config.departureTimes);
				const additionalRowValues = row.values;
				let distanceValue = null;
				await asyncForEach(apiPointsToCall, async (apiPoint, index) => {
					try {
						const result = await axios.get(apiPoint);
						const { data, status } = result;
						const [route] = data.routes;
						const [leg] = route.legs;
						const { distance, duration_in_traffic } = leg;
						if (!distanceValue) {
							console.log('The distance is: %s', distance.text);
							distanceValue = distance.text;
							additionalRowValues.push(distanceValue);
						}
						console.log(
							'At %s, you should reach your destination in %s',
							config.departureTimes[index],
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
