/**
 * TileGrid
 * ========
 * The TileGrid represents a single layer of a tile map.
 * It can also be used without any surrounding map at all.
 *
 * Date: 21.03.2015 - 13:27
 */
gamekit.TileGrid = function (params){
	var obj = [[]];

	if(params._isSpritemap){
		params = {
			spritemaps: [params]
		};
	}

	obj._spritemaps = params.spritemaps || [];
	obj.width = 0;
	obj.height = 0;
	obj.x = 0;
	obj.y = 0;
	obj.alpha = 1;
	obj.originX = 0;
	obj.originY = 0;
	obj.rotation = 0;
	obj.scaleX = 1;
	obj.scaleY = 1;
	obj.gridSize = 0;
	obj.gridColor = '#000';
	this._destroy = false;

	obj._isTilegrid = true;

	gamekit.extend(obj, gamekit.TileGrid.prototype);

	if(params.width && params.height){
		obj.resize(params.width, params.height);
	}

	return obj;
};

gamekit.TileGrid.prototype = {
	setData: function(inData){
		var x;

		for(x = 0; x < inData.length; x++){
			this[x] = inData[x];
		}
	},
	setStream: function (indexStream){
		var x, y, i;

		i = 0;
		for (y = 0; y < this.height; y++) {
			for (x = 0; x < this.width; x++) {

				this[x][y] = indexStream[i] ? indexStream[i] - 1 : null;
				i++;
			}
		}
	},
	/**
	 * Will do a flood fill from the given position with the given index.
	 * @param x
	 * @param y
	 * @param index
	 */
	fill: function (x, y, index){
		if(y === undefined){
			index = x;
			x = 0;
			y = 0;
		}


	},
	/**
	 * Will set a new dimension for the tile grid.
	 * @param width
	 * @param height
	 */
	resize: function (width, height, defaultIndex){
		var x, y;

		if(defaultIndex === undefined){
			defaultIndex = null;
		}

		if(height > this[0].length){
			for (x = 0; x < this.length; x++) {
				for (y = this[x].length; y < height; y++) {
					this[x][y] = defaultIndex;
				}
			}
		}

		if(width > this.length){
			for (x = this.length; x < width; x++) {
				this[x] = [];
				for (y = 0; y < height; y++) {
					this[x].push(defaultIndex);
				}
			}
		}

		this.width = width;
		this.height = height;
	},
	update: function (){

	},
	draw: function (ctx){
		var x, //x position of rendered tile
			y, //y position of rendered tile
			tW, //width of the tiles in pixels
			tH, //height of the tiles in pixels
			oX, //offset of the layer
			oY,
			idx,//normalized tile index
			smIdx, //spritemap index
			smap;

		tW = this._spritemaps[0][0].w;
		tH = this._spritemaps[0][0].h;
		oX = this.originX;
		oY = this.originY;

		if(!this.alpha){
			return;
		}

		ctx.save();
		ctx.translate(this.x, this.y);

		if(this.alpha < 0){
			this.alpha = 0;
		}

		ctx.globalAlpha = this.alpha;

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


		for (x = 0; x < this.length; x++) {
			for (y = 0; y < this[x].length; y++) {
				idx = this[x][y];
				if(idx === null){
					continue;
				}

				for (smIdx = 0; smIdx < this._spritemaps.length; smIdx++) {
					if(idx < this._spritemaps[smIdx].length){
						smap = this._spritemaps[smIdx][idx];
						break;
					}
					idx -= this._spritemaps[smIdx].length;
				}

				ctx.drawImage(smap.image, smap.x, smap.y, tW, tH, -oX + (x * tW), -oY + (y * tH), tW, tH);
			}
		}

		if(this.gridSize){
			ctx.strokeColor = this.gridColor;
			ctx.lineWidth = this.gridSize;
			for(x = 1; x < this.length; x++){
				for(y = 1; y < this[x].length; y++){
					ctx.beginPath();
					ctx.moveTo(x * tW + 0.5, 0);
					ctx.lineTo(x * tW + 0.5, this[x].length * tH);
					ctx.stroke();
					ctx.beginPath();
					ctx.moveTo(0, y * tH + 0.5);
					ctx.lineTo(this.length * tW, y * tH + 0.5);
					ctx.stroke();
				}
			}
		}

		ctx.restore();
	}
};