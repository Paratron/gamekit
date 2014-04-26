conf:{
    "key": "assetloading",
    "title": "Loading Assets"
}:conf

#Loading assets

Like most other HTML5 game engines, gamekit also includes an asset loader to fetch the resources needed
for your game.

The gamekit asset loader will store all loaded assets in a namespace much like the module namespace of
the module loader. All loaded assets are accessible via `gamekit.a.*`, where the * stands for the particular
key of each asset.

The asset loader will make intelligent guesses what kind of asset you are loading by looking at its URL.
You can load "plain" images, or even spritemaps or sprite atlases.

The asset loader also supports loading assets in bulks, by defining asset lists and saving them in a JSON file.


##Loading an asset
By default, the asset loader will look into the folder `lib/assets/` for the files you pass to it.

You can change that folder by overwriting the value of `gamekit.assetFolder`.

The filenames of loaded assets are automatically converted into asset keys so you can access your assets
from your game logic. If you want to, you can also set manual asset keys for your assets.

Here is a example:

    gamekit.loadAssets('myImage.png');

Will load the file `lib/assets/myImage.png` and makes it accessible through `gamekit.a.myImage`.

    gamekit.loadAssets('myKey:someImage.png');

Will load the file `lib/assets/someImage.png` and makes it accessible through `gamekit.a.myKey`.



##Loading special assets
You can give hints to gamekit to load spritemaps or sprite atlases. To load a spritemap, directly
parse it and convert it into a spritemap object before the asset is written into the asset namespace,
name your file like so:

    myMap.smap.32x32.png

This is an example. Gamekit will look for the keyword `.smap.` and the definition of the tile size `32x32`.
The spritemap in our example will be made available as `gamekit.a.myMap` after it has been loaded and parsed.

To load a sprite atlas, name your file like so:

    myAtlas.atlas.png

In this case, gamekit will look for a corresponding JSON file named `myAtlas.json` and tries to load it to
fetch sprite positions and dimensions as well as their keys from it. The spriteatlas object from our example
will be made available under `gamekit.a.myAtlas`.


##Loading multiple assets
Passing an array of strings instead of a single string to the `loadAssets()` method will make it load all given
assets at once. You can go even further and pass the name of a JSON file to the method, which will cause gamekit
to load the file and thread its contents as a loading list.

Here is a example of such a JSON file:

    [
        "something:myImage.png",
        "image2.png",
        "closeButton:btn-close-window.png",
        "level1:level1.smap.32x32.png
    ]


##Handling the load
As anything else that performs asynchronous operations in gamekit, the asset loader will return a promise that
you can observe to check the results of your asset loading. If all assets have been loaded, the promise will be
resolved; if the load of one of the passet resources has failed, the promise is rejected.