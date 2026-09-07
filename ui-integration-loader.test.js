const assert=require('assert');
const loader=require('./ui-integration-loader.js');
assert.deepStrictEqual(loader.scriptOrder(),[
  'week-strip.js',
  'header-ui.js',
  'home-prediction-priority.js',
  'horizontal-menu.js',
  'invite-growth-utils.js',
  'invite-registration.js',
  'invite-registration-bootstrap.js',
  'league-invite-share.js',
  'invite-leaderboard.js',
  'invite-leaderboard-ui.js',
  'invite-champion.js',
  'invite-champion-ui.js',
  'weekly-result-card.js',
  'weekly-result-card-image-share.js',
  'share-game.js',
  'invite-growth-ui-bootstrap.js',
  'weekly-result-card-bootstrap.js',
  'chat-unread-indicator.js',
  'prediction-week-cards.js',
  'match-statistics-ui.js',
  'home-dashboard-ui.js',
  'weekly-ranking-strip.js',
  'find-my-ranking.js',
  'player-profile.js',
  'fixture-data.js',
  'fixture-ui.js',
  'fixture-week-strip.js',
  'history-week-strip.js',
  'rules-ranking-update.js'
]);
const order=loader.scriptOrder();
assert(order.indexOf('home-prediction-priority.js')<order.indexOf('prediction-week-cards.js'));
assert(order.includes('find-my-ranking.js'));
assert(order.indexOf('prediction-week-cards.js')<order.indexOf('home-dashboard-ui.js'));
assert(order.indexOf('prediction-week-cards.js')<order.indexOf('match-statistics-ui.js'));
assert(order.indexOf('horizontal-menu.js')<order.indexOf('chat-unread-indicator.js'));
assert(order.indexOf('horizontal-menu.js')<order.indexOf('share-game.js'));
assert(order.indexOf('fixture-ui.js')<order.indexOf('fixture-week-strip.js'));
console.log('ui-integration-loader ok');
