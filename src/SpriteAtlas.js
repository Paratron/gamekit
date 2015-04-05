gamekit.SpriteAtlas = function (imageObj, jsonConfig){
	var obj = {};

	obj._image = imageObj;
	obj.keys = [];

	for (var key in jsonConfig) {
		obj.keys.push(key);

		if(jsonConfig[key].x !== undefined){
			//verbose
			obj[key] = {
				image: imageObj,
				x: jsonConfig[key].x,
				y: jsonConfig[key].y,
				w: jsonConfig[key].w,
				h: jsonConfig[key].h
			};
		} else {
			//short type
			obj[key] = {
				image: imageObj,
				x: jsonConfig[key][0],
				y: jsonConfig[key][1],
				w: jsonConfig[key][2],
				h: jsonConfig[key][3]
			};
		}
	}

	obj._isSpriteAtlas = true;

	gamekit.extend(obj, gamekit.SpriteAtlas.prototype);

	return obj;
};

gamekit.SpriteAtlas.prototype = {
	/**
	 * Creates a new animation preset and stores it on the spritemap.
	 * @param key
	 * @param atlasKeys Array of keys for the animation
	 * @param loop
	 * @param fps
	 */
	createAnimation: function (key, atlasKeys, loop, fps){
		var obj = {
			key: key,
			loop: loop === true,
			fps:  fps || gamekit.SpriteMap.defaultFPS,
			frames: atlasKeys
		};

		this._animations[key] = obj;
	}
};

gamekit.SpriteAtlas.defaultFPS = 25;