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

async function geocode(result) {
  if (result.lat && result.lon) {
    console.log('Skipping already geocoded: ' + result._id);
    return Promise.resolve(result);
  }

  console.log('Geocoding: ' + result._id);
  const query = encodeURIComponent(`${result.Site_streetaddress} ${result.Site_state} ${result.Suburb === 'Bus Route' ? '' : result.Suburb} ${result.Site_postcode === null ? '' : result.Site_postcode} Australia`);
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

function overrideLookup(freshItem) {
  return overrides.filter(override => itemsEqualGeo(override, freshItem))[0];
}

function itemsEqualGeo(item1, item2) {
  return item1.Suburb === item2.Suburb &&
  item1.Site_streetaddress === item2.Site_streetaddress &&
  item1.Site_state === item2.Site_state &&
  item1.Site_postcode === item2.Site_postcode;
}

fetch('https://www.coronavirus.vic.gov.au/sdp-ckan?resource_id=afb52611-6061-4a2b-9110-74c920bede77&limit=10000')
.then(response => response.json())
.then(async (jsonResponse) => {
  console.log(jsonResponse);
  const freshResults = jsonResponse.result.records.map(item => {
    if (existingDataLookup[item._id] && itemsEqualGeo(existingDataLookup[item._id], item)) {
      return {
        ...existingDataLookup[item._id],
        ...item,
      };
    }
    return item;
  }).map(item => {
    const override = overrideLookup(item);
    if (override) {
      return {
        ...item,
        ...override
      };
    }
    return item;
  });
  const resultsGeocoded = [];
  for (let x = 0; x < freshResults.length; x++) {
    try {
      geocodedResult = await geocode(freshResults[x]);
      resultsGeocoded.push(geocodedResult);
    } catch (e) {
      console.log(freshResults[x]);
      console.log(e);
    }
  }
  const stringified = JSON.stringify(resultsGeocoded);
  fs.writeFileSync('./data.json', JSON.stringify(resultsGeocoded, undefined, 2));
  fs.writeFileSync('./data.js', 'var results = ' + stringified + ';');
  fs.writeFileSync('./updateTime.js', 'var updateTime = "' + moment().tz("Australia/Melbourne").format("MMM Do, h:mm a")  + '";');
});