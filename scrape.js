const fs = require('fs');
const fetch = require('node-fetch');
var moment = require('moment-timezone');
const subscriptionKey = process.env.SUBSCRIPTION_KEY;

if (!subscriptionKey) {
  throw new Error('No SUBSCRIPTION_KEY passed');
}

const existingData = JSON.parse(fs.readFileSync('./data.json'));
const existingDataLookup = {};
existingData.forEach(item => existingDataLookup[item._id] = item);
const overrides = JSON.parse(fs.readFileSync('./overrides.json'));
const overridesLookup = {};
overrides.forEach(item => overridesLookup[item._id] = item);

async function geocode(result) {
  if (result.lat && result.lon) {
    console.log('Skipping already geocoded: ' + result._id);
    return Promise.resolve(result);
  }

  console.log('Geocoding: ' + result._id);
  const query = encodeURIComponent(`${result.Site_streetaddress} ${result.Site_state} ${result.Site_postcode} Australia`);
  return fetch(`https://atlas.microsoft.com/search/address/json?api-version=1.0&subscription-key=${subscriptionKey}&query=${query}&countrySet=AU`)
  .then(result => result.json())
  .then(responseJson => {
    const firstResult = responseJson.results[0];
    return {
      ...result,
      ...firstResult.position
    };
  });
}

fetch('https://www.coronavirus.vic.gov.au/sdp-ckan?resource_id=afb52611-6061-4a2b-9110-74c920bede77&limit=10000')
.then(response => response.json())
.then(jsonResponse => {
  console.log(jsonResponse);
  const freshResults = jsonResponse.result.records.map(item => {
    if (existingDataLookup[item._id]) {
      return existingDataLookup[item._id];
    }
    return item;
  }).map(item => {
    if (overridesLookup[item._id]) {
      return {
        ...item,
        ...overridesLookup[item._id]
      };
    }
    return item;
  });
  Promise.all(freshResults.map(result => geocode(result)))
  .then(resultsGeocoded => {
    const stringified = JSON.stringify(resultsGeocoded);
    fs.writeFileSync('./data.json', JSON.stringify(resultsGeocoded, undefined, 2));
    fs.writeFileSync('./data.js', 'var results = ' + stringified + ';');
    fs.writeFileSync('./updateTime.js', 'var updateTime = "' + moment().tz("Australia/Melbourne").format("MMM Do, h:mm a")  + '";');

  });
});