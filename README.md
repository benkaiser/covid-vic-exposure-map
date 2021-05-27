# Covid Exposure Map Victoria

The gov website didn't have a map, so I made one.
This site uses the same API directly as the [source data](https://www.coronavirus.vic.gov.au/exposure-sites) but geocodes using the Azure Maps API.

Because of the automated nature of the geocoding, it may not be 100% accurate, double check the address of the location.

Currently the scrape is run manually, the plan is to automate using GitHub Actions running every 10 minutes.