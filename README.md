# maze-fold

An interactive design environment for **origami mazes**: draw (or randomly
generate, or type) an orthogonal maze and get a printable crease pattern that
folds a flat square of paper into that maze — walls of uniform height
extruded from a flat floor.

This is a TypeScript re-implementation of the algorithm from:

> Erik D. Demaine, Martin L. Demaine, Jason Ku.
> **"Folding Any Orthogonal Maze."**
> In *Origami⁵: Proceedings of the 5th International Conference on Origami in
> Science, Mathematics and Education* (OSME 2010).

and is modeled on the authors' original web application,
[Origami Maze Font](https://erikdemaine.org/fonts/maze/), whose source was
used as the geometry reference for the vertex-gadget crease patterns.
All credit for the algorithm and gadget designs belongs to the original
authors.

## How it works (the 30-second version)

The maze is an orthogonal graph on a grid: each edge either carries a wall or
not. The crease pattern is a *tiling* of per-vertex gadgets — six types up to
rotation (empty, straight, corner, T, cross, dead-end) — placed where pleat
strips cross. Every gadget presents the same interface on each side (a
"ridge" profile where a wall crosses, a "floor" profile where it doesn't),
so any combination tiles into a valid, watertight crease pattern in linear
time. With wall height h = 1, the paper is only 3× the maze footprint.

Red lines are mountain folds, blue are valley folds; thick lines fold 180°,
thin lines fold 90°.

## Development

```sh
npm install
npm run dev        # dev server
npm test           # vitest
npm run build      # typecheck + production build into dist/
```

## Auto-commit

Commits in this repo are made periodically by `scripts/autocommit.sh` (a
plain shell script under the user's git identity), not by hand and not by
any AI tool. Two triggers:

1. **`npm run dev`** also starts `scripts/autocommit-watch.sh`, which
   checkpoint-commits every 10 minutes while you develop.
2. A launchd LaunchAgent (`scripts/install-autocommit.sh`) runs the same
   script every 10 minutes in the background. Note: macOS blocks background
   agents from `~/Documents` by default — to enable this path, grant
   Full Disk Access to `/bin/sh` in System Settings → Privacy & Security
   (or leave it disabled and rely on the dev-server watcher). Force a run
   with `launchctl kickstart gui/$(id -u)/com.emredayangac.mazefold-autocommit`.
