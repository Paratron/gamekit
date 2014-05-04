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