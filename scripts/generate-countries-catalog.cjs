/**
 * One-off generator: reads prisma/seed.ts countriesData and writes
 * src/data/seed-countries-catalog.json
 */
const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, '../prisma/seed.ts');
const src = fs.readFileSync(seedPath, 'utf8');

const marker = 'const countriesData: CountryData[] = ';
const start = src.indexOf(marker);
if (start < 0) throw new Error('countriesData not found');

let i = start + marker.length;
while (src[i] === ' ') i++;
if (src[i] !== '[') throw new Error('Expected array');

let depth = 0;
let end = i;
for (; end < src.length; end++) {
  const ch = src[end];
  if (ch === '[') depth++;
  else if (ch === ']') {
    depth--;
    if (depth === 0) {
      end++;
      break;
    }
  }
}

const arrayLiteral = src.slice(i, end);
// eslint-disable-next-line no-eval
const countriesData = eval(arrayLiteral);

function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24);
}

const out = countriesData.map((c) => {
  const countryId = c.code.toLowerCase();
  const regions = (c.regions || []).map((r, ri) => {
    const regionId = `${countryId}-r${ri}-${slug(r.name)}`;
    return {
      id: regionId,
      name: r.name,
      countryId,
      cities: (r.cities || []).map((city, ci) => ({
        id: `${regionId}-c${ci}`,
        name: city.name,
        regionId,
      })),
    };
  });
  return {
    id: countryId,
    name: c.name,
    code: c.code,
    flag: c.code,
    currency: c.currency,
    currencySymbol: c.currencySymbol,
    isActive: true,
    isFeatured: false,
    regions,
  };
});

const outPath = path.join(__dirname, '../src/data/seed-countries-catalog.json');
fs.writeFileSync(outPath, JSON.stringify(out));
console.log(`Wrote ${out.length} countries to ${outPath}`);
