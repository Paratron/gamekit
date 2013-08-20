/**
 * GameKit
 * =======
 * A approach to create a minimalistic toolkit for canvas games.
 *
 * @author: Christian Engel <hello@wearekiss.com>
 * @license: CC BY-NC 3.0 (http://creativecommons.org/licenses/by-nc/3.0/)
 * @license: Request commercial licenses from hello@wearekiss.com
 */
(function (){
    'use strict';

    var gamekit,
        canvas,
        ctx;

    canvas = document.getElementsByTagName('canvas')[0] || window.canvas;
    ctx = canvas.getContext('2d');

    //RAF polyfill
    (function (){
        var lastTime = 0;
        var vendors = ['webkit', 'moz'];
        for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
            window.cancelAnimationFrame =
            window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
        }

        if(!window.requestAnimationFrame){
            window.requestAnimationFrame = function (callback){
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = window.setTimeout(function (){
                        callback(currTime + timeToCall);
                    },
                    timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };
        }

        if(!window.cancelAnimationFrame){
            window.cancelAnimationFrame = function (id){
                clearTimeout(id);
            };
        }
    }());

    //Initialize the gamekit namespace.
    window.gamekit = gamekit = {};


    //==================================================================================================================

//@@include('Promises.js')

    //==================================================================================================================

//@@include('Modules.js');

    //==================================================================================================================

//@@include('Assetloader.js');

//@@include('SpriteMap.js');

//@@include('SpriteAtlas.js');

    //==================================================================================================================

//@@include('Layers.js');

    //==================================================================================================================

//@@include('Renderloop.js');

    //==================================================================================================================

//@@include('Sprite.js');

    //==================================================================================================================

    //The main module is required and automatically loaded.
    //Its set into a setTimout so the dev can overwrite the moduleFolder and assetFolder properties of the gamekit object before its initializing the game.
    setTimeout(function (){
        gamekit.fetchModules('main');
    }, 0);

})();