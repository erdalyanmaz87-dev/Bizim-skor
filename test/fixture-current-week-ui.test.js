const test=require('node:test');
const assert=require('node:assert/strict');

function query(rows){
  return{
    select(){return this},order(){return this},eq(){return this},in(){return this},
    then(resolve){resolve({data:rows,error:null})}
  };
}

test('Fikstür açıldığında sonuç girilen son haftayı gösterir',async()=>{
  const fixtures=[
    {id:29,week:4,home_team:'A',away_team:'B',kickoff:'2026-09-05T14:00:00Z'},
    {id:30,week:4,home_team:'C',away_team:'D',kickoff:'2026-09-05T17:00:00Z'},
    {id:31,week:5,home_team:'E',away_team:'F',kickoff:'2026-09-12T14:00:00Z'}
  ];
  const results=[{fixture_id:29,home_score:1,away_score:0,status:'finished'}];
  const select={innerHTML:'',value:'',onchange:null};
  const list={innerHTML:''};
  global.window=global;
  global.document={
    getElementById(id){return({fixtureStyles:{},fixtureCompetition:{value:'super'},resultsWeekSelect:select,resultsList:list})[id]||null},
    querySelector(){return null}
  };
  global.sb={from(table){return query(table==='fixtures'?fixtures:results)}};
  global.BizimSkorCurrentRankingWeek=require('../current-ranking-week.js');
  global.BizimSkorFixture={groupByTurkeyDay(){return[]},turkeyTime(){return''}};
  global.window.addEventListener=()=>{};
  delete require.cache[require.resolve('../fixture-ui.js')];
  require('../fixture-ui.js');
  let renderedWeek=null;
  global.renderFixtureWeek=async week=>{renderedWeek=week};

  await global.loadResultsWeeks();

  assert.equal(renderedWeek,4);
});
