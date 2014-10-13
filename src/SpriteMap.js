/**
 * Automatically splits an image into a sprite map and makes tiles accessible via index.
 * The Spritemap behaves like an array, so you can access the separate sprites by calling
 *
 * mySpritemap[index]
 *
 * For example when using a sprite object:
 *
 * var car = new Sprite(mySpritemap[12]);
 *
 * @param {object} params
 * @param {Image} params.image Image object containing the spritemap
 * @param {int} params.tileW Width of the tiles
 * @param {int} params.tileH Height of the tiles
 * @param {int} [params.offsX=0] Offset (blank space) in the upper left corner of the spritemap
 * @param {int} [params.offsY=0] Offset (blank space) in the upper left corner of the spritemap
 * @param {int} [params.spacingX=0] Horizontal spacing between tiles
 * @param {int} [params.spacingY=0] Vertical spacing between tiles
 * @constructor
 */
gamekit.SpriteMap = function (params){
    var obj = [];

    params.offsX = params.offsX || 0;
    params.offsY = params.offsY || 0;
    params.spacingX = params.spacingX || 0;
    params.spacingY = params.spacingY || 0;

    obj._image = params.image;
    obj._tileW = params.tileW;
    obj._tileH = params.tileH;
    obj._animations = {};
    obj._tilesOnXAxis = Math.floor((params.image.width - params.offsX) / (params.tileW + params.spacingX));
    obj._tilesOnYAxis = Math.floor((params.image.height - params.offsY) / (params.tileH + params.spacingY));

    for (var y = 0; y < obj._tilesOnYAxis; y++) {
        for (var x = 0; x < obj._tilesOnXAxis; x++) {
            obj.push({
                image: obj._image,
                x: x * params.tileW + params.offsX + (x * params.spacingX),
                y: y * params.tileH + params.offsY + (y * params.spacingY),
                w: params.tileW,
                h: params.tileH
            });
        }
    }

    obj._isSpritemap = true;

    gamekit.extend(obj, gamekit.SpriteMap.prototype);

    return obj;
};

gamekit.SpriteMap.prototype = {
    /**
     * Creates a new animation preset and stores it on the spritemap.
     * @param {object} params
     * @param {string} params.key
     * @param {int} params.from
     * @param {int} params.to
     * @param {int} params.fps
     * @param {bool} params.loop
     */
    createAnimation: function(params){
        var obj = {
            key: params.key,
            loop: params.loop === true,
            fps: params.fps || gamekit.SpriteMap.defaultFPS,
            frames: []
        };

        for(var i = params.from; i <= params.to; i++){
            obj.frames.push(i);
        }

        this._animations[params.key] = obj;
    }
};

gamekit.SpriteMap.defaultFPS = 25;