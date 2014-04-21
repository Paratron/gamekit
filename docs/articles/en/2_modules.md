conf:{
    "key": "modules",
    "title": "Modules"
}:conf

Modules
=======

Everyone who coded somewhat halfway serious Javascript knows, that you have to separate your
logic code into multiple files to maintain a clean codebase.

While I know there are several Javascript module loaders out there and I personally love
requireJS, I decided to implement my own, lightweight module loader into gamekit, since I
wanted to have the smalles possible footprint when using the game engine.

However - if you want to rely on a different kind of module loader, you can use whatever
you want to.


About gamekit modules
---------------------
Gamekit modules are meant to be used to separate logic and information. Its necessary to
split your application (or game) into several Javascript files to maintain a cleaner code
structure and not loose yourself in your code.

My rule of thumb is: whenever something is re-usable at different parts of the application,
not necessarily required right from the beginning or complex enough to stand for its own,
you should separate it into a own module.

Gamekit modules should have _one_ module definition per file. The filename correlates directly
to the module name. For example, the module `main` should be saved as `main.js`.

Gamekit assumes all modules to be stored inside the same folder. This defaults to `lib/game/` and
can be changed at all time by altering the property `gamekit.moduleFolder`.

All modules that have been loaded are stored in gamekits module namespace `gamekit.m`. In case
of the main module, you can always access the module via `gamekit.m.main` after it has been loaded.


The anatomy of a gamekit module
-------------------------------
You can define gamekit modules by calling the method `gamekit.defineModule`. You pass a module
name and the module content to the method. For example:

    gamekit.defineModule('mainMenu', function(){
        //...
    });

The code above must be stored in the file `lib/game/mainMenu.js`. When the module is loaded,
gamekit checks if the module content is a function. If so, the function will be executed and
whatever it returns will be written to the module namespace. This is very useful if you want
to create complex modules but only want to expose a fixed API to interact with the module. In
this case you only return a object from the module content function that contains methods to
interact with the module itself.

If your module content is no executable function, it will directly be written into the module
namespace. You could for example have your item definition being a gamekit module:

    gamekit.defineModule('items', {
        "sword": ...
    });


Loading modules and waiting for the load
----------------------------------------
Since gamekit is completely promises-oriented, module loading is no exception.
To load one (or many) module(s), simply call `gamekit.fetchModules`. That method
returns a promise that is fulfilled after all modules have been loaded.

A quick example:

    gamekit
        .fetchModules(['menuButton', 'mainMenu'])
        .then(function(){
            //Interacting with a exposed API of the mainMenu module.
            gamekit.m.mainMenu.show();
        });

The code above makes gamekit load two modules - `menuButton` and `mainMenu` - after
they both have been loaded successfully, the callback is executed which opens the main
menu (assumed that the module has returned a object with a `show` method).


Modules depending on each other (requiring)
-------------------------------------------

Calling `gamekit.fetchModules` multiple times with the same module names doesn't make gamekit
reloading the given modules every time. If gamekit knows that a module has already been
loaded, it won't load it again. With that knowledge, its easy to make sure that other modules
have been loaded for a new module to work properly.

Here is an example:

    gamekit.defineModule('pauseMenu', function(){
        gamekit.fetchModules('menuButton')
            .then(function(){
                //Module definition here
            });
    });
