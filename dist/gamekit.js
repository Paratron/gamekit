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

            //Has a success function already been attached?
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
    gamekit.all = function (promises){
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

        for (i = 0; i < arguments.length; i++) {
            arguments[i].then(resolve, promise.reject);
        }

        return promise;
    };

    /**
     * This will return a function, that will execute the functions passed to gamekit.chain() in the order they have
     * been passed.
     * If the chained functions return promises, the execution of the next function in the chain will wait until the
     * promise is resolved.
     *
     * The returned chained function will return a promise upon execution.
     * @param {...Function} functions
     * @returns {Function} Executes the chain upon call. Returns a promise.
     */
    gamekit.chain = function (functions){
        var chain;

        chain = arguments;

        return function (){
            var index,
                promise;

            index = 0;
            promise = new gamekit.Promise();

            function callNext(){
                var result;

                if(index >= chain.length){
                    promise.resolve();
                    return;
                }

                result = chain[index]();

                index++;

                if(result instanceof gamekit.Promise){
                    result.then(function (){
                        callNext();
                    });
                    return;
                }
                callNext();
            }

            callNext();

            return promise;
        };
    };

    /**
     * Works much alike gamekit.chain(), but all given functions will be executed right away.
     * If the paralleled functions return promises, the returned paralleled function will wait to resolve its promise,
     * until the last promise of any given function has been resolved.
     *
     * The returned paralleled function will return a promise upon execution.
     * @param {...Function} functions
     * @returns {Function} Executes the paralleled functions upon call. Returns a promise.
     */
    gamekit.parallel = function (functions){
        var chain;

        chain = arguments;

        return function (){
            var index,
                toResolve,
                promise;

            index = 0;
            promise = new gamekit.Promise();
            toResolve = chain.length;

            function callFinished(){
                toResolve--;

                if(toResolve === 0){
                    promise.resolve();
                    return;
                }
            }

            function callNext(){
                var result;

                if(index >= chain.length){
                    return;
                }

                result = chain[index]();

                index++;

                if(result instanceof gamekit.Promise){
                    result.then(callFinished);
                } else {
                    callFinished();
                }

                callNext();
            }

            callNext();

            return promise;
        }
    };

    /**
     * Will return a function that upon call returns a promise that will be resolved after the given amount of milliseconds.
     * Made to just pause promise chains with an eye on animation.
     * @param {Number} duration
     * @returns {Function}
     */
    gamekit.wait = function (duration){
        return function (){
            var promise,
                queueObject,
                beginTime,
                endTime;

            promise = new gamekit.Promise();
            beginTime = lastRunTime;
            endTime = beginTime + duration;

            queueObject = {
                finished: false,
                update: function (currentTime){
                    if(beginTime === undefined){
                        beginTime = currentTime;
                        endTime = beginTime + duration;
                    }

                    if(currentTime >= endTime){
                        queueObject.finished = true;
                        promise.resolve();
                    }
                }
            };

            tweenQueue.push(queueObject);

            return promise;
        };
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
        /**
         * Adds a new renderable entity (Sprite, Group) to the layer.
         * @param {*} element
         */
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

    /**
     * Called, before each rendered frame.
     * Can be overwritten with custom functions.
     * @param {CanvasContext2D} ctx
     */
    gamekit.onBeforeFrame = function (){
    };

    /**
     * Called, after each rendered frame.
     * Can be overwritten with custom functions.
     * @param {CanvasContext2D} ctx
     */
    gamekit.onAfterFrame = function (){
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
            entityLen;

        if(!gameRunning){
            return;
        }

        window.requestAnimationFrame(mainLoop);

        //Update the last run time for the tween processing.
        lastRunTime = runTime;

        c = ctx;

        gamekit.onBeforeFrame(c);

        if(clearW || clearH){
            c.clearRect(clearX, clearY, clearW, clearH);
        }

        //Lets update all tweens, first.
        for (i = tweenQueue.length; i--;) {
            j = tweenQueue[i];
            if(j.finished){
                tweenQueue.splice(i, 1);
                continue;
            }

            j.update(runTime);
        }

        layerLen = gamekit.layer.length - 1;
        for (i = layerLen + 1; i--;) {
            l = gamekit.layer[layerLen - i];
            if(!l.visible || !l.alpha){
                continue;
            }

            entityLen = l.entities.length - 1;
            for (j = entityLen + 1; j--;) {
                e = l.entities[entityLen - j];

                c.globalAlpha = e.alpha * l.alpha;

                e.update();
                e.draw(c);
            }
        }

        gamekit.onAfterFrame(c);
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
        this.scaleX = 1;
        this.scaleY = 1;
        this.alpha = 1;
        this.stretch = false;
        this.asset = asset;
        this.debugDrawing = false;
    };
    gamekit.Sprite.prototype = {
        update: function(){},
        draw: function (ctx){
            var w,
                h,
                oX,
                oY;

            oX = this.originX;
            oY = this.originY;
            w = this.w;
            h = this.h;

            ctx.save();
            ctx.translate(this.x, this.y);

            if(this.rotation){
                ctx.rotate(this.rotation * Math.PI / 180);
            }

            ctx.scale(this.scaleX, this.scaleY);

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

            if(this.debugDrawing){
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
                key,
                matchresult;

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
                if(!this.hasOwnProperty(key)){
                    continue;
                }

                //Relative string target
                if(typeof properties[key] === 'string'){
                    matchresult = properties[key].match(/^([+-])=(\d+)$/);
                    if(matchresult){
                        startProperties[key] = this[key];
                        if(matchresult[1] === '+'){
                            diffs[key] = parseFloat(matchresult[2]);
                        } else {
                            diffs[key] = -parseFloat(matchresult[2]);
                        }
                        propertiesUsed++;
                    }
                    continue;
                }

                //Absolute numeric target
                if(!isNaN(parseFloat(this[key])) && isFinite(this[key])){
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

/**
 * A group object can be used to group multiple gamekit.Sprite objects together, to move and rotate them at once.
 * @constructor
 */
gamekit.Group = function (){
    this.x = 0;
    this.y = 0;
    this.rotation = 0;
    this.alpha = 1;
    this.scaleX = 1;
    this.scaleY = 1;
    this.entities = [];
    this.debugDrawing = false;
};
gamekit.Group.prototype = {
    update: function(){},
    /**
     * Returns the boundary dimensions of this group.
     * @returns {*}
     */
    getBoundaries: function (){
        var x,
            y,
            w,
            h,
            key,
            e;

        x = Number.POSITIVE_INFINITY;
        y = Number.POSITIVE_INFINITY;
        w = 0;
        h = 0;

        if(!this.entities.length){
            return {
                x: this.x,
                y: this.y,
                w: 0,
                h: 0
            };
        }

        for (key in this.entities) {
            e = this.entities[key];
            if(e.originX !== undefined){
                x = Math.min(x, e.x - e.originX);
                y = Math.min(y, e.y - e.originY);
                w = Math.max(w, e.x + e.w - e.originX);
                h = Math.max(h, e.y + e.h - e.originY);
            } else {
                x = Math.min(x, e.x);
                y = Math.min(y, e.y);
                w = Math.max(w, e.x + e.w);
                h = Math.max(h, e.y + e.h);
            }
        }

        w -= x;
        h -= y;

        return {
            x: x,
            y: y,
            w: w,
            h: h
        };
    },
    /**
     * Adds a new renderable entity (Sprite, Group) to the layer.
     * @param {*} element
     */
    attach: function (element){
        this.entities.push(element);
    },
    draw: function (ctx){
        var alpha,
            key,
            e;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 360);
        ctx.scale(this.scaleX, this.scaleY);

        alpha = ctx.globalAlpha;

        for (key in this.entities) {
            e = this.entities[key];

            ctx.globalAlpha = alpha * e.alpha;

            e.update();
            e.draw(ctx);
        }

        if(this.debugDrawing){
            var bounds;
            bounds = this.getBoundaries();
            ctx.beginPath();
            ctx.strokeStyle = '#0f0';
            ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);
            ctx.stroke();
            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            ctx.arc(0, 0, 2, 0, 365);
            ctx.fill();
        }


        ctx.restore();
    },
    /**
     * Update the groups origin position to any point and update the positions of all contained entities
     * so they remain at their current visual position.
     * @param {Number} x
     * @param {Number} y
     * @return this
     */
    changeOrigin: function (x, y){
        var oldX,
            oldY,
            key,
            e;

        oldX = this.x;
        oldY = this.y;

        for (key in this.entities) {
            e = this.entities[key];
            e.x -= -oldX + x;
            e.y -= -oldY + y;
        }

        this.x = x;
        this.y = y;

        return this;
    }
};

gamekit.Group.prototype.tween = gamekit.Sprite.prototype.tween;
gamekit.Group.prototype.prepareTween = gamekit.Sprite.prototype.prepareTween;;

    //==================================================================================================================

var keyboardInputInitialized,
    pointerInputInitialized,
    keyboardInputListeners,
    keymap,
    shadowCtx;

keymap = {
    8: 'backspace',
    9: 'tab',
    13: 'enter',
    16: 'shift',
    17: 'ctrl',
    18: 'alt',
    19: 'pause',
    20: 'capslock',
    27: 'escape',
    32: 'space',
    33: 'pageup',
    34: 'pagedown',
    35: 'end',
    36: 'home',
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down',
    45: 'insert',
    46: 'delete',

    48: '0',
    49: '1',
    50: '2',
    51: '3',
    52: '4',
    53: '5',
    54: '6',
    55: '7',
    56: '8',
    57: '9',

    65: 'a',
    66: 'b',
    67: 'c',
    68: 'd',
    69: 'e',
    70: 'f',
    71: 'g',
    72: 'h',
    73: 'i',
    74: 'j',
    75: 'k',
    76: 'l',
    77: 'm',
    78: 'n',
    79: 'o',
    80: 'p',
    81: 'q',
    82: 'r',
    83: 's',
    84: 't',
    85: 'u',
    86: 'v',
    87: 'w',
    88: 'x',
    89: 'y',
    90: 'z',

    91: 'win',

    96: '0',
    97: '1',
    98: '2',
    99: '3',
    100: '4',
    101: '5',
    102: '6',
    103: '7',
    104: '8',
    105: '9',
    106: '*',
    107: '+',
    109: '-',

    111: '/',
    112: 'f1',
    113: 'f2',
    114: 'f3',
    115: 'f4',
    116: 'f5',
    117: 'f6',
    118: 'f7',
    119: 'f8',
    120: 'f9',
    121: 'f10',
    122: 'f11',
    123: 'f12',
    144: 'numlock',
    145: 'scrolllock',
    186: ';',
    187: '+',
    188: ',',
    189: '-',
    190: '.',
    191: '/',
    192: '`',
    219: '(',
    220: '^',
    221: '´',
    222: '`',
    226: '\\'
};

function inputInitKeyboard(){
    if(keyboardInputInitialized){
        return;
    }

    keyboardInputListeners = {};

    window.onkeydown = function (e){
        var keyname,
            key;

        keyname = keymap[e.keyCode];

        if(!keyname){
            return;
        }

        if(keyboardInputListeners[keyname] === undefined){
            return;
        }

        for (key in keyboardInputListeners[keyname]) {
            keyboardInputListeners[keyname][key].resolve();
        }
    };

    keyboardInputInitialized = true;
}

//---------------------------------------------------------------------------

var pointerCaptureDown,
    pointerCaptureUp,
    pointerCaptureMove;

function inputInitPointers(){
    var shadowCanvas;

    if(pointerInputInitialized){
        return;
    }

    pointerInputInitialized = true;

    shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = canvas.width;
    shadowCanvas.height = canvas.height;
    shadowCtx = shadowCanvas.getContext('2d');
    shadowCtx.globalCompositeOperation = 'copy';
    shadowCtx.fillStyle = '#f00';

    canvas.onmousedown = function (e){
        if(!pointerCaptureDown){
            return;
        }
        tracePointer(e, 'pointerdown');
    };

    canvas.onmouseup = function (e){
        if(!pointerCaptureUp){
            return;
        }
        tracePointer(e, 'pointerup');
    };

    canvas.onmousemove = function (e){
        if(!pointerCaptureMove){
            return;
        }
        tracePointer(e, 'pointermove');
    };

    canvas.ontouchstart = function (e){
        if(!pointerCaptureDown){
            return;
        }
        tracePointer(e, 'pointerdown');
    };

    canvas.ontouchend = function (e){
        if(!pointerCaptureUp){
            return;
        }
        tracePointer(e, 'pointerdown');
    };

    canvas.ontouchmove = function(e){
        if(!pointerCaptureMove){
            return;
        }
        tracePointer(e, 'pointermove');
    };
}

/**
 * Notice: Disabled PointerAreas are not triggered!
 * @param e
 */
function tracePointer(e, eventname){
    var x,
        y,
        layerLen,
        l,
        entityLen,
        j,
        i;

    x = e.clientX - canvas.offsetLeft + window.scrollX;
    y = e.clientY - canvas.offsetTop + window.scrollY;

    if(!gameRunning){
        return;
    }

    layerLen = gamekit.layer.length - 1;
    for (i = layerLen + 1; i--;) {
        l = gamekit.layer[layerLen - i];
        if(!l.visible){
            continue;
        }

        entityLen = l.entities.length - 1;
        for (j = entityLen + 1; j--;) {
            e = l.entities[entityLen - j];
            if(e.disabled){
                continue;
            }
            e.shadowDraw(x, y, eventname);
        }
    }
}

function pointerHitTest(x, y){
    var pData;

    pData = shadowCtx.getImageData(x, y, 1, 1).data;

    if(pData[0] || pData[1] || pData[2] || pData[3]){
        return true;
    }
    return false;
}


/**
 * The pointer area is an invisible object to be added to a layer or entity group.
 * When on stage, it captures clicks/taps that are made inside the specified area.
 * @constructor
 */
gamekit.PointerArea = function (){
    inputInitPointers();
    this.x = 0;
    this.y = 0;
    this.w = gamekit.width();
    this.h = gamekit.height();
    this.originX = 0;
    this.originY = 0;
    this.rotation = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this._attachedEvents = {};
    this.debugDrawing = false;
    this.disabled = false;
};
gamekit.PointerArea.prototype = {
    draw: function (ctx){
        if(!this.debugDrawing){
            return;
        }

        ctx.save();

        ctx.translate(this.x, this.y);
        if(this.rotation){
            ctx.rotate(this.rotation * Math.PI / 180);
        }

        ctx.scale(this.scaleX, this.scaleY);

        ctx.beginPath();
        ctx.strokeStyle = '#fff';
        ctx.stroke();

        ctx.restore();
    },
    shadowDraw: function (x, y, eventname){
        if(this instanceof gamekit.Sprite && this.disabled === undefined){
            return;
        }

        if(this instanceof gamekit.PointerArea && this._attachedEvents[eventname] === undefined){
            return;
        }

        var key;

        shadowCtx.save();

        shadowCtx.translate(this.x, this.y);

        if(this.rotation){
            shadowCtx.rotate(this.rotation * Math.PI / 180);
        }

        shadowCtx.scale(this.scaleX, this.scaleY);

        if(this instanceof gamekit.Sprite && !this._captureBoundingBox){
            shadowCtx.drawImage(this.asset, -this.originX, -this.originY);
            if(pointerHitTest(x, y)){
                for (key in this._attachedEvents[eventname]) {
                    this._attachedEvents[eventname][key].resolve(x, y);
                }
            }
        }

        if(this instanceof gamekit.PointerArea || (this._captureBoundingBox)){
            shadowCtx.beginPath();
            shadowCtx.fillRect(-this.originX, -this.originY, this.w, this.h);
            shadowCtx.fill();
            if(pointerHitTest(x, y)){
                for (key in this._attachedEvents[eventname]) {
                    this._attachedEvents[eventname][key].resolve(x, y);
                }
            }
        }

        if(this instanceof gamekit.Group){
            for (key in this.entities) {
                this.entities[key].shadowDraw(x, y, eventname);
            }
        }

        shadowCtx.restore();
    },
    /**
     * Returns a promise for the desired event, that gets resolved whenever the event occurs.
     * @param {String} eventName Possible events are: pointerdown, pointerup, pointermove
     * @returns {gamekit.Promise}
     */
    on: function (eventName){
        if(this._attachedEvents[eventName] === undefined){
            this._attachedEvents[eventName] = [];
        }

        var promise;

        promise = new gamekit.Promise();

        switch (eventName) {
        case 'pointerdown':
            pointerCaptureDown = true;
            break;
        case 'pointerup':
            pointerCaptureUp = true;
            break;
        case 'pointermove':
            pointerCaptureMove = true;
        }

        this._attachedEvents[eventName].push(promise);

        return promise;
    }
};

gamekit.Sprite.prototype.shadowDraw = gamekit.PointerArea.prototype.shadowDraw;
gamekit.Group.prototype.shadowDraw = gamekit.PointerArea.prototype.shadowDraw;

/**
 * Enable this sprite for capturing pointer events.
 * This adds the method on() to the sprite object and will start capturing pointer events.
 * @param {Boolean} [onBoundingBox=false] Set to true to capture touches within the sprites bounding box, instead within the pixel-perfect asset content. Default = false
 */
gamekit.Sprite.prototype.pointerEnable = function (onBoundingBox){
    inputInitPointers();
    this._captureBoundingBox = onBoundingBox;
    this._attachedEvents = {};
    this.disabled = false;
    this.on = gamekit.PointerArea.prototype.on;
};


gamekit.input = {
    onKey: function (keyname){
        var promise;

        inputInitKeyboard();

        promise = new gamekit.Promise();

        if(keyboardInputListeners[keyname] === undefined){
            keyboardInputListeners[keyname] = [];
        }

        keyboardInputListeners[keyname].push(promise);

        return promise;
    }
};;

    //==================================================================================================================

/**
 * Limits the given function and only allows calls to it after the defined waiting time has passed.
 * All calls in between are being dropped.
 * @param {Function} func The function to be limited
 * @param {Number} timeSpacing The amount of time to wait between calls in milliseconds.
 * @return {Function} The limited function.
 */
gamekit.limitCalls = function(func, timeSpacing){
    var lastCall;

    lastCall = 0;

    return function(){
        if(Date.now() < lastCall + timeSpacing){
            return;
        }

        lastCall = Date.now();
        func.apply(this, arguments);
    }
};

/**
 * Attempts to clone a object.
 * @param obj
 */
gamekit.clone = function(obj){
    var out;

    if(obj instanceof gamekit.Sprite){
        out = new gamekit.Sprite(out.asset);
    }

    if(obj instanceof gamekit.Group){
        out = new gamekit.Group();
    }

    if(out === undefined){
        out = {};
    }


};;

    //==================================================================================================================

    //The main module is required and automatically loaded.
    //Its set into a setTimout so the dev can overwrite the moduleFolder and assetFolder properties of the gamekit object before its initializing the game.
    setTimeout(function (){
        gamekit.fetchModules('main');
    }, 0);

})();