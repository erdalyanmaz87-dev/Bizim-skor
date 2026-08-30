import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeApiFootballFixture,nextTerminalState,shouldPoll} from '../supabase/functions/live-score-sync/core.mjs';

test('API-Football canlı fikstürünü sadeleştirir',()=>{
  assert.deepEqual(normalizeApiFootballFixture({fixture:{id:77,status:{short:'2H',elapsed:67}},goals:{home:1,away:1}}),{
    provider_fixture_id:77,status:'2H',elapsed:67,home_score:1,away_score:1
  });
});

test('aynı bitmiş skor iki kez gelmeden kesinleştirmez',()=>{
  assert.deepEqual(nextTerminalState(null,{status:'FT',home_score:2,away_score:1}),{
    terminal_seen_count:1,terminal_signature:'FT:2:1',should_finalize:false
  });
  assert.deepEqual(nextTerminalState({terminal_seen_count:1,terminal_signature:'FT:2:1'},{status:'FT',home_score:2,away_score:1}),{
    terminal_seen_count:2,terminal_signature:'FT:2:1',should_finalize:true
  });
});

test('bitiş skoru değişirse doğrulama sayacını sıfırdan başlatır',()=>{
  assert.deepEqual(nextTerminalState({terminal_seen_count:1,terminal_signature:'FT:1:1'},{status:'FT',home_score:2,away_score:1}),{
    terminal_seen_count:1,terminal_signature:'FT:2:1',should_finalize:false
  });
});

test('ertelenen ve geçersiz skorlar sonuç oluşturmaz',()=>{
  assert.equal(nextTerminalState(null,{status:'PST',home_score:0,away_score:0}).should_finalize,false);
  assert.throws(()=>normalizeApiFootballFixture({fixture:{id:1,status:{short:'FT',elapsed:90}},goals:{home:21,away:0}}),/geçersiz/i);
});

test('yalnız aktif maç varken kota ve beş dakika uygunsa sorgular',()=>{
  const now=new Date('2026-08-30T17:10:00Z');
  assert.equal(shouldPoll({active_fixture_count:1,request_count:94,last_requested_at:'2026-08-30T17:05:00Z',now}),true);
  assert.equal(shouldPoll({active_fixture_count:1,request_count:95,last_requested_at:null,now}),false);
  assert.equal(shouldPoll({active_fixture_count:0,request_count:0,last_requested_at:null,now}),false);
  assert.equal(shouldPoll({active_fixture_count:1,request_count:0,last_requested_at:'2026-08-30T17:06:00Z',now}),false);
});
