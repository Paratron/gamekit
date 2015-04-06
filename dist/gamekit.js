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

    var gamekit;

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

/**
 * Core
 * ====
 * The core manages the used canvas and renders the game to it. It calls the update() methods of
 * all renderable Elements.
 * @param conf
 * @constructor
 */
gamekit.Core = function (conf){
    var isRunning,
        lastRunTime,
        canvas,
        ctx,
        that,
        onBeforeFrame,
        onAfterFrame,
        tweenQueue,
        fps,
        fpsBuffer,
        lastFPSReset;

    //===================================================

    that = this;

    canvas = document.getElementsByTagName('canvas');
	if(canvas.length){
		canvas = canvas[0];
		ctx = canvas.getContext('2d');
	} else {
		canvas = null;
		ctx = null;
	}

    tweenQueue = [];
    fps = 0;
    fpsBuffer = 0;
    lastFPSReset = 0;

    this.isRunning = false;
    this.layer = [];
    this.getLastRuntime = function (){
        return lastRunTime;
    };

    this.useCanvas = function (elm){
        if(typeof elm == 'string'){
            if(elm[0] === '#'){
                elm = elm.substr(1);
            }
            canvas = document.getElementById(elm);
            ctx = canvas.getContext('2d');
            return this;
        }

        canvas = elm;
        ctx = canvas.getContext('2d');

        return this;
    };

    this.start = function (){
        this.isRunning = isRunning = true;
        window.requestAnimationFrame(mainLoop);
        return this;
    };

    this.stop = function (){
        this.isRunning = isRunning = false;
        return this;
    };

    this.width = function (newWidth){
        if(newWidth){
            canvas.width = newWidth;
        }
        return canvas.width;
    };

    this.height = function (newHeight){
        if(newHeight){
            canvas.height = newHeight;
        }
        return canvas.height;
    };

    this.addTween = function (tween){
        tweenQueue.push(tween);
    };

    /**
     * The "camera" is simply a offset that is applied to all elements in the root level.
     * @type {{x: number, y: number}}
     */
    this.camera = {
        x: 0,
        y: 0
    };

    /**
     * Called, before each rendered frame.
     * Can be overwritten with custom functions.
     * @param {CanvasContext2D} ctx
     */
    onBeforeFrame = function (){
    };

    this.setOnBeforeFrame = function (func){
        onBeforeFrame = func;
        return this;
    };

    /**
     * Called, after each rendered frame.
     * Can be overwritten with custom functions.
     * @param {CanvasContext2D} ctx
     */
    onAfterFrame = function (){
    };

    this.setOnAfterFrame = function (func){
        onAfterFrame = func;
        return this;
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
     * @return Core
     */
    this.clearCanvas = function (x, y, w, h){
        clearX = x || 0;
        clearY = y || 0;
        clearW = w || this.width();
        clearH = h || this.height();
        return this;
    };

    /**
     * Returns a reference to the currently used Canvas DOM element.
     * @returns {*}
     */
    this.getCanvas = function (){
        return canvas;
    };

    /**
     * Returns a reference to the canvas context object.
     * @returns {CanvasRenderingContext2D}
     */
    this.getCTX = function (){
        return ctx;
    };

    this.getFPS = function(){
        return fps;
    };

    function mainLoop(runTime){
        var i,
            j,
            l,
            layer,
            layerLen;

        layer = that.layer;

        if(!isRunning){
            return;
        }

        fpsBuffer++;
        if(lastFPSReset < runTime - 1000){
            fps = fpsBuffer;
            fpsBuffer = 0;
            lastFPSReset = runTime;
        }

        window.requestAnimationFrame(mainLoop);

        //Update the last run time for the tween processing.
        that.lastRunTime = lastRunTime = runTime;

        onBeforeFrame(ctx);

        if(clearW || clearH){
            ctx.clearRect(clearX, clearY, clearW, clearH);
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

        layerLen = layer.length - 1;
        for (i = layerLen + 1; i--;) {
            l = layer[layerLen - i];
            if(!l.visible || !l.alpha){
                continue;
            }

            l.draw(ctx);
        }

        onAfterFrame(ctx);
    }
};;

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
    progress: function (){
        if(typeof this._promiseProgress === 'function'){
            this._promiseProgress.apply(this._promiseTarget, arguments);
        }
    },
    /**
     * Promise chaining method.
     * @param {Function} [success]
     * @param {Function} [error]
     * @returns {*}
     */
    then: function (success, error, progress){
        this._promiseSuccess = success;
        this._promiseError = error;
        this._promiseProgress = progress;
        this._promiseChild = new gamekit.Promise(this._promiseTarget);

        //Has promise already been fulfilled or rejected?
        if(this._promiseResolved !== undefined){
			this.resolve.apply(this, this._promiseResolved);
        }

        if(this._promiseRejected !== undefined){
			this.reject.apply(this, this._promiseRejected);
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
gamekit.all = gamekit.Promise.all = function (){
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
gamekit.chain = gamekit.Promise.chain = function (){
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
gamekit.parallel = gamekit.Promise.parallel = function (){
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
gamekit.wait = gamekit.Promise.wait = function (duration){
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
        gamekit.m[name] = (typeof code === 'function') ? code() : code;

        //For module definitions that return a promise.
        if(gamekit.m[name] instanceof gamekit.Promise){
            gamekit.m[name].then(function(pChild, result){
                gamekit.m[name] = result;
            });
        }
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
gamekit.loadAssets = function (assetNames){
	var promise,
		i,
		loadingAssets,
		loadedAssets,
		a,
		smapRegex,
		atlasRegex,
		xAssetKey;

	promise = new gamekit.Promise();
	loadingAssets = [];
	loadedAssets = 0;
	smapRegex = /\.smap\.(\d+)x(\d+)\./;
	atlasRegex = /\.atlas\./;

	if(typeof assetNames === 'string'){

		//Has it already been loaded?
		xAssetKey = assetNames.split(':');
		if(xAssetKey.length === 1){
			xAssetKey = xAssetKey[0].split('.');
		}
		if(gamekit.a[xAssetKey[0]] !== undefined){
			promise.resolve(gamekit.a[xAssetKey[0]]);
			return promise;
		}

		if(assetNames.substr(-5) === '.json'){
			//Does the JSON file have a key? If so, don't use it as a resource map.
			assetNames = assetNames.split(':');
			gamekit.getJSON(gamekit.assetFolder + assetNames.pop())
				.then(function (result){
					if(assetNames.length){
						gamekit.a[assetNames[0]] = result;

						//Does the result have a tilesets property?
						//If so: its a Tiled Map resource and the tilesets need to be loaded.
						if(result.tilesets){
							var loadTilesets = [],
								imgName,
								promise2;

							promise2 = new gamekit.Promise();

							for (i = 0; i < result.tilesets.length; i++) {
								imgName = result.tilesets[i].image.split('.');
								imgName.pop();
								imgName = imgName.join('.');
								result.tilesets[i].key = 'tileset_' + imgName;
								loadTilesets.push('tileset_' + imgName + ':' + result.tilesets[i].image);
							}

							gamekit
								.loadAssets(loadTilesets)
								.then(function (){
									for (i = 0; i < result.tilesets.length; i++) {
										gamekit.a[result.tilesets[i].key] = new gamekit.SpriteMap({
											image: gamekit.a[result.tilesets[i].key],
											tileW: result.tilesets[i].tilewidth,
											tileH: result.tilesets[i].tileheight,
											offsX: result.tilesets[i].margin,
											offsY: result.tilesets[i].margin,
											spacingX: result.tilesets[i].spacing,
											spacingY: result.tilesets[i].spacing
										});
									}
									promise2.resolve();
								}, function (){
									promise2.reject();
								});

							return promise2;
						}

						promise.resolve();
						return promise;
					}

					return gamekit.loadAssets(result);
				})
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
			gamekit.a[this.assetKey] = new gamekit.SpriteMap({
				image: gamekit.a[this.assetKey],
				tileW: parseInt(result[1], 10),
				tileH: parseInt(result[2], 10)
			});
			loadedAssets++;
			if(loadedAssets === loadingAssets.length){
				promise.resolve();
			}
			return;
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

	for (i = 0; i < assetNames.length; i++) {
		assetNames[i] = assetNames[i].split(':');
		if(assetNames[i].length !== 2){
			assetNames[i].unshift(assetNames[i][0].split('.').shift());
		}
		if(gamekit.a[assetNames[i][0]] === undefined){
			a = new Image();
			a.onload = callbackFunction;
			a.onerror = errorFunction;
			a.assetKey = assetNames[i][0];
			gamekit.a[assetNames[i][0]] = a;
			loadingAssets.push(assetNames[i]);
		}
	}

	if(loadingAssets.length){
		for (i = 0; i < loadingAssets.length; i++) {
			gamekit.a[loadingAssets[i][0]].src = gamekit.assetFolder + loadingAssets[i][1];
		}
	} else {
		promise.resolve();
	}

	return promise;
};;

/**
 * Automatically splits an image into a sprite map and makes tiles accessible via index.
 * The Spritemap behaves like an array, so you can access the separate sprites by calling
 *
 * mySpritemap[index]
 *
 * For example when using a sprite object:
 *
 * var car = new Sprite(mySpritemap[12]);
 *
 * @param {object} params
 * @param {Image} params.image Image object containing the spritemap
 * @param {int} params.tileW Width of the tiles
 * @param {int} params.tileH Height of the tiles
 * @param {int} [params.offsX=0] Offset (blank space) in the upper left corner of the spritemap
 * @param {int} [params.offsY=0] Offset (blank space) in the upper left corner of the spritemap
 * @param {int} [params.spacingX=0] Horizontal spacing between tiles
 * @param {int} [params.spacingY=0] Vertical spacing between tiles
 * @constructor
 */
gamekit.SpriteMap = function (params){
    var obj = [];

    params.offsX = params.offsX || 0;
    params.offsY = params.offsY || 0;
    params.spacingX = params.spacingX || 0;
    params.spacingY = params.spacingY || 0;

    obj._image = params.image;
    obj._tileW = params.tileW;
    obj._tileH = params.tileH;
    obj._animations = {};
    obj._tilesOnXAxis = Math.floor((params.image.width - params.offsX) / (params.tileW + params.spacingX));
    obj._tilesOnYAxis = Math.floor((params.image.height - params.offsY) / (params.tileH + params.spacingY));

    for (var y = 0; y < obj._tilesOnYAxis; y++) {
        for (var x = 0; x < obj._tilesOnXAxis; x++) {
            obj.push({
                image: obj._image,
                x: x * params.tileW + params.offsX + (x * params.spacingX),
                y: y * params.tileH + params.offsY + (y * params.spacingY),
                w: params.tileW,
                h: params.tileH
            });
        }
    }

    obj._isSpritemap = true;

    gamekit.extend(obj, gamekit.SpriteMap.prototype);

    return obj;
};

gamekit.SpriteMap.prototype = {
    /**
     * Creates a new animation preset and stores it on the spritemap.
     * @param key
     * @param fromIndex Beginning index, or array of frames.
     * @param toIndex End index or 0 if you want to use an array of frames.
     * @param loop
     * @param fps
     */
    createAnimation: function(key, fromIndex, toIndex, loop, fps){
        var obj = {
            key: key,
            loop: loop === true,
            fps: fps || gamekit.SpriteMap.defaultFPS,
            frames: !toIndex ? fromIndex : []
        };

        for(var i = fromIndex; i <= toIndex; i++){
            obj.frames.push(i);
        }

        this._animations[key] = obj;
    }
};

gamekit.SpriteMap.defaultFPS = 25;;

gamekit.SpriteAtlas = function (imageObj, jsonConfig){
	var obj = {};

	obj._image = imageObj;
	obj.keys = [];

	for (var key in jsonConfig) {
		obj.keys.push(key);

		if(jsonConfig[key].x !== undefined){
			//verbose
			obj[key] = {
				image: imageObj,
				x: jsonConfig[key].x,
				y: jsonConfig[key].y,
				w: jsonConfig[key].w,
				h: jsonConfig[key].h
			};
		} else {
			//short type
			obj[key] = {
				image: imageObj,
				x: jsonConfig[key][0],
				y: jsonConfig[key][1],
				w: jsonConfig[key][2],
				h: jsonConfig[key][3]
			};
		}
	}

	obj._isSpriteAtlas = true;

	gamekit.extend(obj, gamekit.SpriteAtlas.prototype);

	return obj;
};

gamekit.SpriteAtlas.prototype = {
	/**
	 * Creates a new animation preset and stores it on the spritemap.
	 * @param key
	 * @param atlasKeys Array of keys for the animation
	 * @param loop
	 * @param fps
	 */
	createAnimation: function (key, atlasKeys, loop, fps){
		var obj = {
			key: key,
			loop: loop === true,
			fps:  fps || gamekit.SpriteMap.defaultFPS,
			frames: atlasKeys
		};

		this._animations[key] = obj;
	}
};

gamekit.SpriteAtlas.defaultFPS = 25;;

    //==================================================================================================================

/**
 * The gamekit layers are used to render on multiple levels.
 * @type {Array}
 */
function GamekitLayer(core){
	this.entities = [];
	this.visible = true;
	this.alpha = 1;
	this._core = core;
}

GamekitLayer.prototype = {
	/**
	 * Adds a new renderable entity (Sprite, Group) to the layer.
	 * @param {*} element
	 */
	attach: function (element){
		element._core = this._core;
		this.entities.push(element);
	},
	detach: function (element){
		var idx = this.entities.indexOf(element);

		if(idx >= 0){
			this.entities.splice(idx, 1);
		}
	},
	clear: function(){
		this.entities.length = 0;
	},
	/**
	 * Draws the contents of this layer.
	 * @param ctx
	 */
	draw: function (ctx){
		var entityLen,
			i, e,
			cameraX,
			cameraY;

		cameraX = this._core.camera.x;
		cameraY = this._core.camera.y;


		entityLen = this.entities.length - 1;
		for (i = entityLen + 1; i--;) {
			e = this.entities[entityLen - i];

			if(e._destroy){
				this.entities.splice(entityLen - i, 1);
				entityLen--;
				continue;
			}

			if(e.alpha < 0){
				e.alpha = 0;
				continue;
			}

			ctx.globalAlpha = e.alpha * this.alpha;

			e.update();
			ctx.save();
			ctx.translate(-cameraX, -cameraY);
			e.draw(ctx);
			ctx.restore();
		}
	}
};

gamekit.layer = [new GamekitLayer(gamekit)];

/**
 * Adds a new layer on top.
 */
gamekit.Core.prototype.createLayer = function (){
	var l;
	l = new GamekitLayer(this);

	this.layer.push(l);

	return l;
};;

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

function vectorComponents(speed, directionAngle){
	directionAngle -= 90;

	while (directionAngle < 0) {
		directionAngle += 360;
	}

	while (directionAngle > 360) {
		directionAngle -= 360;
	}


	var speedx, speedy;
	speedx = speed * Math.cos(directionAngle * Math.PI / 180);
	speedy = speed * Math.sin(directionAngle * Math.PI / 180);

	return [speedx, speedy];
}

function vectorPolar(speedX, speedY){
	var speed,
		angle;

	//Converting Radians to degrees by multiplying with (180/Math.PI)
	angle = Math.atan2(speedX, speedY) * 57.29577951308232;

	//Last number is Math.cos(90);
	speed = Math.sqrt((speedX * speedX) + (speedY * speedY));

	return [speed, angle];
}

/**
 * Most basic element to be drawn on a screen.
 * @constructor
 */
gamekit.Sprite = function (asset){
	this.x = 0;
	this.y = 0;
	this.originX = 0;
	this.originY = 0;
	this.rotation = 0;
	this.direction = 0;
	this._directionCache = null;
	this.speed = 0;
	this.friction = 0;
	this.scaleX = 1;
	this.scaleY = 1;
	this.alpha = 1;
	this.stretch = false;
	this.debugDrawing = false;
	this._destroy = false;
	this._core = gamekit;

	if(asset instanceof Image){
		this.asset = asset;
		this.w = asset.width;
		this.h = asset.height;
		this._assetDimensions = {
			x: 0,
			y: 0,
			w: asset.width,
			h: asset.height
		};
		return;
	}

	if(asset._isSpritemap){
		this.asset = asset._image;
		this._spritemap = asset;
		this._spritemapIndex = 0;
		this.w = this._spritemap[0].w;
		this.h = this._spritemap[0].h;
		return;
	}

	if(asset._isSpriteAtlas){
		this.asset = asset._image;
		this._spriteatlas = asset;
		this._spriteAtlasKey = asset.keys[0];
		this.w = asset[asset.keys[0]].w;
		this.h = asset[asset.keys[0]].h;
		return;
	}

	//Asset is dynamic - means its a SpriteMap- or SpriteAtlas element.
	this.asset = asset.image;
	this.w = asset.w;
	this.h = asset.h;
	this._assetDimensions = {
		x: asset.x,
		y: asset.y,
		w: asset.w,
		h: asset.h
	};
};
gamekit.Sprite.prototype = {
	update: function (){
	},
	draw: function (ctx){
		var w,
			h,
			oX,
			oY,
			aX,
			aY,
			aW,
			aH;

		oX = this.originX;
		oY = this.originY;
		w = this.w;
		h = this.h;
		if(this._spritemap){
			aX = this._spritemap[this._spritemapIndex].x;
			aY = this._spritemap[this._spritemapIndex].y;
			aW = this._spritemap[this._spritemapIndex].w;
			aH = this._spritemap[this._spritemapIndex].h;
		} else {
			if(this._spriteatlas){
				aX = this._spriteatlas[this._spriteAtlasKey].x;
				aY = this._spriteatlas[this._spriteAtlasKey].y;
				aW = this._spriteatlas[this._spriteAtlasKey].w;
				aH = this._spriteatlas[this._spriteAtlasKey].h;
			} else {
				aX = this._assetDimensions.x;
				aY = this._assetDimensions.y;
				aW = this._assetDimensions.w;
				aH = this._assetDimensions.h;
			}
		}

		ctx.save();
		ctx.translate(this.x, this.y);
		if(this.alpha < 0){
			this.alpha = 0;
		}
		ctx.globalAlpha = this.alpha;

		if(this.speed){
			while (this.direction > 360) {
				this.direction -= 360;
			}

			while (this.direction < 0) {
				this.direction += 360;
			}

			if(!this._directionCache || this._directionCache[0] !== this.speed || this._directionCache[1] !== this.direction){
				this._directionCache = [
					this.speed,
					this.direction,
					vectorComponents(this.speed, this.direction)
				]
			}

			this.x += this._directionCache[2][0];
			this.y += this._directionCache[2][1];

			if(this.speed > 0){
				this.speed -= this.friction;
				if(this.speed < 0){
					this.speed = 0;
				}
			} else {
				this.speed += this.friction;
				if(this.speed > 0){
					this.speed = 0;
				}
			}
		}

		if(this.rotation){
			while (this.rotation > 360) {
				this.rotation -= 360;
			}

			while (this.rotation < 0) {
				this.rotation += 360;
			}

			ctx.rotate(this.rotation * Math.PI / 180);
		}

		ctx.scale(this.scaleX, this.scaleY);

		if(!this.stretch && (w !== aW || h !== aH)){
			if(!this.pattern){
				this.pattern = ctx.createPattern(this.asset, 'repeat');
			}
			ctx.fillStyle = this.pattern;
			ctx.fillRect(-oX, -oY, w, h);
			ctx.restore();
			return;
		}

		ctx.drawImage(this.asset, aX, aY, aW, aH, -oX, -oY, w, h);

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
	 * If a spritemap has been assigned to this sprite object, you can map animations defined
	 * on the spritemap on this spriteobject.
	 *
	 * If the animation happens to be not looped, this method will return a promise that is fulfilled
	 * when the animation is finished.
	 * @param key
	 */
	setAnimation: function (key){
		if(!this._spritemap){
			throw new Error('No spritemap set');
		}

		if(!this._spritemap._animations[key]){
			throw new Error('Unknown animation');
		}

		var core,
			anim,
			promise,
			queueObject,
			that,
			animPointer,
			waitTime,
			lastTime;

		this._animation = anim = {
			key: key,
			loop: this._spritemap._animations[key].loop,
			fps: this._spritemap._animations[key].fps,
			frames: this._spritemap._animations[key].frames
		};
		that = this;

		if(!anim.loop){
			promise = new gamekit.Promise();
		}

		core = this._core;
		lastTime = core.getLastRuntime();
		if(core.getFPS()){
			waitTime = (1000 / core.getFPS()) * (core.getFPS() / anim.fps);
		} else {
			waitTime = (1000 / 60) * (60 / anim.fps);
		}
		this._spritemapIndex = anim.frames[0];
		animPointer = 1;

		queueObject = {
			finished: false,
			update: function (currentTime){
				//Has the animation been switched?
				if(that._animation.key !== key){
					queueObject.finished = true;
					return;
				}

				if(currentTime <= lastTime + waitTime){
					return;
				}

				lastTime = currentTime;
				if(core.getFPS()){
					waitTime = Math.min((1000 / core.getFPS()) * (core.getFPS() / anim.fps), 1000);
				}

				animPointer++;
				if(animPointer >= anim.frames.length){
					if(!anim.loop){
						queueObject.finished = true;
						that._animation = null;
						promise.resolve();
						return;
					}
					animPointer = 0;
				}

				that._spritemapIndex = anim.frames[animPointer];
			}
		};

		core.addTween(queueObject);

		return promise;
	},
	/**
	 * Morph one or more numeric properties of the object during a specified amount of time.
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

		beginTime = this._core.getLastRuntime();
		endTime = beginTime + duration;
		promise = new gamekit.Promise(this);
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

				promise.progress(t);

				if(t === 1){
					queueObject.finished = true;
					promise.resolve();
				}
			}
		};

		this._core.addTween(queueObject);

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
	},
	/**
	 * Will cause gamekit to "destroy" this element - means remove it from all layers.
	 */
	destroy: function (){
		this._destroy = true;
	},
	/**
	 * Apply a force to manipulate the current direction and speed.
	 * @param {Number} directionAngle Direction of where the force should point
	 * @param {Number} force Force (in pixel per frame)
	 * @param {Number} [max] If you pass a max value, the Sprites' speed won't be increased if it already has the max speed in the given direction.
	 */
	applyForce: function (directionAngle, force, max){
		var comp1,
			comp2,
			step,
			result;

		if(!this.speed){
			this.direction = directionAngle;
			this.speed = force;
			return;
		}

		comp1 = vectorComponents(force, directionAngle);

		if(!this._directionCache){
			step = [0, 0];
		} else {
			step = this._directionCache[2];
		}

		if(max !== undefined){
			comp2 = vectorComponents(max, directionAngle);

			if(comp2[0] < 0){
				if(step[0] > comp2[0]){
					comp1[0] = Math.max(comp2[0], step[0] + comp1[0]);
				} else {
					comp1[0] = 0;
				}
			} else {
				if(step[0] < comp2[0]){
					comp1[0] = Math.min(comp2[0], step[0] + comp1[0]);
				} else {
					comp1[0] = 0;
				}
			}

			if(comp2[1] < 0){
				if(step[1] > comp2[0]){
					comp1[1] = Math.max(comp2[1], step[1] + comp1[1]);
				} else {
					comp1[1] = 0;
				}
			} else {
				if(step[1] < comp2[0]){
					comp1[1] = Math.min(comp2[1], step[1] + comp1[1]);
				} else {
					comp1[1] = 0;
				}
			}
		}

		result = vectorPolar(step[0] + comp1[0], step[1] + comp1[1]);

		this.speed = result[0];
		this.direction = result[1];
		this._directionCache = [result[0], result[1], [step[0] + comp1[0], step[1] + comp1[1]]];
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
    this._destroy = false;
    this._core = gamekit;
};
gamekit.Group.prototype = {
    update: function (){
    },
    /**
     * Returns the boundary dimensions of this group.
     * @returns {*}
     */
    getBoundaries: function (){
        var x,
            y,
            w,
            h,
            i,
            entityLen,
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

        entityLen = this.entities.length - 1;
        for (i = entityLen + 1; i--;) {
            e = this.entities[entityLen - i];
            if(e instanceof gamekit.Sprite){
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
                continue;
            }

            if(e instanceof gamekit.Group){
                e = e.getBoundaries();
                x = Math.min(x, this.x - e.x);
                y = Math.min(y, this.y - e.y);
                w = Math.max(w, e.w);
                h = Math.max(h, e.h);
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
            i,
            entityLen,
            e;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.scale(this.scaleX, this.scaleY);

        alpha = ctx.globalAlpha;

        entityLen = this.entities.length - 1;
        for (i = entityLen + 1; i--;) {
            e = this.entities[entityLen - i];

            if(e._destroy){
                l.entities.splice(entityLen - i, 1);
                entityLen--;
                continue;
            }

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
    },
    /**
     * Will cause gamekit to "destroy" this element - means remove it from all layers.
     */
    destroy: function (){
        this._destroy = true;
    }
};

gamekit.Group.prototype.tween = gamekit.Sprite.prototype.tween;
gamekit.Group.prototype.prepareTween = gamekit.Sprite.prototype.prepareTween;;

/**
 * A label can be used to render text at any place of the canvas.
 * @constructor
 */
gamekit.Label = function (){
    this.x = 0;
    this.y = 0;
    this.w = 0;
    this.h = 0;
    this.originX = 0;
    this.originY = 0;
    this.rotation = 0;
    this.alpha = 1;
    this.scaleX = 1;
    this.scaleY = 1;
    this.debugDrawing = false;
    this._destroy = false;

    this.font = 'Arial';
    this.size = 12;
    this.style = '';
    this.color = '#000';
    this.strokeColor = '#000';
    this.strokeWidth = 0;
    this.strokeOver = false;
    this.align = 'left';
    this.verticalAlign = 'top';

    this._measureCache = null;
};

gamekit.Label.prototype = {
    update: function (){
    },
    draw: function (ctx){
        var cache;

        ctx.save();

        ctx.translate(this.x, this.y);

        if(this.rotation){
            ctx.rotate(this.rotation * Math.PI / 180);
        }

        ctx.scale(this.scaleX, this.scaleY);

        ctx.font = this.size + 'px "' + this.font + '" ' + this.style;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.strokeColor;
        ctx.lineWidth = this.strokeWidth;
        ctx.textAlign = this.align;
        ctx.textBaseline = this.verticalAlign;

        cache = ctx.font + ctx.lineWidth + ctx.textAlign + ctx.textBaseline;

        if(this._measureCache !== cache){
            this._measureCache = cache;
            this.calculateDimensions();
            if(this._asyncCenter){
                delete this._asyncCenter;
                this.centerOrigin();
            }
        }

        if(this.strokeOver){
            ctx.fillText(this.value, -this.originX, -this.originY);
            if(this.strokeWidth){
                ctx.strokeText(this.value, -this.originX, -this.originY);
            }
        } else {
            if(this.strokeWidth){
                ctx.strokeText(this.value, -this.originX, -this.originY);
            }
            ctx.fillText(this.value, -this.originX, -this.originY);
        }

        if(this.debugDrawing){
            ctx.beginPath();
            ctx.strokeStyle = '#0ff';
            ctx.lineWidth = 1;

            switch (this.align) {
            case 'right':
                ctx.strokeRect(-this.originX - this.w, -this.originY, this.w, this.h);
                break;
            case 'center':
                ctx.strokeRect(-this.originX, -this.originY, this.w, this.h);
                break;
            case 'left':
                ctx.strokeRect(-this.originX + this.w, -this.originY, this.w, this.h);
                break;
            }
            ctx.stroke();
            ctx.fillStyle = '#f0f';
            ctx.beginPath();
            ctx.arc(0, 0, 2, 0, 365);
            ctx.fill();
        }

        ctx.restore();
    },
    centerOrigin: function (){
        if(this._measureCache === null){
            this._asyncCenter = true;
            return;
        }
        console.log(this);
        this.changeOrigin(this.w / 2, this.h / 2);
    },
    calculateDimensions: function (ctx){
        var temp;

        if(!ctx){
            temp = document.createElement('canvas');
            ctx = temp.getContext('2d');
        }

        ctx.save();

        ctx.font = this.size + 'px "' + this.font + '" ' + this.style;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.strokeColor;
        ctx.lineWidth = this.strokeWidth;
        ctx.textAlign = this.align;
        ctx.textBaseline = this.verticalAlign;

        this.w = ctx.measureText(this.value).width;

        temp = document.createElement('span');
        temp.style.fontFamily = this.font;
        temp.style.fontStyle = this.style;
        temp.style.verticalAlign = this.verticalAlign;
        temp.style.fontSize = this.size + 'px';
        temp.style.padding = 0;
        temp.style.margin = 0;
        temp.innerHTML = this.value;
        document.body.appendChild(temp);
        this.h = temp.offsetHeight;

        document.body.removeChild(temp);


        ctx.restore();
    }
};

gamekit.Label.prototype.tween = gamekit.Sprite.prototype.tween;
gamekit.Label.prototype.prepareTween = gamekit.Sprite.prototype.prepareTween;
gamekit.Label.prototype.changeOrigin = gamekit.Sprite.prototype.changeOrigin;
gamekit.Label.prototype.destroy = gamekit.Sprite.prototype.destroy;;

/**
 * TileGrid
 * ========
 * The TileGrid represents a single layer of a tile map.
 * It can also be used without any surrounding map at all.
 *
 * Date: 21.03.2015 - 13:27
 */
gamekit.TileGrid = function (params){
	var obj = [[]];

	if(params._isSpritemap){
		params = {
			spritemaps: [params]
		};
	}

	obj._spritemaps = params.spritemaps || [];
	obj.width = 0;
	obj.height = 0;
	obj.x = 0;
	obj.y = 0;
	obj.alpha = 1;
	obj.originX = 0;
	obj.originY = 0;
	obj.rotation = 0;
	obj.scaleX = 1;
	obj.scaleY = 1;
	obj.gridSize = 0;
	obj.gridColor = '#000';
	obj._tilemap = params.tilemap;
	obj._core = gamekit;
	obj._slice = {x: 0, y: 0, w: 0, h: 0};
	this._destroy = false;

	obj._isTilegrid = true;

	gamekit.extend(obj, gamekit.TileGrid.prototype);

	if(params.width && params.height){
		obj.resize(params.width, params.height);
	}

	return obj;
};

gamekit.TileGrid.prototype = {
	setData: function(inData){
		var x;

		for(x = 0; x < inData.length; x++){
			this[x] = inData[x];
		}
	},
	setStream: function (indexStream){
		var x, y, i;

		i = 0;
		for (y = 0; y < this.height; y++) {
			for (x = 0; x < this.width; x++) {

				this[x][y] = indexStream[i] ? indexStream[i] - 1 : null;
				i++;
			}
		}
	},
	/**
	 * Will do a flood fill from the given position with the given index.
	 * @param x
	 * @param y
	 * @param index
	 */
	fill: function (x, y, index){
		if(y === undefined){
			index = x;
			x = 0;
			y = 0;
		}


	},
	/**
	 * Will set a new dimension for the tile grid.
	 * @param width
	 * @param height
	 */
	resize: function (width, height, defaultIndex){
		var x, y;

		if(defaultIndex === undefined){
			defaultIndex = null;
		}

		if(height > this[0].length){
			for (x = 0; x < this.length; x++) {
				for (y = this[x].length; y < height; y++) {
					this[x][y] = defaultIndex;
				}
			}
		}

		if(width > this.length){
			for (x = this.length; x < width; x++) {
				this[x] = [];
				for (y = 0; y < height; y++) {
					this[x].push(defaultIndex);
				}
			}
		}

		this.width = width;
		this.height = height;
	},
	update: function (){

	},
	draw: function (ctx){
		var x, //x position of rendered tile
			y,
			xBase,
			yBase, //y position of rendered tile
			w,
			h,
			tW, //width of the tiles in pixels
			tH, //height of the tiles in pixels
			oX, //offset of the layer
			oY,
			idx,//normalized tile index
			smIdx, //spritemap index
			smap;

		tW = this._spritemaps[0][0].w;
		tH = this._spritemaps[0][0].h;
		oX = this.originX;
		oY = this.originY;

		if(!this.alpha){
			return;
		}

		ctx.save();
		ctx.translate(this.x, this.y);

		if(this.alpha < 0){
			this.alpha = 0;
		}

		ctx.globalAlpha = this.alpha;

		if(this.rotation){
			while (this.rotation > 360) {
				this.rotation -= 360;
			}

			while (this.rotation < 0) {
				this.rotation += 360;
			}

			ctx.rotate(this.rotation * Math.PI / 180);
		}

		ctx.scale(this.scaleX, this.scaleY);

		xBase = (-(this.x + (this._tilemap ? this._tilemap.x : 0)) + this._core.camera.x);
		xBase = Math.floor(xBase / tW);
		yBase = (-(this.y + (this._tilemap ? this._tilemap.y : 0)) + this._core.camera.y);
		yBase = Math.floor(yBase / tH);
		w = Math.ceil(this._core.width() / tW) + 1;
		h = Math.ceil(this._core.height() / tH) + 1;

		this._slice.x = xBase;
		this._slice.y = yBase;
		this._slice.w = w;
		this._slice.h = h;

		for (x = xBase; x < xBase + w; x++) {
			for (y = yBase; y < yBase + h; y++) {
				idx = this[x][y];
				if(idx === null){
					continue;
				}

				for (smIdx = 0; smIdx < this._spritemaps.length; smIdx++) {
					if(idx < this._spritemaps[smIdx].length){
						smap = this._spritemaps[smIdx][idx];
						break;
					}
					idx -= this._spritemaps[smIdx].length;
				}

				ctx.drawImage(smap.image, smap.x, smap.y, tW, tH, -oX + (x * tW), -oY + (y * tH), tW, tH);
			}
		}

		if(this.gridSize){
			ctx.strokeColor = this.gridColor;
			ctx.lineWidth = this.gridSize;
			for(x = 1; x < this.length; x++){
				for(y = 1; y < this[x].length; y++){
					ctx.beginPath();
					ctx.moveTo(x * tW + 0.5, 0);
					ctx.lineTo(x * tW + 0.5, this[x].length * tH);
					ctx.stroke();
					ctx.beginPath();
					ctx.moveTo(0, y * tH + 0.5);
					ctx.lineTo(this.length * tW, y * tH + 0.5);
					ctx.stroke();
				}
			}
		}

		ctx.restore();
	}
};;

/**
 * TileMap
 * =======
 *
 *
 * @constructor
 */

gamekit.TileMap = function (tiledDocument){

	this.x = 0;
	this.y = 0;
	this.originX = 0;
	this.originY = 0;
	this.rotation = 0;
	this.scaleX = 1;
	this.scaleY = 1;
	this.alpha = 1;
	this._destroy = false;
	this._spritemaps = [];

	this.layer = [];

	this.width = 0;
	this.height = 0;

	var i, l;

	if(tiledDocument){
		this.width = tiledDocument.width;
		this.height = tiledDocument.height;

		for (i = 0; i < tiledDocument.tilesets.length; i++) {
			this._spritemaps.push(gamekit.a[tiledDocument.tilesets[i].key]);
		}

		for (i = 0; i < tiledDocument.layers.length; i++) {
			if(tiledDocument.layers[i].type !== 'tilelayer'){
				continue;
			}

			l = this.createLayer(tiledDocument.layers[i].width, tiledDocument.layers[i].height);
			l.setStream(tiledDocument.layers[i].data);
			if(!tiledDocument.layers[i].visible){
				l.alpha = 0;
			}
		}
	}
};

gamekit.TileMap.prototype = {
	createLayer: function (w, h, x, y){
		var layer;

		layer = new gamekit.TileGrid({
			tilemap: this,
			spritemaps: this._spritemaps,
			x:      x || 0,
			y:      y || 0,
			width:  w || this.width,
			height: h || this.height
		});

		this.layer.push(layer);

		return layer;
	},
	update: function (){

	},
	draw: function (ctx){
		ctx.save();
		ctx.translate(this.x, this.y);
		ctx.rotate(this.rotation * Math.PI / 180);
		ctx.scale(this.scaleX, this.scaleY);

		var i;

		for (i = 0; i < this.layer.length; i++) {
			this.layer[i].draw(ctx);
		}

		ctx.restore();
	},
	/**
	 * Will return an array of tile coordinates that marks the path from tile A to tile B.
	 * When avoidTiles is given, the tile types from the array are avoided by the path.
	 * The method will return boolean false if no path is possible.
	 * TODO: fix this
	 * @param {Number} layer
	 * @param {Number} fromX
	 * @param {Number} fromY
	 * @param {Number} toX
	 * @param {Number} toY
	 * @param {Array} [avoidTiles] Optional array of palette indexes to avoid.
	 * @return {Array|false}
	 */
	getPath: function (layer, fromX, fromY, toX, toY, avoidTiles){
		var field,
			openList,
			closedList,
			currentNode,
			layerHeight,
			layerWidth;

		field = this.layer[layer];
		avoidTiles = avoidTiles || [];
		openList = [];
		closedList = [];

		layerWidth = field.length;
		layerHeight = field[0].length;

		function manhattanDistance(x1, y1, x2, y2){
			return Math.abs(x2 - x1) + Math.abs(y2 - y1);
		}

		/**
		 * Returns the Node with the best score.
		 * @returns {Mixed}
		 */
		function shiftMinNode(){
			var node;

			_.sortBy(openList, function (n){
				return n.g + n.h;
			});

			node = openList.shift();

			return node;
		}

		function closeNode(node){
			if(closedList[node.x] === undefined){
				closedList[node.x] = [];
			}
			closedList[node.x][node.y] = true;
		}

		function isClosed(node){
			if(closedList[node.x] === undefined){
				return false;
			}
			return closedList[node.x][node.y];
		}

		function isOpen(node){
			return _.find(openList, function (n){
				return n.x === node.x && n.y === node.y;
			});
		}

		function getPath(node){
			var path;

			path = [];

			while (node.parent) {
				path.push({
					x: node.x,
					y: node.y
				});
				node = node.parent;
			}

			path.push({
				x: node.x,
				y: node.y
			});

			path.shift();

			return path;
		}

		function getNode(x, y, parent, target){
			if(x < 0 || y < 0 || y >= layerHeight || x >= layerWidth){
				return;
			}

			if(closedList[x] && closedList[x][y]){
				return;
			}

			if(avoidTiles.indexOf(field[x][y]) !== -1){
				return;
			}

			target.push({x: x, y: y, g: parent.g + 1, h: manhattanDistance(x, y, fromX, fromY)});
		}

		function expand(node){
			var neighbors,
				neighbor,
				n,
				nOpen,
				key,
				tG;

			neighbors = [];

			getNode(node.x, node.y - 1, node, neighbors);
			getNode(node.x - 1, node.y, node, neighbors);
			getNode(node.x + 1, node.y, node, neighbors);
			getNode(node.x, node.y + 1, node, neighbors);

			for (key in neighbors) {
				neighbor = neighbors[key];
				tG = node.g + 1;

				if(isClosed(neighbor) && tG >= neighbor.g){
					continue;
				}

				n = isOpen(neighbor);
				if(!n || tG < neighbor.g){
					nOpen = true;
					if(!n){
						n = neighbor;
						nOpen = false;
					}
					n.parent = node;
					n.g = tG;
					if(!nOpen){
						openList.push(n);
					}
				}
			}
		}


		if(avoidTiles && avoidTiles.indexOf(field[toX][toY]) !== -1){
			return [];
		}

		openList.push({
			x: toX,
			y: toY,
			g: 0,
			h: manhattanDistance(toX, toY, fromX, fromY)
		});

		while (openList.length) {
			currentNode = shiftMinNode();

			if(currentNode.x === fromX && currentNode.y === fromY){
				return getPath(currentNode);
			}

			closeNode(currentNode);

			expand(currentNode);
		}

		return [];
	}
};;

    //==================================================================================================================

var keyboardInputInitialized,
    pointerInputInitialized,
    keyboardInputListeners,
    keyboardPressed,
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
    keyboardPressed = {};

    function keyListener(e, upDown){
        var keyname,
            key,
            was;

        keyname = keymap[e.keyCode];

        if(!keyname){
            return;
        }

        was = keyboardPressed[keyname];
        keyboardPressed[keyname] = upDown;

        if(keyboardInputListeners[keyname] === undefined){
            return;
        }

        for (key in keyboardInputListeners[keyname]) {
            if(upDown){
                if(!was){
                    keyboardInputListeners[keyname][key].resolve();
                }
            } else {
                if(was){
                    keyboardInputListeners[keyname][key].reject();
                }
            }
        }
    }

    window.onkeydown = function (e){
        keyListener(e, true);
    };

    window.onkeyup = function (e){
        keyListener(e, false);
    }

    keyboardInputInitialized = true;
}

//---------------------------------------------------------------------------

var pointerCaptureDown,
    pointerCaptureUp,
    pointerCaptureMove;

function inputInitPointers(core){
    var shadowCanvas,
        canvas;

    canvas = core.getCanvas();

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

    gamekit.pointers = [];

    canvas.onmousedown = function (e){
        if(!pointerCaptureDown){
            return;
        }
        tracePointer(core, e, 'pointerdown');
    };

    canvas.onmouseup = function (e){
        if(!pointerCaptureUp){
            return;
        }
        tracePointer(core, e, 'pointerup');
    };

    canvas.onmousemove = function (e){
        if(!pointerCaptureMove){
            return;
        }
        tracePointer(core, e, 'pointermove');
    };

    canvas.ontouchstart = function (e){
        if(!pointerCaptureDown){
            return;
        }
        tracePointer(core, e, 'pointerdown');
    };

    canvas.ontouchend = function (e){
        if(!pointerCaptureUp){
            return;
        }
        tracePointer(core, e, 'pointerdown');
    };

    canvas.ontouchmove = function (e){
        if(!pointerCaptureMove){
            return;
        }
        tracePointer(core, e, 'pointermove');
    };
}

/**
 * Notice: Disabled PointerAreas are not triggered!
 * @param e
 */
function tracePointer(core, e, eventname){
    var x,
        y,
        layerLen,
        l,
        entityLen,
        j,
        i,
		el,
        canvas;

    canvas = core.getCanvas();

    x = e.clientX - canvas.offsetLeft + window.scrollX;
    y = e.clientY - canvas.offsetTop + window.scrollY;

    if(!gamekit.pointers.length){
        gamekit.pointers.push({x: 0, y: 0});
    }

    gamekit.pointers[0].x = x;
    gamekit.pointers[0].y = y;

    if(!core.isRunning){
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
            el = l.entities[entityLen - j];
            if(el.disabled || el.shadowDraw === undefined){
                continue;
            }
            el.shadowDraw(x, y, eventname);
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
    inputInitPointers(gamekit);
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
	update: function(){},
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
    inputInitPointers(this._core);
    this._captureBoundingBox = onBoundingBox;
    this._attachedEvents = {};
    this.disabled = false;
    this.on = gamekit.PointerArea.prototype.on;
};


gamekit.onKey = function (keyname){
    var promise;

    inputInitKeyboard();

    promise = new gamekit.Promise();

    if(keyboardInputListeners[keyname] === undefined){
        keyboardInputListeners[keyname] = [];
    }

    keyboardInputListeners[keyname].push(promise);

    return promise;
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
    if(obj === null || typeof obj !== 'object'){
        return obj;
    }

    var out,
        keys,
        i,
        o;

    if(obj instanceof gamekit.Sprite){
        out = new gamekit.Sprite(obj.asset);
    }

    if(obj instanceof gamekit.Group){
        out = new gamekit.Group();
    }

    if(out === undefined){
        out = {};
    }

    keys = Object.keys(obj);

    for(i = 0; i < keys.length; i++){
        o = obj[keys[i]];
        if(o instanceof gamekit.Group || o instanceof gamekit.Sprite){
            out[keys[i]] = gamekit.clone(o);
            continue;
        }
        out[keys[i]] = o;
    }

    return out;
};

/**
 * Creates a timer object that also acts as a promise. It will be resolved every time interval has passed.
 * @param {Number} interval Interval in milliseconds.
 * @returns {gamekit.Promise}
 * @constructor
 */

gamekit.Timer = function(interval, core){
    var promise,
        queueObject,
        lastTick;

    if(!core){
        core = gamekit;
    }

    promise = new gamekit.Promise();

    promise.interval = interval;

    queueObject = {
        finished: false,
        update: function(time){
            if(!lastTick){
                lastTick = time;
                return;
            }

            if(lastTick + promise.interval < time){
                lastTick = time;
                promise.resolve();
            }
        }
    };

    promise.disable = function(){
        queueObject.finished = true;
    };

    promise.enable = function(){
        queueObject.finished = false;
        core.addTween(queueObject);
    };

    promise.enable();

    return promise;
};

/**
 * The random seed is calculated freshly on every load of the framework.
 */
gamekit.randomSeed = (function (){
    return Math.floor(Math.random() * (99999)) + 1;
})();

/**
 * Implementation of a seeded random number generator.
 * Set gamekit.randomSeed to any integer to have a custom seed.
 * @returns {number}
 */
gamekit.random = function(){
    var x = Math.abs(Math.sin(gamekit.randomSeed++)) * 10000;
    return x - ~~x;
};

/**
 * Returns a random number between min and max.
 * @param min
 * @param max
 * @returns {*}
 */
gamekit.randomInRange = function(min, max){
    return (gamekit.random() * (max - min)) + min;
};

/**
 * Extend a given object with all the properties in passed-in object(s).
 */
gamekit.extend = function(obj){
    var i = 1,
        src,
        prop;
    if(arguments.length === 1){
        return obj;
    }

    for(;i < arguments.length; i++){
        if(src = arguments[i]){
            for(prop in src){
                obj[prop] = src[prop];
            }
        }
    }
    return obj;
};;

    //==================================================================================================================

    //Map a instance of Core against the global gamekit object.
    gamekit.extend(gamekit, new gamekit.Core());

    //The main module is required and automatically loaded.
    //Its set into a setTimout so the dev can overwrite the moduleFolder and assetFolder properties of the gamekit object before its initializing the game.
    setTimeout(function (){
		if(gamekit.loadMainModule !== false){
			gamekit.fetchModules('main');
		}
    }, 0);

})();