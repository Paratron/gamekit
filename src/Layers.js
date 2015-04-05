/**
 * The gamekit layers are used to render on multiple levels.
 * @type {Array}
 */
function GamekitLayer(core){
	this.entities = [];
	this.visible = true;
	this.alpha = 1;
	this._core = core;
}

GamekitLayer.prototype = {
	/**
	 * Adds a new renderable entity (Sprite, Group) to the layer.
	 * @param {*} element
	 */
	attach: function (element){
		element._core = this._core;
		this.entities.push(element);
	},
	detach: function (element){
		var idx = this.entities.indexOf(element);

		if(idx >= 0){
			this.entities.splice(idx, 1);
		}
	},
	clear: function(){
		this.entities = [];
	},
	/**
	 * Draws the contents of this layer.
	 * @param ctx
	 */
	draw: function (ctx){
		var entityLen,
			i, e,
			cameraX,
			cameraY;

		cameraX = this._core.camera.x;
		cameraY = this._core.camera.y;


		entityLen = this.entities.length - 1;
		for (i = entityLen + 1; i--;) {
			e = this.entities[entityLen - i];

			if(e._destroy){
				this.entities.splice(entityLen - i, 1);
				entityLen--;
				continue;
			}

			if(e.alpha < 0){
				e.alpha = 0;
				continue;
			}

			ctx.globalAlpha = e.alpha * this.alpha;

			e.update();
			e.x -= cameraX;
			e.y -= cameraY;
			e.draw(ctx);
			e.x += cameraX;
			e.y += cameraY;
		}
	}
};

gamekit.layer = [new GamekitLayer(gamekit)];

/**
 * Adds a new layer on top.
 */
gamekit.Core.prototype.createLayer = function (){
	var l;
	l = new GamekitLayer(this);

	this.layer.push(l);

	return l;
};