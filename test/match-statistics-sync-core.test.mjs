import test from 'node:test';
import assert from 'node:assert/strict';
import {
  matchProviderFixture,
  teamRecentMatches,
  formSequence,
  normalizeHeadToHead,
  weeklyRequestBudget,
  buildFixtureSnapshot
} from '../supabase/functions/match-statistics-sync/core.mjs';

const completed=(id,date,homeId,home,awayId,away,homeGoals,awayGoals)=>({
  fixture:{id,date,status:{short:'FT'}},
  teams:{home:{id:homeId,name:home},away:{id:awayId,name:away}},
  goals:{home:homeGoals,away:awayGoals}
});

test('iç fikstürü sağlayıcıdaki takım adları ve başlama saatiyle eşleştirir',()=>{
  const internal={id:44,home_team:'Başakşehir',away_team:'Galatasaray',kickoff:'2026-09-12T17:00:00Z'};
  const provider=[
    {...completed(900,'2026-09-12T17:00:00Z',10,'Kocaelispor',20,'Galatasaray',0,0)},
    {...completed(901,'2026-09-12T17:00:00Z',11,'Istanbul Basaksehir',20,'Galatasaray',0,0)}
  ];
  assert.equal(matchProviderFixture(internal,provider)?.fixture.id,901);
});

test('takımın yalnız maç saatinden önce tamamlanan son beş maçını döndürür',()=>{
  const rows=[
    completed(1,'2026-08-01T17:00:00Z',1,'A',2,'B',2,0),
    completed(2,'2026-08-08T17:00:00Z',3,'C',1,'A',1,1),
    completed(3,'2026-08-15T17:00:00Z',1,'A',4,'D',0,1),
    completed(4,'2026-08-22T17:00:00Z',5,'E',1,'A',0,3),
    completed(5,'2026-08-29T17:00:00Z',1,'A',6,'F',2,2),
    completed(6,'2026-09-05T17:00:00Z',7,'G',1,'A',0,1),
    completed(7,'2026-09-12T17:00:00Z',1,'A',8,'H',5,0)
  ];
  const recent=teamRecentMatches(1,rows,'2026-09-12T17:00:00Z');
  assert.deepEqual(recent.map(row=>row.fixture_id),[6,5,4,3,2]);
  assert.deepEqual(formSequence(recent),['W','D','W','L','D']);
});

test('son beş ikili maçı güvenli ve yeniden eskilere doğru sadeleştirir',()=>{
  const rows=[
    completed(1,'2025-01-01T17:00:00Z',1,'A',2,'B',1,0),
    completed(2,'2026-01-01T17:00:00Z',2,'B',1,'A',2,2)
  ];
  assert.deepEqual(normalizeHeadToHead(rows).map(row=>({id:row.fixture_id,score:row.score})),[
    {id:2,score:'2-2'},
    {id:1,score:'1-0'}
  ]);
});

test('dokuz maçlık haftanın sağlayıcı bütçesini on istekle sınırlar',()=>{
  assert.equal(weeklyRequestBudget(9),10);
  assert.equal(weeklyRequestBudget(12),10);
  assert.equal(weeklyRequestBudget(0),0);
});

test('fikstür önbelleğine puan durumu, form ve ikili maçları birlikte koyar',()=>{
  const target={id:44,week:5,home_team:'A',away_team:'B',kickoff:'2026-09-12T17:00:00Z'};
  const providerTarget=completed(900,'2026-09-12T17:00:00Z',1,'A',2,'B',0,0);
  const season=[completed(1,'2026-09-01T17:00:00Z',1,'A',3,'C',2,0),completed(2,'2026-09-02T17:00:00Z',4,'D',2,'B',1,1)];
  const standings=[{team_id:1,rank:2,points:9},{team_id:2,rank:7,points:5}];
  const snapshot=buildFixtureSnapshot({internalFixture:target,providerFixture:providerTarget,seasonFixtures:season,headToHead:season,standings,fetchedAt:'2026-09-05T10:00:00Z'});
  assert.deepEqual({fixture_id:snapshot.fixture_id,week:snapshot.week,home:snapshot.home,away:snapshot.away,h2h_count:snapshot.head_to_head.length},{
    fixture_id:44,
    week:5,
    home:{team_id:1,name:'A',rank:2,points:9,form:['W'],recent_matches:[{fixture_id:1,date:'2026-09-01T17:00:00Z',home_team:'A',away_team:'C',home_score:2,away_score:0,outcome:'W'}]},
    away:{team_id:2,name:'B',rank:7,points:5,form:['D'],recent_matches:[{fixture_id:2,date:'2026-09-02T17:00:00Z',home_team:'D',away_team:'B',home_score:1,away_score:1,outcome:'D'}]},
    h2h_count:2
  });
});
