const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const src=fs.readFileSync(path.join(__dirname,'shot-yikim-3d.js'),'utf8');
test('pins Three and Rapier compat modules',()=>{assert.match(src,/three@0\.186\.0/);assert.match(src,/@dimforge\/rapier3d-compat@0\.20\.0/);});
test('uses perspective camera raycaster and 3d rigid bodies',()=>{assert.match(src,/PerspectiveCamera/);assert.match(src,/Raycaster/);assert.match(src,/RigidBodyDesc\.dynamic/);assert.match(src,/ColliderDesc\.(cuboid|ball|cylinder)/);});
test('creates table and ground but no invisible side walls',()=>{assert.match(src,/tableBody/);assert.match(src,/groundBody/);assert.doesNotMatch(src,/sideWall|leftWall|rightWall|backWall/);});
test('football is a dynamic sphere shot toward free-aim point',()=>{assert.match(src,/footballBody/);assert.match(src,/shootAtClientPoint/);});
test('runtime exposes callbacks for fallen blocks and settled state',()=>{assert.match(src,/onBlockFallen/);assert.match(src,/onSettled/);assert.match(src,/getRemainingBlockCount/);});
test('football launcher starts inside the camera view and uses stable 3d shot velocity',()=>{
  assert.match(src,/const LAUNCH=\{x:0,y:1\.(4|5)\d*,z:2\.[4-8]\d*\}/);
  assert.match(src,/setCcdEnabled\(true\)/);
  assert.match(src,/setLinvel\(\{x:dir\.x\*speed,y:dir\.y\*speed,z:dir\.z\*speed\},true\)/);
  assert.doesNotMatch(src,/footballBody\.applyImpulse/);
});
test('shot creates a short visible trajectory trail',()=>{
  assert.match(src,/shotTrail/);
  assert.match(src,/LineBasicMaterial/);
  assert.match(src,/setTimeout\(\(\)=>\{if\(shotTrail\)/);
});
