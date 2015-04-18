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
	return (min === max) ? min: (gamekit.random() * (max - min)) + min;
};

/**
 * If value is defined, it returns value. If undefined, it returns defaultValue.
 * @param value
 * @param defaultValue
 * @returns {*}
 */
gamekit.ifDef = function(value, defaultValue){
	return value !== undefined ? value : defaultValue;
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
};