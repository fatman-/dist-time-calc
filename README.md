# Instructions

1. Make sure you have node (v8+), and git installed on your computer
2. Clone this project from a command line (`git clone git@github.com:fatman-/dist-time-calc.git`)
3. Run `npm install` to install required packages
4. Replace `getGoogMapsApiKey('./secret.js')` in `config.js` file with your Google Maps API key
5. Replace other config items (`pathToInputSheet`, `pathToOutputSheet`, `departureTimes`, etc...) as per your needs.

```js
module.exports = {
	...
	googMapsApiKey: 'YOUR_API_KEY'
	pathToInputSheet: './relative/path/to/inputSheet',
	pathToInputSheet: './relative/path/to/outputSheet',
}
```
