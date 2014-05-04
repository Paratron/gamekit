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
        tweenQueue;

    //===================================================

    that = this;

    canvas = document.getElementsByTagName('canvas')[0];
    ctx = canvas.getContext('2d');
    tweenQueue = [];

    this.isRunning = false;
    this.layer = [];
    this.getLastRuntime = function(){
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

    this.width = function(newWidth){
        if(newWidth){
            canvas.width = newWidth;
        }
        return canvas.width;
    };

    this.height = function(newHeight){
        if(newHeight){
            canvas.height = newHeight;
        }
        return canvas.height;
    };

    this.addTween = function(tween){
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
    this.getCanvas = function(){
        return canvas;
    };

    /**
     * Returns a reference to the canvas context object.
     * @returns {CanvasRenderingContext2D}
     */
    this.getCTX = function(){
        return ctx;
    };

    function mainLoop(runTime){
        var i,
            j,
            e,
            l,
            layer,
            layerLen,
            entityLen,
            cameraX,
            cameraY;

        layer = that.layer;
        cameraX = that.camera.x;
        cameraY = that.camera.y;

        if(!isRunning){
            return;
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

            entityLen = l.entities.length - 1;
            for (j = entityLen + 1; j--;) {
                e = l.entities[entityLen - j];

                if(e.alpha < 0){
                    e.alpha = 0;
                }

                if(e._destroy){
                    l.entities.splice(entityLen - j, 1);
                    entityLen--;
                    continue;
                }

                ctx.globalAlpha = e.alpha * l.alpha;

                e.update();
                e.x -= cameraX;
                e.y -= cameraY;
                e.draw(ctx);
                e.x += cameraX;
                e.y += cameraY;
            }
        }

        onAfterFrame(ctx);
    }
};