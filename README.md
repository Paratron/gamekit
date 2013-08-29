gamekit
=======

> Minimal, Promise/A based HTML5 canvas game engine [/buzzwords]

Gamekit is a minimal approach to a game engine using HTML5 canvas2D.
Its implementing a couple of features I found necessary for games and don't want to implement over and over.

Also, since its based on Promises, it allows you to do super cool stuff like this:

    gamekit.fetchAssets('assets.json').then(gameSetup).then(gamekit.start);

Currently implements:

* Promises! jay
* Asset Loader
* Module Loader
* Renderloop
* Layers support
* Sprites (rotate/stretch/repeatable)
* Property tweening on Sprites (absolute + relative)
* Entity Groups
* Keyboard input capturing
* Pointer (mouse, touch) input capturing
* Pointer area objects
* Detecting pointer events directly on sprites
* Text Labels

Docs are coming whenever I feel insane enough for writing them.

xoxo,
Chris