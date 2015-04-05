/**
 * TileMap
 * =======
 *
 *
 * @constructor
 */

gamekit.TileMap = function (tiledDocument){

	this.x = 0;
	this.y = 0;
	this.originX = 0;
	this.originY = 0;
	this.rotation = 0;
	this.scaleX = 1;
	this.scaleY = 1;
	this.alpha = 1;
	this._destroy = false;
	this._spritemaps = [];

	this.layer = [];

	this.width = 0;
	this.height = 0;

	var i, l;

	if(tiledDocument){
		this.width = tiledDocument.width;
		this.height = tiledDocument.height;

		for (i = 0; i < tiledDocument.tilesets.length; i++) {
			this._spritemaps.push(gamekit.a[tiledDocument.tilesets[i].key]);
		}

		for (i = 0; i < tiledDocument.layers.length; i++) {
			if(tiledDocument.layers[i].type !== 'tilelayer'){
				continue;
			}

			l = this.createLayer(tiledDocument.layers[i].width, tiledDocument.layers[i].height);
			l.setStream(tiledDocument.layers[i].data);
			if(!tiledDocument.layers[i].visible){
				l.alpha = 0;
			}
		}
	}
};

gamekit.TileMap.prototype = {
	createLayer: function (w, h, x, y){
		var layer;

		layer = new gamekit.TileGrid({
			spritemaps: this._spritemaps,
			x:      x || 0,
			y:      y || 0,
			width:  w || this.width,
			height: h || this.height
		});

		this.layer.push(layer);

		return layer;
	},
	update: function (){

	},
	draw: function (ctx){
		ctx.save();
		ctx.translate(this.x, this.y);
		ctx.rotate(this.rotation * Math.PI / 180);
		ctx.scale(this.scaleX, this.scaleY);

		var i;

		for (i = 0; i < this.layer.length; i++) {
			this.layer[i].draw(ctx);
		}

		ctx.restore();
	},
	/**
	 * Will return an array of tile coordinates that marks the path from tile A to tile B.
	 * When avoidTiles is given, the tile types from the array are avoided by the path.
	 * The method will return boolean false if no path is possible.
	 * TODO: fix this
	 * @param {Number} layer
	 * @param {Number} fromX
	 * @param {Number} fromY
	 * @param {Number} toX
	 * @param {Number} toY
	 * @param {Array} [avoidTiles] Optional array of palette indexes to avoid.
	 * @return {Array|false}
	 */
	getPath: function (layer, fromX, fromY, toX, toY, avoidTiles){
		var field,
			openList,
			closedList,
			currentNode,
			layerHeight,
			layerWidth;

		field = this.layer[layer];
		avoidTiles = avoidTiles || [];
		openList = [];
		closedList = [];

		layerWidth = field.length;
		layerHeight = field[0].length;

		function manhattanDistance(x1, y1, x2, y2){
			return Math.abs(x2 - x1) + Math.abs(y2 - y1);
		}

		/**
		 * Returns the Node with the best score.
		 * @returns {Mixed}
		 */
		function shiftMinNode(){
			var node;

			_.sortBy(openList, function (n){
				return n.g + n.h;
			});

			node = openList.shift();

			return node;
		}

		function closeNode(node){
			if(closedList[node.x] === undefined){
				closedList[node.x] = [];
			}
			closedList[node.x][node.y] = true;
		}

		function isClosed(node){
			if(closedList[node.x] === undefined){
				return false;
			}
			return closedList[node.x][node.y];
		}

		function isOpen(node){
			return _.find(openList, function (n){
				return n.x === node.x && n.y === node.y;
			});
		}

		function getPath(node){
			var path;

			path = [];

			while (node.parent) {
				path.push({
					x: node.x,
					y: node.y
				});
				node = node.parent;
			}

			path.push({
				x: node.x,
				y: node.y
			});

			path.shift();

			return path;
		}

		function getNode(x, y, parent, target){
			if(x < 0 || y < 0 || y >= layerHeight || x >= layerWidth){
				return;
			}

			if(closedList[x] && closedList[x][y]){
				return;
			}

			if(avoidTiles.indexOf(field[x][y]) !== -1){
				return;
			}

			target.push({x: x, y: y, g: parent.g + 1, h: manhattanDistance(x, y, fromX, fromY)});
		}

		function expand(node){
			var neighbors,
				neighbor,
				n,
				nOpen,
				key,
				tG;

			neighbors = [];

			getNode(node.x, node.y - 1, node, neighbors);
			getNode(node.x - 1, node.y, node, neighbors);
			getNode(node.x + 1, node.y, node, neighbors);
			getNode(node.x, node.y + 1, node, neighbors);

			for (key in neighbors) {
				neighbor = neighbors[key];
				tG = node.g + 1;

				if(isClosed(neighbor) && tG >= neighbor.g){
					continue;
				}

				n = isOpen(neighbor);
				if(!n || tG < neighbor.g){
					nOpen = true;
					if(!n){
						n = neighbor;
						nOpen = false;
					}
					n.parent = node;
					n.g = tG;
					if(!nOpen){
						openList.push(n);
					}
				}
			}
		}


		if(avoidTiles && avoidTiles.indexOf(field[toX][toY]) !== -1){
			return [];
		}

		openList.push({
			x: toX,
			y: toY,
			g: 0,
			h: manhattanDistance(toX, toY, fromX, fromY)
		});

		while (openList.length) {
			currentNode = shiftMinNode();

			if(currentNode.x === fromX && currentNode.y === fromY){
				return getPath(currentNode);
			}

			closeNode(currentNode);

			expand(currentNode);
		}

		return [];
	}
};