conf:{
    "key": "getting-started",
    "title": "Getting started"
}:conf

Getting started
===============

At first, you need to grab yourself a copy of gamekit [from github](https://github.com/Paratron/gamekit/tree/master/dist).

Gamekit runs inside a (or multiple) canvas element(s) in a HTML document. This example HTML structure is enough
to be a boilerplate for a gamekit game:

    <!DOCTYPE html>
    <html>
        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
            <title>A gamekit instance</title>
        </head>
        <body>
            <canvas width="800" height="600></canvas>
            <script src="gamekit.js"></script>
        </body>
    </html>

That isn't very much, isn't it? We aren't even required to define the canvas size inside the HTML
document. Thats also possible inside gamekit's setup methods.

So you may be asking yourself: okay it has a canvas element there and I can see the gamekit library
being loaded. But where is my game logic?
I decided that I wanted to have as less footprints as possible inside the HTML code itself - for starters
because it might confuse entry-level cheaters that try to do a quick peek into the document source to try
and game the game (huehue) and also because I like to have a single purpose template that I can always throw
into an empty folder to get started with a new game. I also don't need to memorize much stuff for the
initial setup process.

You just need to know: gamekit immediately loads a module called "main" after the library has been loaded
and thats where the initialization magic happens.


The main module
---------------
If you want to get more into details, I have prepared a separate [article about modules](modules).

After the library has been loaded by the browser, it automatically tries to load the module "main" from
the module folder. That would by default be the file `/lib/game/main.js`.

Here is a example how such a main module could look like from the inside:

    gamekit.defineModule('main', function(){

        //Create sprites, align everything and prepare for awesomeness!
        function gameSetup(){
            //...
        }

        //Fetching assets, then preparing the game, then launching the engine.
        gamekit
            .fetchAssets('level1.assets.json')
            .then(gameSetup)
            .then(gamekit.start);

    });

As you can see, the game initialization process is pretty straightforward. I defined a setup method
thats being called after my required game assets have been loaded (the asset files are defined in an
external JSON file so I can maintain them without code changes). When the setup method is done, gamekit
will call its start method.

Because of the build-in Javascript promises/a feature, you can chain asynchronous methods together and
get the next method executed when the previous part of the chain is ready.

My example here might be a bit silly because its directly loading up the first level and throws the player
into the game but you might also load your main-menu assets here and show that.