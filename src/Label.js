/**
 * A label can be used to render text at any place of the canvas.
 * @constructor
 */
gamekit.Label = function (){
    this.x = 0;
    this.y = 0;
    this.w = 0;
    this.h = 0;
    this.originX = 0;
    this.originY = 0;
    this.rotation = 0;
    this.alpha = 1;
    this.scaleX = 1;
    this.scaleY = 1;
    this.debugDrawing = false;
    this._destroy = false;

    this.font = 'Arial';
    this.size = 12;
    this.style = '';
    this.color = '#000';
    this.strokeColor = '#000';
    this.strokeWidth = 0;
    this.strokeOver = false;
    this.align = 'left';
    this.verticalAlign = 'top';

    this._measureCache = null;
};

gamekit.Label.prototype = {
    update: function (){
    },
    draw: function (ctx){
        var cache;

        ctx.save();

        ctx.translate(this.x, this.y);

        if(this.rotation){
            ctx.rotate(this.rotation * Math.PI / 180);
        }

        ctx.scale(this.scaleX, this.scaleY);

        ctx.font = this.size + 'px "' + this.font + '" ' + this.style;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.strokeColor;
        ctx.lineWidth = this.strokeWidth;
        ctx.textAlign = this.align;
        ctx.textBaseline = this.verticalAlign;

        cache = ctx.font + ctx.lineWidth + ctx.textAlign + ctx.textBaseline;

        if(this._measureCache !== cache){
            this._measureCache = cache;
            this.calculateDimensions();
            if(this._asyncCenter){
                delete this._asyncCenter;
                this.centerOrigin();
            }
        }

        if(this.strokeOver){
            ctx.fillText(this.value, -this.originX, -this.originY);
            if(this.strokeWidth){
                ctx.strokeText(this.value, -this.originX, -this.originY);
            }
        } else {
            if(this.strokeWidth){
                ctx.strokeText(this.value, -this.originX, -this.originY);
            }
            ctx.fillText(this.value, -this.originX, -this.originY);
        }

        if(this.debugDrawing){
            ctx.beginPath();
            ctx.strokeStyle = '#0ff';
            ctx.lineWidth = 1;

            switch (this.align) {
            case 'right':
                ctx.strokeRect(-this.originX - this.w, -this.originY, this.w, this.h);
                break;
            case 'center':
                ctx.strokeRect(-this.originX, -this.originY, this.w, this.h);
                break;
            case 'left':
                ctx.strokeRect(-this.originX + this.w, -this.originY, this.w, this.h);
                break;
            }
            ctx.stroke();
            ctx.fillStyle = '#f0f';
            ctx.beginPath();
            ctx.arc(0, 0, 2, 0, 365);
            ctx.fill();
        }

        ctx.restore();
    },
    centerOrigin: function (){
        if(this._measureCache === null){
            this._asyncCenter = true;
            return;
        }
        console.log(this);
        this.changeOrigin(this.w / 2, this.h / 2);
    },
    calculateDimensions: function (ctx){
        var temp;

        if(!ctx){
            temp = document.createElement('canvas');
            ctx = temp.getContext('2d');
        }

        ctx.save();

        ctx.font = this.size + 'px "' + this.font + '" ' + this.style;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.strokeColor;
        ctx.lineWidth = this.strokeWidth;
        ctx.textAlign = this.align;
        ctx.textBaseline = this.verticalAlign;

        this.w = ctx.measureText(this.value).width;

        temp = document.createElement('span');
        temp.style.fontFamily = this.font;
        temp.style.fontStyle = this.style;
        temp.style.verticalAlign = this.verticalAlign;
        temp.style.fontSize = this.size + 'px';
        temp.style.padding = 0;
        temp.style.margin = 0;
        temp.innerHTML = this.value;
        document.body.appendChild(temp);
        this.h = temp.offsetHeight;

        document.body.removeChild(temp);


        ctx.restore();
    }
};

gamekit.Label.prototype.tween = gamekit.Sprite.prototype.tween;
gamekit.Label.prototype.prepareTween = gamekit.Sprite.prototype.prepareTween;
gamekit.Label.prototype.changeOrigin = gamekit.Sprite.prototype.changeOrigin;
gamekit.Label.prototype.destroy = gamekit.Sprite.prototype.destroy;