    var keyboardInputInitialized,
        pointerInputInitialized,
        keyboardInputListeners,
        keymap;

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

        window.onkeydown = function (e){
            var keyname,
                key;

            keyname = keymap[e.keyCode];

            if(!keyname) return;

            if(keyboardInputListeners[keyname] === undefined){
                return;
            }

            for(key in keyboardInputListeners[keyname]){
                keyboardInputListeners[keyname][key].resolve();
            }
        };

        /*window.onkeyup = function (e){

        };*/

        keyboardInputInitialized = true;
    }

    function inputInitPointers(){

    }


    gamekit.input = {
        onKey: function (keyname){
            var promise;

            inputInitKeyboard();

            promise = new gamekit.Promise();

            if(keyboardInputListeners[keyname] === undefined){
                keyboardInputListeners[keyname] = [];
            }

            keyboardInputListeners[keyname].push(promise);

            return promise;
        }
    };