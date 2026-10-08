import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dayPeriod, celestialPosition, greeting } from '../src/sky.js';

const at = (h, m = 0) => new Date(2026, 9, 8, h, m);

test('le ciel suit l’heure : matin, midi, soir, nuit', () => {
  assert.equal(dayPeriod(at(7)), 'morning');
  assert.equal(dayPeriod(at(10, 59)), 'morning');
  assert.equal(dayPeriod(at(13)), 'noon');
  assert.equal(dayPeriod(at(18)), 'evening');
  assert.equal(dayPeriod(at(22)), 'night');
  assert.equal(dayPeriod(at(3)), 'night');
  assert.equal(greeting(at(8)), 'Bonjour');
  assert.equal(greeting(at(23)), 'Bonne nuit');
});

test('le soleil se lève à gauche, culmine vers midi et se couche à droite ; puis la lune', () => {
  const rise = celestialPosition(at(6, 30));
  const noon = celestialPosition(at(13, 30));
  const set = celestialPosition(at(20, 30));
  assert.equal(rise.body, 'sun');
  assert.ok(rise.x < noon.x && noon.x < set.x);
  assert.ok(noon.y < rise.y && noon.y < set.y);
  assert.ok(noon.y >= 30);
  assert.equal(celestialPosition(at(23)).body, 'moon');
  assert.ok(celestialPosition(at(1)).y < celestialPosition(at(22)).y);
});
