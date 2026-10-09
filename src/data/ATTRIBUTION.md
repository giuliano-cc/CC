# Data sources

- `worldMapBasemap.png` — the Locations Map block's dot-grid world
  basemap, supplied by the project owner (replacing an earlier
  Natural-Earth-derived version generated in-repo — see this file's git
  history for that generation method, still a valid alternative if this
  image ever needs regenerating/re-licensing).
- `cities.json` — ~24k world cities (population ≥ 15,000), generated
  from [GeoNames](https://www.geonames.org/) data (via the
  `all-the-cities` npm package), licensed under
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — attribution
  required, shown in the Locations Map block itself.
- `countryNames.json` — every ISO 3166 country's English and German
  name, generated from the `i18n-iso-countries` npm package (MIT).

All three are precomputed, static snapshots — regenerate by reinstalling
those npm packages and re-running the equivalent of the generation
scripts described in this file's git history, not by editing the JSON
by hand.
