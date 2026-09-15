const assert=require('assert');
const brand=require('./brand-assets.js');
const superTeams=['Alanyaspor','Amed SFK','Başakşehir','Beşiktaş','Çorum FK','Erzurumspor','Eyüpspor','Fenerbahçe','Galatasaray','Gaziantep','Gençlerbirliği','Göztepe','Kasımpaşa','Kocaelispor','Konyaspor','Çaykur Rizespor','Samsunspor','Trabzonspor'];
for(const name of superTeams){assert.ok(brand.teamLogoUrl(name),`missing Süper Lig logo: ${name}`)}
const uclTeams=['Paris Saint-Germain','Bayern Munich','Real Madrid','Liverpool','Inter','Manchester City','Arsenal','Barcelona','Atletico Madrid','Borussia Dortmund','Roma','Sporting CP','Aston Villa','FC Porto','Manchester United','Club Brugge','Real Betis','PSV Eindhoven','Feyenoord','Lille','Bodø/Glimt','Napoli','RB Leipzig','Villarreal','Fenerbahçe','Shakhtar Donetsk','Galatasaray','Slavia Praha','Slovan Bratislava','VfB Stuttgart','AEK Athens','LASK','Como 1907','RC Lens','Viking FK','Sabah'];
for(const name of uclTeams){assert.ok(brand.teamLogoUrl(name),`missing UCL logo: ${name}`)}
for(const country of ['Türkiye','Fransa','İtalya','Belçika','İngiltere','İspanya','Almanya','Portekiz']){assert.ok(brand.nationalTeamLogoUrl(country),`missing national logo: ${country}`)}
console.log('brand coverage ok');
