const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),www=path.join(root,'mobile/www');
const pairs=[['Gaziantep FK','Kasımpaşa'],['Eyüpspor','Kocaelispor'],['Samsunspor','Konyaspor'],['Göztepe','Başakşehir'],['Galatasaray','Amed Sportif Faaliyetler']];
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BIZIMSKOR_CHROMIUM||chromium.executablePath(),args:['--no-sandbox','--disable-dev-shm-usage']});
 try{for(const width of [320,360,390]){
 const page=await browser.newPage({viewport:{width,height:1200}});
 let html=fs.readFileSync(path.join(www,'index.html'),'utf8');let head=html.slice(0,html.indexOf('</head>')).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<meta[^>]*http-equiv="Content-Security-Policy"[^>]*>/gi,'');
 const rows=pairs.map(([a,b])=>`<div class="m"><div class="t home"><span class="bs-team-brand"><span class="bs-team-name">${a}</span></span></div><input class="s"><b>-</b><input class="s"><div class="t"><span class="bs-team-brand"><span class="bs-team-name">${b}</span></span></div><button style="grid-column:1/6">Maç İstatistikleri</button></div>`).join('');
 const body=`${head}</head><body><div class="bs-screen-content"><section id="pred"><div class="c">${rows}</div></section></div><script src="/brand-assets.js"></script><script src="/brand-visual-ui.js"></script><script src="/prediction-visibility-logo-fix.js"></script><script src="/android-ui.js"></script></body></html>`;
 await page.route('http://android.test/**',route=>{const p=new URL(route.request().url()).pathname;if(p==='/')return route.fulfill({contentType:'text/html',body});const f=path.join(www,p);return fs.existsSync(f)?route.fulfill({contentType:f.endsWith('.css')?'text/css':'text/javascript',body:fs.readFileSync(f)}):route.abort();});
 await page.goto('http://android.test/');await page.waitForFunction(()=>document.getElementById('bsPredictionVisibilityLogoFix'));
 const measurements=await page.locator('.bs-team-name').evaluateAll(ns=>ns.map(n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return {name:n.textContent,wrap:s.whiteSpace,overflow:s.overflow,textOverflow:s.textOverflow,width:r.width,scroll:n.scrollWidth,client:n.clientWidth,top:r.top,bottom:r.bottom}}));
 if(process.env.TEAM_NAME_SCREENSHOTS)await page.screenshot({path:path.join(process.env.TEAM_NAME_SCREENSHOTS,`teams-${width}.png`),fullPage:true});
 assert.equal(measurements.length,10,'fixture must contain all team names');
 for(const m of measurements){assert.equal(m.wrap,'normal',`${width}px ${m.name} must wrap instead of truncating`);assert.notEqual(m.textOverflow,'ellipsis');assert.ok(m.scroll<=m.client+1,`${width}px ${m.name} horizontal overflow`);}
 const overlapping=await page.locator('.m').evaluateAll(rows=>rows.some(row=>{const a=row.querySelectorAll('.t');const inputs=row.querySelectorAll('input');return a[0].getBoundingClientRect().right>inputs[0].getBoundingClientRect().left+1||a[1].getBoundingClientRect().left<inputs[1].getBoundingClientRect().right-1}));assert.equal(overlapping,false,'team names must not overlap score inputs');
 console.log(`PASS ${width}px: all 10 full team names wrap without clipping or overlap`);await page.close();
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
