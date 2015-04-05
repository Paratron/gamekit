//Asset loader.

/**
 * This is the asset namespace.
 * All loaded assets are stored in here.
 * @type {{}}
 */
gamekit.a = {};

/**
 * The asset folder prefix to be used for loading assets.
 * @type {string}
 */
gamekit.assetFolder = 'lib/assets/';

/**
 * Loads a JSON file from the given url and parses it.
 * @param {String} url
 * @returns {gamekit.Promise}
 */
gamekit.getJSON = function (url){
	var promise,
		s;

	promise = new gamekit.Promise();

	s = new XMLHttpRequest();
	s.onload = function (){
		var json;
		try {
			json = JSON.parse(s.responseText);
			promise.resolve(json);
		}
		catch (e) {
			promise.reject(e);
		}
	};
	s.onerror = promise.reject;
	s.open('get', url, true);
	s.send();

	return promise;
};

/**
 * Tries to load a number of given assets.
 *
 * When you pass a filename that ends to ".json" as a single string, the given filename is being loaded from
 * the asset folder and interpreted as a asset definition list to be loaded.
 *
 * The asset loader can automatically process sprite maps and sprite atlases.
 * Name your asset images like so: "myfile.smap.32x32.png" or "myfile.atlas.jpg" and gamekit will process them.
 * Make sure to place a "myfile.atlas.json" next to atlas images.
 *
 * @param {String|Array} assetNames Either a string, or array of asset file names.
 */
gamekit.loadAssets = function (assetNames){
	var promise,
		i,
		loadingAssets,
		loadedAssets,
		a,
		smapRegex,
		atlasRegex,
		xAssetKey;

	promise = new gamekit.Promise();
	loadingAssets = [];
	loadedAssets = 0;
	smapRegex = /\.smap\.(\d+)x(\d+)\./;
	atlasRegex = /\.atlas\./;

	if(typeof assetNames === 'string'){

		//Has it already been loaded?
		xAssetKey = assetNames.split(':');
		if(xAssetKey.length === 1){
			xAssetKey = xAssetKey[0].split('.');
		}
		if(gamekit.a[xAssetKey[0]] !== undefined){
			promise.resolve(gamekit.a[xAssetKey[0]]);
			return promise;
		}

		if(assetNames.substr(-5) === '.json'){
			//Does the JSON file have a key? If so, don't use it as a resource map.
			assetNames = assetNames.split(':');
			gamekit.getJSON(gamekit.assetFolder + assetNames.pop())
				.then(function (result){
					if(assetNames.length){
						gamekit.a[assetNames[0]] = result;

						//Does the result have a tilesets property?
						//If so: its a Tiled Map resource and the tilesets need to be loaded.
						if(result.tilesets){
							var loadTilesets = [],
								imgName,
								promise2;

							promise2 = new gamekit.Promise();

							for (i = 0; i < result.tilesets.length; i++) {
								imgName = result.tilesets[i].image.split('.');
								imgName.pop();
								imgName = imgName.join('.');
								result.tilesets[i].key = 'tileset_' + imgName;
								loadTilesets.push('tileset_' + imgName + ':' + result.tilesets[i].image);
							}

							gamekit
								.loadAssets(loadTilesets)
								.then(function (){
									for (i = 0; i < result.tilesets.length; i++) {
										gamekit.a[result.tilesets[i].key] = new gamekit.SpriteMap({
											image: gamekit.a[result.tilesets[i].key],
											tileW: result.tilesets[i].tilewidth,
											tileH: result.tilesets[i].tileheight,
											offsX: result.tilesets[i].margin,
											offsY: result.tilesets[i].margin,
											spacingX: result.tilesets[i].spacing,
											spacingY: result.tilesets[i].spacing
										});
									}
									promise2.resolve();
								}, function (){
									promise2.reject();
								});

							return promise2;
						}

						promise.resolve();
						return promise;
					}

					return gamekit.loadAssets(result);
				})
				.then(function (){
					promise.resolve();
				}, function (){
					promise.reject();
				});
			return promise;
		}
		assetNames = [assetNames];
	}

	function callbackFunction(){
		var result,
			that;

		//Determine if its a resource to be processed.
		result = this.src.match(smapRegex);
		if(result){
			gamekit.a[this.assetKey] = new gamekit.SpriteMap({
				image: gamekit.a[this.assetKey],
				tileW: parseInt(result[1], 10),
				tileH: parseInt(result[2], 10)
			});
			loadedAssets++;
			if(loadedAssets === loadingAssets.length){
				promise.resolve();
			}
			return;
		}

		result = this.src.match(atlasRegex);
		if(result){
			result = this.src.split('.');
			result.pop();
			result = result.join('.') + '.json';
			that = this;
			gamekit.getJSON(result).then(function (json){
				gamekit.a[that.assetKey] = new gamekit.SpriteAtlas(gamekit.a[that.assetKey], json);
				loadedAssets++;
				if(loadedAssets === loadingAssets.length){
					promise.resolve();
				}
			});
			return;
		}

		loadedAssets++;
		if(loadedAssets === loadingAssets.length){
			promise.resolve();
		}
	}

	function errorFunction(){
		promise.reject();
	}

	for (i = 0; i < assetNames.length; i++) {
		assetNames[i] = assetNames[i].split(':');
		if(assetNames[i].length !== 2){
			assetNames[i].unshift(assetNames[i][0].split('.').shift());
		}
		if(gamekit.a[assetNames[i][0]] === undefined){
			a = new Image();
			a.onload = callbackFunction;
			a.onerror = errorFunction;
			a.assetKey = assetNames[i][0];
			gamekit.a[assetNames[i][0]] = a;
			loadingAssets.push(assetNames[i]);
		}
	}

	if(loadingAssets.length){
		for (i = 0; i < loadingAssets.length; i++) {
			gamekit.a[loadingAssets[i][0]].src = gamekit.assetFolder + loadingAssets[i][1];
		}
	} else {
		promise.resolve();
	}

	return promise;
};