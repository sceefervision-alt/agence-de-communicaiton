import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectBase, languagesOfCountry, countryFromTimeZone, isBaseLanguage, BASE_LANGUAGES } from '../src/locale.js';

const pick = (languages, extra = {}) => detectBase({ languages, ...extra }).base;

test('le pays des réglages du navigateur choisit la langue de base', () => {
  assert.equal(pick(['fr-FR', 'fr']), 'fr');
  assert.equal(pick(['fr-CI']), 'fr');
  assert.equal(pick(['en-NG', 'en']), 'en');
  assert.equal(pick(['pt-BR']), 'pt');
  assert.equal(pick(['es-MX']), 'es');
  assert.equal(pick(['de-AT']), 'de');
  assert.equal(pick(['ja-JP']), 'ja');
  assert.equal(pick(['ar-MA']), 'ar');
  assert.deepEqual(detectBase({ languages: ['fr-SN'] }), { base: 'fr', country: 'SN', source: 'locale' });
});

test('pays multilingue : la langue du navigateur départage', () => {
  assert.equal(pick(['fr-CA']), 'fr');
  assert.equal(pick(['en-CA']), 'en');
  assert.equal(pick(['it-CH']), 'it');
  assert.equal(pick(['de-CH']), 'de');
  assert.equal(pick(['fr-BE']), 'fr');
  assert.equal(pick(['nl-BE']), 'nl');
  assert.equal(pick(['en-CM']), 'en');
  assert.equal(pick(['fr-MA']), 'fr');
});

test('le pays de la région l’emporte sur une langue de navigateur absente du pays', () => {
  // Navigateur réglé en anglais, région Côte d'Ivoire : l'interface suit le pays.
  assert.equal(pick(['en-CI']), 'fr');
});

test('sans région : pays de connexion, puis fuseau horaire', () => {
  assert.equal(pick(['fr'], { timeZone: 'Africa/Abidjan' }), 'fr');
  assert.equal(pick([], { timeZone: 'America/Sao_Paulo' }), 'pt');
  assert.equal(pick([], { geoCountry: 'SN', timeZone: 'Europe/Paris' }), 'fr');
  assert.equal(detectBase({ languages: [], geoCountry: 'KE' }).source, 'geo');
  assert.equal(countryFromTimeZone('Asia/Tokyo'), 'JP');
});

test('en voyage : un navigateur dans une langue connue n’est pas remplacé par le pays visité', () => {
  assert.equal(pick(['fr'], { geoCountry: 'JP', timeZone: 'Asia/Tokyo' }), 'fr');
  assert.equal(pick(['en-US'], { geoCountry: 'DE', timeZone: 'Europe/Berlin' }), 'en');
});

test('étiquettes particulières et repli sur l’anglais', () => {
  assert.equal(pick(['nb-NO']), 'no');
  assert.equal(pick(['fil-PH']), 'tl');
  assert.equal(pick(['zz']), 'en');
  assert.equal(pick([]), 'en');
  assert.equal(pick(['xx-XX']), 'en');
});

test('toutes les langues des pays sont des langues de base du catalogue', () => {
  assert.ok(isBaseLanguage('fr') && isBaseLanguage('en') && !isBaseLanguage('la'));
  assert.ok(BASE_LANGUAGES.length >= 40);
  for (const country of ['FR', 'US', 'BR', 'CN', 'SA', 'CH', 'CD', 'IN']) {
    const langs = languagesOfCountry(country);
    assert.ok(langs.length > 0, country);
    for (const l of langs) assert.ok(isBaseLanguage(l), `${country}:${l}`);
  }
});
