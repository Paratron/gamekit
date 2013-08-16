    /**
     * Most basic element to be drawn on a screen.
     * @constructor
     */
    gamekit.Sprite = function (asset){
        this.x = 0;
        this.y = 0;
        this.w = asset.width;
        this.h = asset.height;
        this.originX = 0;
        this.originY = 0;
        this.rotation = 0;
        this.scale = 1;
        this.alpha = 1;
        this.stretch = false;
        this.asset = asset;
    };
    gamekit.Sprite.prototype = {
        draw: function (ctx){
            var w,
                h,
                oX,
                oY;

            w = this.w * this.scale;
            h = this.h * this.scale;
            oX = this.originX * this.scale;
            oY = this.originY * this.scale;

            ctx.save();
            ctx.translate(this.x, this.y);


            if(this.rotation){
                ctx.rotate(this.rotation * Math.PI / 360);
            }

            if(!this.stretch && (w !== this.asset.width || h !== this.asset.height)){
                if(!this.pattern){
                    this.pattern = ctx.createPattern(this.asset, 'repeat');
                }
                ctx.rect(-oX, -oY, w, h);
                ctx.fillStyle = this.pattern;
                ctx.fill();
                ctx.restore();
                return;
            }

            ctx.drawImage(this.asset, -oX, -oY, w, h);
            ctx.restore();
        },
        /**
         * Update the sprites origin coordinates to the center of the sprite.
         * Will also update the sprites position to keep it on the same place on screen.
         */
        centerOrigin: function (){
            this.originX = this.w / 2;
            this.originY = this.h / 2;
            this.x += this.originX;
            this.y += this.originY;
        }
    };