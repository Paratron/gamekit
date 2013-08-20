/**
 * GameKit
 * =======
 * A approach to create a minimalistic toolkit for canvas games.
 *
 * @author: Christian Engel <hello@wearekiss.com>
 * @license: CC BY-NC 3.0 (http://creativecommons.org/licenses/by-nc/3.0/)
 * @license: Request commercial licenses from hello@wearekiss.com
 */
(function (){
    'use strict';

    var gamekit,
        canvas,
        ctx;

    canvas = document.getElementsByTagName('canvas')[0];
    ctx = canvas.getContext('2d');

    //RAF polyfill
    (function (){
        var lastTime = 0;
        var vendors = ['webkit', 'moz'];
        for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
            window.cancelAnimationFrame =
            window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
        }

        if(!window.requestAnimationFrame){
            window.requestAnimationFrame = function (callback){
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = window.setTimeout(function (){
                        callback(currTime + timeToCall);
                    },
                    timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };
        }

        if(!window.cancelAnimationFrame){
            window.cancelAnimationFrame = function (id){
                clearTimeout(id);
            };
        }
    }());

    //Initialize the gamekit namespace.
    window.gamekit = gamekit = {};


    //==================================================================================================================

    /**
     * Gamekits own implementation of commonJS Promises/A.
     * @param {Object} target Scope of the promise.
     * @constructor
     */
    gamekit.Promise = function (target){
        this._promiseTarget = target || gamekit;
    };
    gamekit.Promise.prototype = {
        resolve: function (){
            var result,
                that;

            //Has a soccess function already been attached?
            if(typeof this._promiseSuccess === 'function'){
                result = this._promiseSuccess.apply(this._promiseTarget, arguments);

                if(result instanceof gamekit.Promise){
                    that = this;
                    result.then(function (){
                        that._promiseChild.resolve.apply(that._promiseChild, arguments);
                    }, function (){
                        that._promiseChild.reject.apply(that._promiseChild, arguments);
                    });
                } else {
                    this._promiseChild.resolve.apply(this._promiseChild, result);
                }

                return;
            }

            this._promiseResolved = arguments;
        },
        reject: function (){
            var result,
                that;

            if(typeof this._promiseError === 'function'){
                result = this._promiseError.apply(this._promiseTarget, arguments);

                if(result instanceof gamekit.Promise){
                    that = this;
                    result.then(function (){
                        that._promiseChild.resolve.apply(that._promiseChild, arguments);
                    }, function (){
                        that._promiseChild.reject.apply(that._promiseChild, arguments);
                    });
                } else {
                    this._promiseChild.reject.apply(this._promiseChild, result);
                }

                return;
            }
            this._promiseRejected = arguments;
        },
        /**
         * Promise chaining method.
         * @param {Function} [success]
         * @param {Function} [error]
         * @returns {*}
         */
        then: function (success, error){
            this._promiseSuccess = success;
            this._promiseError = error;
            this._promiseChild = new gamekit.Promise(this._promiseTarget);

            //Has promise already been fulfilled or rejected?
            if(this._promiseResolved !== undefined){
                this._promiseChild.resolve.apply(this._promiseChild, this._promiseResolved);
            }

            if(this._promiseRejected !== undefined){
                this._promiseChild.reject.apply(this._promiseChild, this._promiseRejected);
            }

            return this._promiseChild;
        }
    };

    /**
     * This method accepts n promise elements and will resolve its own promise, when all received promises have been fulfilled.
     * If one of the promises fail, the methods promise will fail, too.
     * @param {...gamekit.Promise} promises Align as many promises as you wish.
     * @returns {gamekit.Promise}
     */
    gamekit.all = function(promises){
        var promise,
            responses,
            i;

        promise = new gamekit.Promise();
        responses = 0;

        function resolve(){
            responses++;
            if(responses === arguments.length){
                promise.resolve();
            }
        }

        for(i = 0; i < arguments.length; i++){
            arguments[i].then(resolve, promise.reject);
        }

        return promise;
    };

    //==================================================================================================================

    //Module support.
    /**
     * The module namespace.
     * Access all defined modules through this.
     * @type {{}}
     */
    gamekit.m = {};

    /**
     * The root folder of all game modules.
     * @type {string}
     */
    gamekit.moduleFolder = 'lib/game/';

    /**
     * Define a new module to be fetchable via dependsOn().
     * Defined modules can be accessed via gamekit.m.moduleName
     * @param {String} name The module name/key
     * @param {Function} code The initialization function
     */
    gamekit.defineModule = function (name, code){
        gamekit.m[name] = code();
    };

    /**
     * Require function for modules. Loads module files dynamically if not yet present in the namespace.
     * @param {String|Array} moduleNames Either a string (for one module), or an array of strings.
     * @returns {gamekit.Promise}
     */
    gamekit.fetchModules = function (moduleNames){
        var key,
            promise,
            modulesLoading,
            loadCounter,
            s;

        promise = new gamekit.Promise();
        modulesLoading = [];
        loadCounter = 0;

        if(typeof moduleNames === 'string'){
            moduleNames = [moduleNames];
        }

        function loadCallback(){
            loadCounter++;
            if(loadCounter === modulesLoading.length){
                promise.resolve();
            }
        }

        function errorCallback(){
            promise.reject();
        }

        for (key in moduleNames) {
            //TODO: possible multiple load attempts because it doesn't remember previous attempts.
            if(gamekit.m[moduleNames[key]] === undefined){
                modulesLoading.push(gamekit.moduleFolder + moduleNames[key] + '.js');
            }
        }

        if(modulesLoading.length){
            for (key in modulesLoading) {
                s = document.createElement('script');
                s.onload = loadCallback;
                s.onerror = errorCallback;
                document.head.appendChild(s);
                s.src = modulesLoading[key];
                modulesLoading[key] = s;
            }
        } else {
            promise.resolve();
        }

        return promise;
    };;

    //==================================================================================================================

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
    };;

    /**
     * Automatically splits an image into a sprite map and makes tiles accessible via index.
     * @param {Image} imageObj
     * @param {Number} tileW
     * @param {Number} tileH
     * @constructor
     */
    gamekit.SpriteMap = function (imageObj, tileW, tileH){
        //TODO: implement spritemap
    };;

    gamekit.SpriteAtlas = function (imageObj, jsonConfig){
        //TODO: implement spriteatlas
    };;

    //==================================================================================================================

    /**
     * The gamekit layers are used to render on multiple levels.
     * @type {Array}
     */
    function GamekitLayer(){
        this.entities = [];
        this.visible = true;
        this.alpha = 1;
    }

    GamekitLayer.prototype = {
        attach: function (element){
            this.entities.push(element);
        }
    };

    gamekit.layer = [new GamekitLayer()];

    /**
     * Adds a new layer on top.
     */
    gamekit.createLayer = function (){
        var l;
        l = new GamekitLayer();

        gamekit.layer.push(l);

        return l;
    };;

    //==================================================================================================================

    var gameRunning,
        lastRunTime;

    /**
     * This starts the main loop.
     */
    gamekit.start = function (){
        gameRunning = true;
        window.requestAnimationFrame(mainLoop);
    };

    /**
     * This breaks the main loop.
     */
    gamekit.stop = function (){
        gameRunning = false;
    };

    gamekit.width = function (){
        return canvas.width;
    };

    gamekit.height = function (){
        return canvas.height;
    };


    var clearX,
        clearY,
        clearW,
        clearH;
    /**
     * Define a area to be cleared on every frame.
     * @param {Number} [x=0]
     * @param {Number} [y=0]
     * @param {Number} [w=gamekit.width()]
     * @param {Number} [h=gamekit.height()]
     */
    gamekit.clearCanvas = function (x, y, w, h){
        clearX = x || 0;
        clearY = y || 0;
        clearW = w || gamekit.width();
        clearH = h || gamekit.height();
    };

    function mainLoop(runTime){
        var i,
            j,
            e,
            l,
            c,
            layerLen,
            entityLen,
            canvasWidth,
            canvasHeight;

        if(!gameRunning){
            return;
        }

        window.requestAnimationFrame(mainLoop);

        //Update the last run time for the tween processing.
        lastRunTime = runTime;

        c = ctx;
        canvasWidth = gamekit.width();
        canvasHeight = gamekit.height();

        if(clearW || clearH){
            c.clearRect(clearX, clearY, clearW, clearH);
        }

        //Lets update all tweens, first.
        for(i = tweenQueue.length; i--;){
            j = tweenQueue[i];
            if(j.finished){
                tweenQueue.splice(i, 1);
                continue;
            }

            j.update(runTime);
        }

        layerLen = gamekit.layer.length - 1;
        for (i = layerLen+1; i--;) {
            l = gamekit.layer[layerLen - i];
            if(!l.visible || !l.alpha){
                continue;
            }

            entityLen = l.entities.length - 1;
            for (j = entityLen+1; j--;) {
                e = l.entities[entityLen-j];
                if(e.rotation > 360){
                    e.rotation -= 360;
                }
                c.globalAlpha = e.alpha * l.alpha;

                e.draw(c);

            }
        }
    };

    //==================================================================================================================

    var tweenQueue;

    /**
     * Tell gamekit to render the origin point of each object for debugging.
     * @type {boolean} [renderDebugObjects=false]
     */
    gamekit.renderDebugObjects = false;

    /**
     * The tween queue keeps references to all active tweens.
     * The main loop iterates over this array and updates all tweens on every frame.
     * @type {Array}
     */
    tweenQueue = [];

    /**
     * Most basic element to be drawn on a screen.
     * @constructor
     */
    gamekit.Sprite = function (asset){
        this.x = 0;
        this.y = 0;
        this.w = asset.width;
        this.h = asset.height;
        this.originX = 0;
        this.originY = 0;
        this.rotation = 0;
        this.scale = 1;
        this.alpha = 1;
        this.stretch = false;
        this.asset = asset;
    };
    gamekit.Sprite.prototype = {
        draw: function (ctx){
            var w,
                h,
                oX,
                oY;

            w = this.w * this.scale;
            h = this.h * this.scale;
            oX = this.originX * this.scale;
            oY = this.originY * this.scale;

            ctx.save();
            ctx.translate(this.x, this.y);


            if(this.rotation){
                ctx.rotate(this.rotation * Math.PI / 360);
            }

            if(!this.stretch && (w !== this.asset.width || h !== this.asset.height)){
                if(!this.pattern){
                    this.pattern = ctx.createPattern(this.asset, 'repeat');
                }
                ctx.rect(-oX, -oY, w, h);
                ctx.fillStyle = this.pattern;
                ctx.fill();
                ctx.restore();
                return;
            }

            ctx.drawImage(this.asset, -oX, -oY, w, h);

            if(gamekit.renderDebugObjects){
                ctx.beginPath();
                ctx.strokeStyle = '#0ff';
                ctx.strokeRect(-oX, -oY, w, h);
                ctx.stroke();
                ctx.fillStyle = '#f0f';
                ctx.beginPath();
                ctx.arc(0, 0, 2, 0, 365);
                ctx.fill();
            }

            ctx.restore();
        },
        /**
         * Update the sprites origin coordinates to the center of the sprite.
         * Will also update the sprites position to keep it on the same place on screen.
         * @return this
         */
        centerOrigin: function (){
            this.changeOrigin(this.w / 2, this.h / 2);

            return this;
        },
        /**
         * Update the sprites origin coordinates to any point and update the sprites position to keep it on the same place on screen.
         * @param {Number} x
         * @param {Number} y
         * @return this
         */
        changeOrigin: function (x, y){
            var oldOriginX,
                oldOriginY;

            oldOriginX = this.originX;
            oldOriginY = this.originY;

            this.x += -oldOriginX + x;
            this.y += -oldOriginY + y;

            this.originX = x;
            this.originY = y;

            return this;
        },
        /**
         * Morph one or more numeric properties of the object across a specified amount of time.
         * @param {Object} properties Target values for one or more numeric properties of the object.
         * @param {Number} duration Duration of the morphing process in milliseconds.
         * @returns {gamekit.Promise}
         */
        tween: function (properties, duration){
            var beginTime,
                endTime,
                queueObject,
                promise,
                that,
                startProperties,
                diffs,
                propertiesUsed,
                key;

            beginTime = lastRunTime;
            endTime = beginTime + duration;
            promise = new gamekit.Promise();
            that = this;
            startProperties = {};
            diffs = {};
            propertiesUsed = 0;

            for (key in properties) {
                //Only keep properties that are actually animatable.
                //That are properties that are part of the object, as well as numerics.
                if(this.hasOwnProperty(key) && (!isNaN(parseFloat(this[key])) && isFinite(this[key]))){
                    startProperties[key] = this[key];
                    diffs[key] = properties[key] - this[key];
                    propertiesUsed++;
                }
            }

            if(!propertiesUsed){
                promise.reject();
                return promise;
            }

            queueObject = {
                finished: false,
                update: function (currentTime){
                    var t;

                    if(beginTime === undefined){
                        beginTime = currentTime;
                        endTime = beginTime + duration;
                    }

                    t = 1 - 1 / ((endTime - beginTime) / (endTime - currentTime));

                    if(t >= 1){
                        t = 1;
                    }

                    for (key in startProperties) {
                        that[key] = startProperties[key] + (diffs[key] * t);
                    }

                    if(t === 1){
                        queueObject.finished = true;
                        promise.resolve();
                        return;
                    }
                }
            };

            tweenQueue.push(queueObject);

            return promise;
        },
        /**
         * Creates a static version of a tween that can be stored and executed at any time.
         * @param {Object} properties Target values for one or more numeric properties of the object.
         * @param {Number} duration Duration of the morphing process in milliseconds.
         * @returns {Function} The function to be called to actually execute the tween.
         */
        prepareTween: function (properties, duration){
            var that;

            that = this;

            return function (){
                return that.tween(properties, duration);
            };
        }
    };;

    //==================================================================================================================

    //The main module is required and automatically loaded.
    //Its set into a setTimout so the dev can overwrite the moduleFolder and assetFolder properties of the gamekit object before its initializing the game.
    setTimeout(function (){
        gamekit.fetchModules('main');
    }, 0);

})();