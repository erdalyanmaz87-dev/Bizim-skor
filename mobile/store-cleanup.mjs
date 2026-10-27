// Android-only source policy. Website sources are never modified. Deliberately
// fail a build when an upstream edit makes one of the targeted rewrites stale.
// The retired one-time unlock module is truncated in the website repository and
// no longer loaded there; do not ship that dead, syntactically invalid source.
const excluded = new Set(['chat-unread-indicator.js', 'champions-prize-announcement.js', 'superlig-logo-fix.js', 'super-league-one-time-unlock.js']);
const ownImages = new Set(['bizim-skor-icon-v1.png', 'bizim-skor-icon-v2.png', 'bizim-skor-logo-v1.png', 'bizim-skor-logo-v2.png']);
export function shouldBundle(name) {
  if (excluded.has(name) || name.startsWith('assets/')) return false;
  if (/\.(png|svg|webp|jpe?g|gif)$/i.test(name)) return ownImages.has(name);
  return true;
}

function replaceRequired(source, pattern, replacement, label) {
  if (!pattern.test(source)) throw new Error(`Android cleanup needs review: ${label}`);
  return source.replace(pattern, replacement);
}
function replaceLineFunction(source, name, replacement) {
  return replaceRequired(source, new RegExp(`function ${name}\\([^\\n]*\\}[^\\S\\n]*(?=\\n)`), replacement, name);
}

export const rankingRules = '<b>8. Sıralama 🏆</b><br><b>Oyun içi sıralama:</b> Tüm sıralamalarda öncelik toplam puandır. Puan eşitliğinde sırasıyla sezon boyunca davet edilen arkadaş sayısı, tam skor sayısı, doğru sonuç sayısı ve oyuna kayıt zamanı esas alınır. Davet sayısı yalnızca puan eşitliğinde kullanılır. Puanlar ve kupalar oyun içi başarıları gösterir; nakit veya maddi karşılığı yoktur.';

function cleanIndex(source) {
  source = replaceRequired(source, /<script src="champions-prize-announcement\.js" defer><\/script>/, '', 'announcement script');
  source = replaceRequired(source, /<button class="tab" data-tab="chat">[\s\S]*?<\/button>/, '', 'chat tab');
  source = replaceRequired(source, /<section id="chat"[\s\S]*?<\/section>/, '', 'chat section');
  // Remove the query, send handler, navigation hook and realtime subscription,
  // rather than leaving disabled UI connected to the production chat table.
  source = replaceRequired(source, /async function loadChat\(\)[\s\S]*?await loadChat\(\)\};/, '', 'chat query and send');
  source = replaceRequired(source, /if\(b\.dataset\.tab==='chat'\)await loadChat\(\)/, '', 'chat navigation hook');
  source = replaceRequired(source, /sb\.channel\('chat-live'\)[\s\S]*?\.subscribe\(\);/, '', 'chat realtime');
  source = replaceRequired(source, /Promise\.resolve\(window\.BizimSkorPrizeAnnouncement\?\.maybeShow\(q\.data\)\)\.catch\(error=>console\.warn\('prize announcement',error\?\.message\)\);/, '', 'announcement login hook');
  source = source.replace(/\.chatbox\{[^}]*\}|\.msg\{[^}]*\}|\.msg b\{[^}]*\}|\.msgtime\{[^}]*\}|\.chatrow\{[^}]*\}/g, '');
  source = source.replace(/,'chat'/g, '');
  source = replaceRequired(source, /<p class="small">3\. ve 4\. hafta toplamında[\s\S]*?<\/p>/, '<p class="small">3. ve 4. hafta toplam puan sıralaması.</p>', 'Sezu description');
  source = source.replaceAll('Sezu Ödül Sıralaması', 'Sezu Puan Sıralaması');
  source = replaceRequired(source, /<p><b>8\. Sıralama[\s\S]*?<\/p>/, `<p>${rankingRules}</p>`, 'static ranking rules');
  source = replaceLineFunction(source, 'prepareRankingRules', `function prepareRankingRules(){const rule=[...document.querySelectorAll('.rules p')].find(p=>p.textContent.trim().startsWith('8. Sıralama'));if(rule)rule.innerHTML=${JSON.stringify(rankingRules)}}`);
  return source;
}

function cleanBrand(source) {
  source = replaceRequired(source, /const TEAM_META=\{[\s\S]*?\n  \};/, 'const TEAM_META={};', 'team metadata');
  source = replaceRequired(source, /const COMPETITIONS=\{[\s\S]*?\n  \};/, 'const COMPETITIONS={};', 'competition metadata');
  source = replaceLineFunction(source, 'teamLogoUrl', 'function teamLogoUrl(){return null}');
  source = replaceLineFunction(source, 'nationalTeamLogoUrl', 'function nationalTeamLogoUrl(){return null}');
  source = replaceLineFunction(source, 'teamMarkup', 'function teamMarkup(name){return `<span class="bs-team-brand"><span class="bs-team-name">${esc(name)}</span></span>`}');
  source = replaceLineFunction(source, 'competitionLogoMarkup', 'function competitionLogoMarkup(kind,label=""){return `<span class="bs-competition-brand"><span>${esc(label)}</span></span>`}');
  return source;
}

function cleanCup(source) {
  source = replaceLineFunction(source, 'award', "function award(){return ''}");
  source = replaceLineFunction(source, 'rewardPodium', "function rewardPodium(s){if(s.status!=='finished')return '';const final=(s.matches||[]).find(m=>m.round===6&&!m.bronze),bronze=(s.matches||[]).find(m=>m.bronze);if(!final?.winner||!bronze?.winner)return '';const loser=m=>m.winner===m.name_a?m.name_b:m.name_a;return '<div class=\"bsc-awards\"><h3>Kupa sıralaması</h3>'+[final.winner,loser(final),bronze.winner].filter(Boolean).map((n,i)=>'<div><b>'+['🥇','🥈','🥉'][i]+' '+esc(n)+'</b></div>').join('')+'</div>'}");
  source = source.replace(/<p class="bsc-muted">🤖 SkorBot ödül kazanamaz\.[\s\S]*?<\/p>/g, '');
  source = source.replace('🏅 Kupa ödülleri', '🏅 Kupa sıralaması').replace('İlk 3’e ödül', 'Puan ve sıralama').replace('Ödüllü eleme heyecanı', 'Eleme heyecanı');
  // The finished bracket already includes its podium; no empty duplicate panel.
  source = source.replace("+(completed?'<details><summary>🏅 Kupa sıralaması</summary>'+award()+'</details>':'')", '');
  return source;
}

export function transformWebSource(name, source) {
  if (name === 'index.html') source = cleanIndex(source);
  if (name === 'brand-assets.js') source = cleanBrand(source);
  if (name === 'cup-ui.js') source = cleanCup(source);
  if (name === 'rules-ranking-update.js') {
    source = source.replaceAll('8. Sıralama ve Sezon Sonu Ödülleri', '8. Sıralama');
    source = replaceRequired(source, /rule\.innerHTML=[^\n]+;/, `rule.innerHTML=${JSON.stringify(rankingRules)};`, 'dynamic ranking rules');
  }
  if (name === 'ui-integration-loader.js') {
    source = source.replace(/'superlig-logo-fix\.js',/g, '').replace(/'chat-unread-indicator\.js',/g, '');
    source = source.replace(/'superlig-logo-fix\.js':'[^']*',/g, '');
  }
  if (name === 'brand-visual-ui.js') {
    source = replaceRequired(source, /const COMP_LOGOS=\{[^\n]*\};/, 'const COMP_LOGOS={};', 'visual competition URLs');
    source = replaceLineFunction(source, 'competitionMarkup', 'function competitionMarkup(kind,label){return `<span class="bs-competition-brand"><span>${esc(label)}</span></span>`}');
    // The app does not need a remote third-party stadium photograph either.
    source = source.replace(/const STADIUM_BG='[^']*';/, "const STADIUM_BG='';");
  }
  if (name === 'supported-team-ui.js') {
    source = replaceRequired(source, /const LOGO_OVERRIDES=Object\.freeze\(\{[^\n]*\}\);/, 'const LOGO_OVERRIDES=Object.freeze({});', 'supported team overrides');
    source = replaceLineFunction(source, 'logoUrl', "function logoUrl(){return ''}");
    source = replaceLineFunction(source, 'playerLogoMarkup', "function playerLogoMarkup(){return ''}");
  }
  if (name === 'champions-stats-logo-fix.js') {
    source = replaceRequired(source, /const LOGOS=\{[\s\S]*?\n  \};/, 'const LOGOS={};', 'champions overrides');
    source = replaceLineFunction(source, 'logoUrlForTeam', 'function logoUrlForTeam(){return null}');
    source = replaceLineFunction(source, 'replaceFallbackLogos', 'function replaceFallbackLogos(){return false}');
  }
  if (name === 'prediction-visibility-logo-fix.js') {
    source = replaceRequired(source, /const CREST_OVERRIDES=\{[\s\S]*?\n  \};/, 'const CREST_OVERRIDES={};', 'prediction overrides');
    source = replaceRequired(source, /function applyCrestOverride\(node\)\{[\s\S]*?\n  \}/, 'function applyCrestOverride(){return false}', 'prediction crest injection');
  }
  if (name === 'football-center-bootstrap.js') {
    source = source.replace("chat=document.getElementById('chat')", "anchor=document.getElementById('rules')").replace('!tabs||!chat', '!tabs||!anchor').replace('chat.insertAdjacentHTML', 'anchor.insertAdjacentHTML');
  }
  if (name === 'simple-navigation.js') {
    source = replaceRequired(source, /,\n      \['chat','💬','Sohbet'\]/, '', 'drawer chat item');
    source = source.replace("${item.tab==='chat'?'<i class=\"bs-simple-unread\" aria-hidden=\"true\"></i>':''}", '');
    source = replaceLineFunction(source, 'syncUnread', 'function syncUnread(){return false}');
  }
  if (name === 'horizontal-menu.js') {
    source = source.replace(/,'chat'/g, '').replace(/,chat:'Sohbet'/g, '').replace(/,chat:'💬'/g, '');
    source = source.replace(/\.bs-scroll-menu>\.tab\[data-tab="chat"\][\s\S]*?(?=@media)/, '');
  }
  if (['screen-navigation.js', 'screen-navigation-ui.js'].includes(name)) source = source.replace(/\s*chat:\{title:'Sohbet'\},/, '').replace(/,chat:'Sohbet'/, '');
  if (name === 'screen-navigation-app.js') source = source.replace(/,'chat'/g, '');
  assertCleanSource(name, source);
  return source;
}

export function assertCleanSource(name, source) {
  const forbidden = /ödül|hediye\s*çeki|(?:\d[\d.,]*\s*TL\b)|mill[îi]\s*takım\s*forması|örgü\s*atkısı|şal\s*atkısı|chat_messages|chat-live|loadChat|data-tab=["']chat["']|football-logos\.cc|assets\/team-logos\/|(?:https?:[^\s'"`<>]*(?:logo|crest)[^\s'"`<>]*)/i;
  if (forbidden.test(source)) throw new Error(`Android cleanup policy violation in ${name}: ${source.match(forbidden)[0]}`);
}
