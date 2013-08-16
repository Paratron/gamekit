    var gameRunning;

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
        var key,
            key2,
            e,
            l,
            c,
            canvasWidth,
            canvasHeight;

        if(!gameRunning){
            return;
        }

        window.requestAnimationFrame(mainLoop);

        c = ctx;
        canvasWidth = gamekit.width();
        canvasHeight = gamekit.height();

        if(clearW || clearH){
            c.clearRect(clearX, clearY, clearW, clearH);
        }

        for (key in gamekit.layer) {
            l = gamekit.layer[key];
            if(!l.visible || !l.alpha){
                continue;
            }

            for (key2 in l.entities) {
                e = l.entities[key2];
                if(e.rotation > 360){
                    e.rotation -= 360;
                }
                c.globalAlpha = e.alpha * l.alpha;

                e.draw(c);

            }
        }
    }