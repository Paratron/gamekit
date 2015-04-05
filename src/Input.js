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
};