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
            aX = this._assetDimensions.x;
            aY = this._assetDimensions.y;
            aW = this._assetDimensions.w;
            aH = this._assetDimensions.h;
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
    setAnimation: function(key){
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
            update: function(currentTime){
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
};