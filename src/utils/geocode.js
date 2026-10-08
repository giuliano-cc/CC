// Turns a free-text "City, Country" location string (the same field
// Experience/Education/Selected Works entries already carry) into
// lat/lng coordinates, entirely offline — no geocoding API, no network
// call. Two bundled, lazily-loaded datasets make this possible:
//  - cities.json: ~24k world cities (population ≥ 15,000) as compact
//    [name, countryISO2, lat, lng, population] tuples, derived from
//    GeoNames via the `all-the-cities` npm package.
//  - countryNames.json: every ISO 3166 country's English AND German
//    name (this app's two supported content languages) normalized to
//    lowercase/no-diacritics, mapped to its ISO2 code — so "Vereinigtes
//    Königreich" resolves to the same country as "United Kingdom".
// Both are dynamically imported (not bundled into the main chunk) so
// documents that never use the Map block never pay for ~900KB of city
// data.

let citiesPromise = null
function loadCities() {
  if (!citiesPromise) citiesPromise = import('../data/cities.json').then((m) => m.default)
  return citiesPromise
}

let countryNamesPromise = null
function loadCountryNames() {
  if (!countryNamesPromise) countryNamesPromise = import('../data/countryNames.json').then((m) => m.default)
  return countryNamesPromise
}

// Strips diacritics and case so "Zurich"/"Zürich" or "Munich"/"München"
// compare equal — city names in the dataset are a mix of English
// exonyms (Munich, Rome, Vienna) and native spellings (Zürich, has no
// English-exonym entry at all), and a document's own location text
// could reasonably be typed either way.
function normalize(s) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

// "City, Country" (the shape every Experience/Education/Selected Works
// entry's own `location` field already uses) — country is whatever
// comes after the LAST comma, so a "City, State, Country" value still
// resolves on the country part.
function splitLocation(location) {
  const parts = location.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length === 0) return null
  if (parts.length === 1) return { city: parts[0], country: null }
  return { city: parts[0], country: parts[parts.length - 1] }
}

// Resolves one location string to { lat, lng }, or null if nothing in
// the bundled dataset matches closely enough. When the country part
// resolves to a known ISO2 code, only cities in that country are
// considered; otherwise (or if none match there) falls back to the
// highest-population same-named city worldwide — same idea as how a
// human would disambiguate "is this the London in the UK or in
// Ontario?" without more context.
export async function geocodeLocation(location) {
  if (!location || !location.trim()) return null
  const parsed = splitLocation(location)
  if (!parsed) return null

  const [cities, countryNames] = await Promise.all([loadCities(), loadCountryNames()])
  const normCity = normalize(parsed.city)
  const countryCode = parsed.country ? countryNames[normalize(parsed.country)] : null

  let candidates = cities.filter((c) => normalize(c[0]) === normCity)
  if (candidates.length === 0) return null

  if (countryCode) {
    const inCountry = candidates.filter((c) => c[1] === countryCode)
    if (inCountry.length > 0) candidates = inCountry
  }

  candidates.sort((a, b) => b[4] - a[4])
  const [, , lat, lng] = candidates[0]
  return { lat, lng }
}

// Resolves several location strings at once, de-duplicating repeated
// ones (several entries often share a city) so the dataset is only
// scanned once per distinct location rather than once per entry.
export async function geocodeLocations(locations) {
  const unique = [...new Set(locations.map((l) => l?.trim()).filter(Boolean))]
  const resolved = await Promise.all(unique.map((loc) => geocodeLocation(loc)))
  const byLocation = new Map(unique.map((loc, i) => [loc, resolved[i]]))
  return locations.map((loc) => (loc ? byLocation.get(loc.trim()) ?? null : null))
}
