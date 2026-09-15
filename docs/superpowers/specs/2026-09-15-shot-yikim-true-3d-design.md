# Şut Yıkım True 3D Design

## Goal
Replace the current 2D tower simulation with a real 3D scene where blocks can move in X/Y/Z, topple off any edge of a raised table, fall to the ground, collide with each other, and react naturally to a football shot aimed at any screen point.

## Scope
This work stays isolated to `feature/shot-yikim-v1` and the standalone `shot-yikim/` preview. It does not modify Bizim Skor production integration.

## Technology
- Rendering: Three.js 0.186.0 ES module.
- Physics: `@dimforge/rapier3d-compat` 0.20.0 ES module.
- Hosting: existing static Vercel preview; no build step.
- Input: Pointer Events / tap on the 3D canvas.

## Scene Architecture
The game board is a real Three.js scene. A perspective camera looks over a football-stadium environment toward a raised rectangular table. The table has finite width, depth and height. A ground plane sits below the table so blocks that leave any edge fall visibly to the floor.

The visual scene contains:
- perspective camera,
- WebGL renderer,
- ambient + directional lighting with shadows,
- football pitch/stadium background,
- raised table/platform,
- 3D tower pieces,
- football projectile,
- optional aim marker.

## Physics Architecture
Rapier owns all rigid-body state. Three.js meshes only render Rapier body transforms.

Static colliders:
- table top,
- table support/base if needed,
- ground plane.

Dynamic tower bodies:
- cuboids for stone/wood blocks,
- cylinders for barrels,
- spheres/cylinders for round pieces where appropriate.

Each material gets different density/friction/restitution characteristics:
- wood: lighter, moderate friction,
- stone: heavier, high friction, low bounce,
- metal: heaviest, lower friction.

No hidden side walls are used. A block can leave the table from the front, back, left or right and continue falling to the ground.

## Aiming and Shot Flow
The player may tap any visible point in the 3D scene. A Three.js raycaster converts the screen tap into a 3D target point by intersecting tower meshes first and then a fallback vertical aiming plane around the tower/table.

The football begins from a fixed launch point in front of and below the table. Each shot spawns/resets a dynamic spherical Rapier rigid body and gives it an impulse toward the selected 3D point. The ball itself collides physically with one or more tower bodies. There is no per-target click or scripted destruction.

Consequences:
- hitting the seam between two blocks can affect both,
- hitting a bottom support can destabilize everything above it,
- upper pieces can slide, rotate and fall due to gravity,
- an apparently stable piece may remain on the table instead of being forced to disappear.

## Win / Lose Rules
A piece counts as removed only after it has actually fallen below the tabletop region and left the playable table surface. Fallen bodies stay physically visible on or near the ground until the round transition.

A round completes when every tower piece is off the table. After a short settle delay the next level starts automatically.

A round fails when all footballs are used, at least one piece remains on the table, and the simulation has settled. The restart button repeats the current level.

Level 20 completion ends the 20-level campaign.

## 20-Level Progression
The existing 20-level campaign remains. Each level is rebuilt as a 3D tower layout using rows/layers with depth variation, alternating orientations and mixed materials. Early levels use few large stable pieces; later levels add more layers, deeper stacks, offset supports, round pieces, heavy metal pieces, and asymmetric towers.

Difficulty increases through geometry and shot count rather than artificial HP. Every level must remain physically solvable with its allotted balls.

## Rendering / UX
The game opens with the football-themed start screen. On play, the 3D canvas fills the board area. HUD continues to show level, score and remaining balls.

Score awards are based on blocks leaving the table and a round-completion bonus. The exact physics result matters more than scripted hit points.

The camera remains fixed for v1 so aiming stays understandable on mobile. Camera orbit controls are out of scope.

## Failure Handling
If WebGL or Rapier initialization fails, the board shows a clear message that the 3D game could not start instead of silently behaving like the old 2D version.

## Testing
Node tests cover pure level generation, 20-level progression, valid 3D block data, no artificial HP targeting, shot-count logic and campaign completion. Static contract tests cover module imports, canvas container, absence of the old Matter.js/2D physics layer, and the free-aim event path.

Browser verification checks the Vercel preview returns the new module files and pinned Three.js/Rapier imports. Actual physics is additionally smoke-tested in a local browser if a runnable browser is available in the environment.

## Out of Scope
- Bizim Skor production integration,
- multiplayer/leaderboards,
- persistent saves,
- camera controls,
- realistic player character/kicking animation,
- native mobile app packaging.
