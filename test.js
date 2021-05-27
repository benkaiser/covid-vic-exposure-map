const fetch = require('node-fetch');
const subscriptionKey = process.env.SUBSCRIPTION_KEY;

async function geocode(result) {
  console.log(result);
  const query = encodeURIComponent(`${result.Site_title} ${result.Site_streetaddress} ${result.Site_state} ${result.Site_postcode}`);
  return fetch(`https://atlas.microsoft.com/search/fuzzy/json?api-version=1.0&subscription-key=${subscriptionKey}&query=${query}&countrySet=AU`)
  .then(result => result.json())
  .then(responseJson => {
    console.log(JSON.stringify(responseJson, undefined, 2));
    const firstResult = responseJson.results[0];
    return {
      ...result,
      ...firstResult.position
    };
  });
}

const site = {
  "_id": 2,
  "Suburb": "Axedale",
  "Site_title": "Axedale Tavern",
  "Site_streetaddress": "105 High Street",
  "Site_state": "VIC",
  "Site_postcode": "3551",
  "Exposure_date_dtm": "2021-05-23",
  "Exposure_date": "23/05/2021",
  "Exposure_time": "11:45am - 1:30pm",
  "Notes": "Case attended function",
  "Added_date_dtm": "2021-05-26",
  "Added_date": "26/05/2021",
  "Added_time": "12:46 am",
  "Advice_title": "Tier 1 - Get tested immediately and quarantine for 14 days from exposure",
  "Advice_instruction": "Anyone who has visited this location during these times must get tested immediately and quarantine for 14 days from the exposure.",
  "Exposure_time_start_24": "11:45:00",
  "Exposure_time_end_24": "13:30:00",
  "lat": -37.28306,
  "lon": 142.93883
};
geocode(site).then(result => console.log(result));