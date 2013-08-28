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

gamekit.Timer = function(interval){
    var promise,
        queueObject,
        lastTick;

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
        tweenQueue.push(queueObject);
    };

    promise.enable();

    return promise;
};
