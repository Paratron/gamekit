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
    };