// this file was needed for a one-time conversion and isn't really needed anymore

const fs = require('fs');

const existingData = JSON.parse(fs.readFileSync('./data.json'));
const existingDataLookup = {};
existingData.forEach(item => existingDataLookup[item._id] = item);
const overrides = JSON.parse(fs.readFileSync('./overrides.json'));
const overridesLookup = {};
overrides.forEach(item => overridesLookup[item._id] = item);

overrides.forEach((override) => {
  const dataItem = existingDataLookup[override._id];
  override.Suburb = dataItem.Suburb;
  override.Site_streetaddress = dataItem.Site_streetaddress;
  override.Site_state = dataItem.Site_state;
  override.Site_postcode = dataItem.Site_postcode;
  delete override._id;
});

fs.writeFileSync('./overrides.json', JSON.stringify(overrides, undefined, 2));
