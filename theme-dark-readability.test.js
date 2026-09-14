const assert=require('assert');
const fs=require('fs');
const path=require('path');

const css=fs.readFileSync(path.join(__dirname,'theme.css'),'utf8');

const requiredDarkSelectors=[
  'html[data-theme="dark"] .bs-screen-back',
  'html[data-theme="dark"] .league-summary',
  'html[data-theme="dark"] .league-shell',
  'html[data-theme="dark"] .league-table-head',
  'html[data-theme="dark"] .league-row',
  'html[data-theme="dark"] .league-chip',
  'html[data-theme="dark"] .league-promotion-zone',
  'html[data-theme="dark"] .league-relegation-zone',
  'html[data-theme="dark"] .league-championship-zone',
  'html[data-theme="dark"] .bs-profile-stats>div',
  'html[data-theme="dark"] .bs-profile-form',
  'html[data-theme="dark"] .bs-profile-match',
  'html[data-theme="dark"] .bs-museum-section',
  'html[data-theme="dark"] .bs-museum-cabinet div',
  'html[data-theme="dark"] .bs-museum-row',
  'html[data-theme="dark"] .support-contact-button',
  'html[data-theme="dark"] .support-head>button',
  'html[data-theme="dark"] .support-admin-filters button',
  'html[data-theme="dark"] #loginHelpActions>button'
];

for(const selector of requiredDarkSelectors){
  assert.ok(css.includes(selector),`Missing dark-mode readability rule: ${selector}`);
}

assert.ok(css.includes('html[data-theme="dark"] .league-summary-status'), 'Arena status text needs a dark-mode color');
assert.ok(css.includes('html[data-theme="dark"] .bs-profile-note'), 'Profile secondary text needs a dark-mode color');
assert.ok(css.includes('html[data-theme="dark"] .bs-museum-head span'), 'Museum secondary text needs a dark-mode color');

console.log('theme dark readability ok');
