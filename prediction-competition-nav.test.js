const assert=require('assert');
const nav=require('./prediction-competition-nav.js');

const superMarkup=nav.predictionCompetitionMarkup('pred');
assert.match(superMarkup,/data-prediction-competition="pred"[^>]*aria-current="page"/);
assert.match(superMarkup,/🇹🇷 Süper Lig/);
assert.match(superMarkup,/data-prediction-competition="championsPred"/);
assert.match(superMarkup,/⭐ Şampiyonlar Ligi/);
assert.match(superMarkup,/data-prediction-competition="nationsPred"/);
assert.match(superMarkup,/🌍 Uluslar Ligi/);

const championsMarkup=nav.predictionCompetitionMarkup('championsPred');
assert.match(championsMarkup,/data-prediction-competition="championsPred"[^>]*aria-current="page"/);

console.log('prediction-competition-nav ok');
