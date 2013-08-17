gamekit
=======

> Minimal, Promise/A based HTML5 canvas game engine [/buzzwords]

Gamekit is a minimal approach to a game-engine using HTML5 canvas2D.
Its implementing a couply of features I found necessary for games and don't want to implement over and over.

Also, since its based on Promises, it allows you to do supercool stuff like this:

    gamekit.fetchAssets('assets.json').then(gameSetup).then(gamekit.start);

Currently implements:

* Promises! jay
* Asset Loader
* Module Loader
* Renderloop
* Layers support
* Sprites (rotate/stretch/repeatable)
* Property tweening on Sprites

Docs are coming whenever I feel insane enough for writing them.

xoxo,
Chris