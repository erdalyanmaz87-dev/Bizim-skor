import {test} from 'node:test';import assert from 'node:assert/strict';import {handleAction} from '../supabase/functions/mobile-account-auth/core.mjs';
const deps={gate:async()=>true,signup:async()=>({})};
for(const name of ['Ab','Eski! Oyuncu','A'.repeat(60)])test('existing-player signup retains legacy name '+name.slice(0,12),async()=>{const q=await handleAction({action:'signup',email:'test@example.com',password:'password123',name,existingPlayer:true},deps);assert.equal(q.status,200);});
test('new player signup retains strict name policy',async()=>{const q=await handleAction({action:'signup',email:'test@example.com',password:'password123',name:'Ab'},deps);assert.equal(q.status,400);});
