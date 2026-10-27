import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {parseHTML} from 'linkedom';
const core=await readFile(new URL('../account-core.js',import.meta.url),'utf8');
const source=await readFile(new URL('../account-ui.js',import.meta.url),'utf8');
function mount(){
 const {window,document}=parseHTML('<html><body><div id="newPlayer"><button id="showLogin"></button><button id="showRegister"></button></div><button id="updateProfile"></button><button id="logoutPlayer"></button></body></html>');
 const saved=new Map();const storage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)};
 let restore;
 const client={auth:{getSession:async()=>({data:{session:null}})},functions:{invoke:async()=>({data:{error:'email_service_unavailable'}})}};
 window.BizimSkorMobileHooks={client,deviceId:()=> 'test-device',legacyRestore:async()=>{},installRestore:fn=>{restore=fn},legacyLogin:async()=>{},showPlayer:()=>{},clearPlayer:()=>{},refresh:()=>{}};
 const context=vm.createContext({window,document,localStorage:storage,Event:window.Event,FormData:class{},console});
 vm.runInContext(core,context);context.BizimSkorMobileAccount=window.BizimSkorMobileAccount;vm.runInContext(source,context);
 return {window,document,ui:window.BizimSkorMobileAccountUI,restore};
}
test('native account panel mounts with existing test login; root restore is wired',async()=>{const s=mount();assert.equal(s.ui.mode,'legacy');assert.equal(s.document.querySelector('#mobile-pin').getAttribute('maxlength'),'4');await s.restore();assert.equal(s.ui.mode,'legacy');});
test('registration requires email, strong repeated password and explicit consent',()=>{const s=mount();s.ui.render('signup');assert.equal(s.document.querySelector('#mobile-email').type,'email');assert.equal(s.document.querySelector('#mobile-password').getAttribute('minlength'),'8');assert.equal(s.document.querySelector('#mobile-repeat').getAttribute('minlength'),'8');assert.equal(s.document.querySelector('#mobile-consent').hasAttribute('required'),true);assert.equal(s.document.querySelector('#mobile-pin'),null);assert.match(s.document.body.textContent,/kurulumu sürüyor/);});
test('every account view renders and retains accessible privacy and deletion routes',()=>{const s=mount();for(const mode of ['legacy','legacy-reset','login','signup','verify','recover','reset','choose','create','account','legacy-account','change','delete','legacy-delete']){s.ui.render(mode);assert.equal(s.ui.mode,mode);assert.ok(s.document.querySelector('a[href="privacy.html"]'),mode);assert.ok(s.document.querySelector('a[href="account-delete.html"]'),mode);for(const input of s.document.querySelectorAll('input'))assert.ok(s.document.querySelector(`label[for="${input.id}"]`),mode);}});
test('deletion view explains manual processing and cancellation',()=>{const s=mount();s.ui.render('delete');assert.match(s.document.body.textContent,/anında silme yapmaz/);assert.match(s.document.body.textContent,/Talebimi geri çek/);});
test('header legacy switcher closures are rebound to the current native panels',()=>{const s=mount();s.ui.render('recover');s.document.getElementById('showLogin').click();assert.equal(s.ui.mode,'login');s.document.getElementById('showRegister').click();assert.equal(s.ui.mode,'signup');});
