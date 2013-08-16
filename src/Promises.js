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