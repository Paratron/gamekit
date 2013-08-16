    //Asset loader.

    /**
     * This is the asset namespace.
     * All loaded assets are stored in here.
     * @type {{}}
     */
    gamekit.a = {};

    /**
     * The asset folder prefix to be used for loading assets.
     * @type {string}
     */
    gamekit.assetFolder = 'lib/assets/';

    /**
     * Loads a JSON file from the given url and parses it.
     * @param {String} url
     * @returns {gamekit.Promise}
     */
    gamekit.getJSON = function (url){
        var promise,
            s;

        promise = new gamekit.Promise();

        s = new XMLHttpRequest();
        s.onload = function (){
            var json;
            try {
                json = JSON.parse(s.responseText);
                promise.resolve(json);
            }
            catch (e) {
                promise.reject(e);
            }
        };
        s.onerror = promise.reject;
        s.open('get', url, true);
        s.send();

        return promise;
    };

    /**
     * Tries to load a number of given assets.
     *
     * When you pass a filename that ends to ".json" as a single string, the given filename is being loaded from
     * the asset folder and interpreted as a asset definition list to be loaded.
     *
     * The asset loader can automatically process sprite maps and sprite atlases.
     * Name your asset images like so: "myfile.smap.32x32.png" or "myfile.atlas.jpg" and gamekit will process them.
     * Make sure to place a "myfile.atlas.json" next to atlas images.
     *
     * @param {String|Array} assetNames Either a string, or array of asset file names.
     */
    gamekit.fetchAssets = function (assetNames){
        var promise,
            key,
            loadingAssets,
            loadedAssets,
            a,
            smapRegex,
            atlasRegex;

        promise = new gamekit.Promise();
        loadingAssets = [];
        loadedAssets = 0;
        smapRegex = /\.smap\.(\d+)x(\d+)\./;
        atlasRegex = /\.atlas\./;

        if(typeof assetNames === 'string'){
            if(assetNames.substr(-5) === '.json'){
                gamekit.getJSON(gamekit.assetFolder + assetNames)
                    .then(gamekit.fetchAssets)
                    .then(function (){
                        promise.resolve();
                    }, function (){
                        promise.reject();
                    });
                return promise;
            }
            assetNames = [assetNames];
        }

        function callbackFunction(){
            var result,
                that;

            //Determine if its a resource to be processed.
            result = this.src.match(smapRegex);
            if(result){
                gamekit.a[this.assetKey] = new gamekit.SpriteMap(gamekit.a[this.assetKey], parseInt(result[1], 10), parseInt(result[2], 10));
                loadedAssets++;
                if(loadedAssets === loadingAssets.length){
                    promise.resolve();
                }
            }

            result = this.src.match(atlasRegex);
            if(result){
                result = this.src.split('.');
                result.pop();
                result = result.join('.') + '.json';
                that = this;
                gamekit.getJSON(result).then(function (json){
                    gamekit.a[that.assetKey] = new gamekit.SpriteAtlas(gamekit.a[that.assetKey], json);
                    loadedAssets++;
                    if(loadedAssets === loadingAssets.length){
                        promise.resolve();
                    }
                });
                return;
            }

            loadedAssets++;
            if(loadedAssets === loadingAssets.length){
                promise.resolve();
            }
        }

        function errorFunction(){
            promise.reject();
        }

        for (key in assetNames) {
            assetNames[key] = assetNames[key].split(':');
            if(assetNames[key].length !== 2){
                promise.reject();
                return promise;
            }
            if(gamekit.a[assetNames[key][0]] === undefined){
                a = new Image();
                a.onload = callbackFunction;
                a.onerror = errorFunction;
                a.assetKey = assetNames[key][0];
                gamekit.a[assetNames[key][0]] = a;
                loadingAssets.push(assetNames[key]);
            }
        }

        if(loadingAssets.length){
            for (key in loadingAssets) {
                gamekit.a[loadingAssets[key][0]].src = gamekit.assetFolder + loadingAssets[key][1];
            }
        } else {
            promise.resolve();
        }

        return promise;
    };