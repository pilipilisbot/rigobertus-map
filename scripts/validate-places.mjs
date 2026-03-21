import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const placesPath = path.join(root, 'places.json');
const schemaPath = path.join(root, 'schema', 'places.schema.json');

const places = JSON.parse(fs.readFileSync(placesPath, 'utf8'));
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

const errors = [];

if (!validate(places)) {
  for (const err of validate.errors ?? []) {
    const where = err.instancePath || '/';
    errors.push(`schema ${where}: ${err.message}`);
  }
}

const ids = new Map();
for (const [idx, place] of places.entries()) {
  const pointer = `/${idx}`;

  if (ids.has(place.id)) {
    errors.push(`duplicate id '${place.id}' at ${pointer}, first seen at /${ids.get(place.id)}`);
  } else {
    ids.set(place.id, idx);
  }

  const lat = place.lat;
  const lng = place.lng;

  if ((lat === null) !== (lng === null)) {
    errors.push(`coordinates ${pointer}: lat/lng must be both numbers or both null`);
  }

  if (typeof lat === 'number' && (lat < -90 || lat > 90)) {
    errors.push(`coordinates ${pointer}: lat ${lat} out of range [-90, 90]`);
  }

  if (typeof lng === 'number' && (lng < -180 || lng > 180)) {
    errors.push(`coordinates ${pointer}: lng ${lng} out of range [-180, 180]`);
  }

  for (const key of ['externalRating', 'rigobertusRating']) {
    const value = place[key];
    if (value !== null && typeof value === 'number' && (value < 0 || value > 5)) {
      errors.push(`rating ${pointer}/${key}: ${value} out of range [0, 5]`);
    }
  }
}

if (errors.length > 0) {
  console.error(`❌ places.json validation failed with ${errors.length} error(s):`);
  for (const e of errors) {
    console.error(`- ${e}`);
  }
  process.exit(1);
}

console.log('✅ places.json validation passed');
