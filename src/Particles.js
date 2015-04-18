var Emitter, Particle;

gamekit.Emitter = Emitter = function (conf){
	this.x = conf.x;
	this.y = conf.y;
	this.w = conf.w;
	this.h = conf.h;
	this.debug = conf.debug;
	this.number = conf.number || 1;
	this.particles = [];
	this.spawnTime = conf.spawnTime || 1;
	this.assets = conf.assets;
	this.rotation = conf.rotation || 0;
	this.rebirth = conf.rebirth || 1;

	this._particleUpdate = conf.particleUpdate || function(){};

	var ifDef = gamekit.ifDef;

	this.particlePreset = {
		minLife: conf.life instanceof Array ? conf.life[0] : ifDef(conf.life, 100),
		maxLife: conf.life instanceof Array ? conf.life[1] : ifDef(conf.life, 100),

		minInitDirection: conf.direction instanceof Array ? conf.direction[0] : ifDef(conf.direction, 0),
		maxInitDirection: conf.direction instanceof Array ? conf.direction[1] : ifDef(conf.direction, 0),
		minDirectionChange: conf.directionChange instanceof Array ? conf.directionChange[0] : ifDef(conf.directionChange, 0),
		maxDirectionChange: conf.directionChange instanceof Array ? conf.directionChange[1] : ifDef(conf.directionChange, 0),
		minTargetDirection: conf.directionTarget instanceof Array ? conf.directionTarget[0] : ifDef(conf.directionTarget, 0),
		maxTargetDirection: conf.directionTarget instanceof Array ? conf.directionTarget[1] : ifDef(conf.directionTarget, 0),

		minInitSpeed: conf.speed instanceof Array ? conf.speed[0] : ifDef(conf.speed, 1),
		maxInitSpeed: conf.speed instanceof Array ? conf.speed[1] : ifDef(conf.speed, 1),
		minSpeedChange: conf.speedChange instanceof Array ? conf.speedChange[0] : ifDef(conf.speedChange, 0),
		maxSpeedChange: conf.speedChange instanceof Array ? conf.speedChange[1] : ifDef(conf.speedChange, 0),
		minTargetSpeed: conf.speedTarget instanceof Array ? conf.speedTarget[0] : ifDef(conf.speedTarget, 0),
		maxTargetSpeed: conf.speedTarget instanceof Array ? conf.speedTarget[0] : ifDef(conf.speedTarget, 0),

		minInitScale: conf.scale instanceof Array ? conf.scale[0] : ifDef(conf.scale, 1),
		maxInitScale: conf.scale instanceof Array ? conf.scale[1] : ifDef(conf.scale, 1),
		minScaleChange: conf.scaleChange instanceof Array ? conf.scaleChange[0] : ifDef(conf.scaleChange, 0),
		maxScaleChange: conf.scaleChange instanceof Array ? conf.scaleChange[1] : ifDef(conf.scaleChange, 0),
		minTargetScale: conf.scaleTarget instanceof Array ? conf.scaleTarget[0] : ifDef(conf.scaleTarget, 0),
		maxTargetScale: conf.scaleTarget instanceof Array ? conf.scaleTarget[0] : ifDef(conf.scaleTarget, 0),

		minInitAlpha: conf.alpha instanceof Array ? conf.alpha[0] : ifDef(conf.alpha, 1),
		maxInitAlpha: conf.alpha instanceof Array ? conf.alpha[1] : ifDef(conf.alpha, 1),
		minAlphaChange: conf.alphaChange instanceof Array ? conf.alphaChange[0] : ifDef(conf.alphaChange, 0),
		maxAlphaChange: conf.alphaChange instanceof Array ? conf.alphaChange[1] : ifDef(conf.alphaChange, 0),
		minTargetAlpha: conf.alphaTarget instanceof Array ? conf.alphaTarget[0] : ifDef(conf.alphaTarget, 0),
		maxTargetAlpha: conf.alphaTarget instanceof Array ? conf.alphaTarget[0] : ifDef(conf.alphaTarget, 0),

		fadeInValue:  conf.fadeInValue || 1,
		fadeOutValue: conf.fadeOutValue || 1
	};

	var that = this;

	for (var i = 0; i < this.number; i++) {
		setTimeout(function (){
			var p = new Particle(that);
			that.particles.push(p);
		}, gamekit.randomInRange(0, this.spawnTime));
	}
};

Emitter.prototype = {
	update: function (){
		for (var i = 0; i < this.particles.length; i++) {
			this.particles[i].update();
		}
	},
	draw: function (ctx){
		ctx.save();

		if(this.rotation){
			while (this.rotation > 360) {
				this.rotation -= 360;
			}

			while (this.rotation < 0) {
				this.rotation += 360;
			}

			ctx.rotate(this.rotation * Math.PI / 180);
		}

		if(this.debug){
			ctx.fillStyle = '#f00';
			ctx.strokeStyle = '#f00';

			ctx.strokeRect(this.x, this.y, this.w, this.h);
		}

		for (var i = 0; i < this.particles.length; i++) {
			this.particles[i].draw(ctx);
		}

		ctx.restore();
	},
	recycle: function (particle){
		var pre = this.particlePreset,
			asset;

		asset = this.assets[Math.round(gamekit.randomInRange(0, this.assets.length - 1))];

		if(asset instanceof String){
			asset = gamekit.a[asset];
		}

		particle.setAsset(asset);

		particle.w = asset.w;
		particle.h = asset.h;

		particle.fadeInValue = pre.fadeInValue;
		particle.fadeOutValue = pre.fadeOutValue;

		particle.birth = true;

		particle.scaleX = particle.scaleY = gamekit.randomInRange(pre.minInitScale, pre.maxInitScale);
		particle.scaleChange = gamekit.randomInRange(pre.minScaleChange, pre.maxScaleChange);
		particle.targetScale = gamekit.randomInRange(pre.minTargetScale, pre.maxTargetScale);

		particle.alpha = gamekit.randomInRange(pre.minInitAlpha, pre.maxInitAlpha);
		particle.alphaChange = gamekit.randomInRange(pre.minAlphaChange, pre.maxAlphaChange);
		particle.targetAlpha = gamekit.randomInRange(pre.minTargetAlpha, pre.maxTargetAlpha);

		particle.life = gamekit.randomInRange(pre.minLife, pre.maxLife);

		particle.x = gamekit.randomInRange(this.x, this.x + this.w);
		particle.y = gamekit.randomInRange(this.y, this.y + this.h);

		particle.direction = gamekit.randomInRange(pre.minInitDirection, pre.maxInitDirection);
		particle.directionChange = gamekit.randomInRange(pre.minDirectionChange, pre.maxDirectionChange);
		particle.targetDirection = gamekit.randomInRange(pre.minTargetDirection, pre.maxTargetDirection);

		particle.speed = gamekit.randomInRange(pre.minInitSpeed, pre.maxInitSpeed);
		particle.speedChange = gamekit.randomInRange(pre.minSpeedChange, pre.maxSpeedChange);
		particle.targetSpeed = gamekit.randomInRange(pre.minTargetSpeed, pre.maxTargetSpeed);

	}
};


gamekit.Particle = Particle = function (emitter){
	this.emitter = emitter;

	this.rebirth = emitter.rebirth;

	this.assets = emitter.assets;

	gamekit.Sprite.call(this, {});

	this.stretch = true;

	this._update = emitter._particleUpdate;

	emitter.recycle(this);
};

Particle.prototype = gamekit.extend(gamekit.Sprite.prototype, {
	update: function (){

		this.direction += gamekit.randomInRange(-2, 2);

		if(this.birth && this.life > 0 && this.alpha < this.targetAlpha){
			this.alpha += this.fadeInValue;

			if(this.alpha > this.targetAlpha){
				this.alpha = this.targetAlpha;
				this.birth = false;
			}
		}

		if(this.scaleChange !== 0 && this.scaleX !== this.targetScale){
			this.scaleX = this.scaleY += this.scaleChange;
			if(this.scaleChange > 0 ? (this.scaleX > this.targetScale) : (this.scaleX < this.targetScale)){
				this.scaleX = this.scaleY = this.targetScale;
				this.scaleChange = 0;
			}
		}

		if(this.alphaChange !== 0 && this.alpha !== this.targetAlpha){
			this.alpha += this.alphaChange;
			if(this.alphaChange > 0 ? (this.alpha > this.targetAlpha) : (this.alpha < this.targetAlpha)){
				this.alpha = this.targetAlpha;
				this.alphaChange = 0;
			}
		}

		if(this.directionChange !== 0 && this.direction !== this.targetDirection){
			this.direction += this.directionChange;
			if(this.directionChange > 0 ? (this.direction > this.targetDirection) : (this.direction < this.targetDirection)){
				this.direction = this.targetDirection;
				this.directionChange = 0;
			}
		}

		if(this.speedChange !== 0 && this.speed !== this.targetSpeed){
			this.speed += this.speedChange;
			if(this.speedChange > 0 ? (this.speed < this.targetSpeed) : (this.speed > this.targetSpeed)){
				this.speed = this.targetSpeed;
				this.speedChange = 0;
			}
		}

		if(this.life <= 0){
			if(this.alpha > 0){
				this.alpha -= this.fadeOutValue;
				return;
			}

			if(this.rebirth === 1 || gamekit.random() < this.rebirth){
				this.emitter.recycle(this);
			}
			return;
		}

		this.life--;

		this._update.call(this);
	}
});
