/**
 * A group object can be used to group multiple gamekit.Sprite objects together, to move and rotate them at once.
 * @constructor
 */
gamekit.Group = function (){
    this.x = 0;
    this.y = 0;
    this.rotation = 0;
    this.alpha = 1;
    this.scaleX = 1;
    this.scaleY = 1;
    this.entities = [];
    this.debugDrawing = false;
    this._destroy = false;
};
gamekit.Group.prototype = {
    update: function (){
    },
    /**
     * Returns the boundary dimensions of this group.
     * @returns {*}
     */
    getBoundaries: function (){
        var x,
            y,
            w,
            h,
            i,
            entityLen,
            e;

        x = Number.POSITIVE_INFINITY;
        y = Number.POSITIVE_INFINITY;
        w = 0;
        h = 0;

        if(!this.entities.length){
            return {
                x: this.x,
                y: this.y,
                w: 0,
                h: 0
            };
        }

        entityLen = this.entities.length - 1;
        for (i = entityLen + 1; i--;) {
            e = this.entities[entityLen - i];
            if(e instanceof gamekit.Sprite){
                if(e.originX !== undefined){
                    x = Math.min(x, e.x - e.originX);
                    y = Math.min(y, e.y - e.originY);
                    w = Math.max(w, e.x + e.w - e.originX);
                    h = Math.max(h, e.y + e.h - e.originY);
                } else {
                    x = Math.min(x, e.x);
                    y = Math.min(y, e.y);
                    w = Math.max(w, e.x + e.w);
                    h = Math.max(h, e.y + e.h);
                }
                continue;
            }

            if(e instanceof gamekit.Group){
                e = e.getBoundaries();
                x = Math.min(x, this.x - e.x);
                y = Math.min(y, this.y - e.y);
                w = Math.max(w, e.w);
                h = Math.max(h, e.h);
            }
        }

        w -= x;
        h -= y;

        return {
            x: x,
            y: y,
            w: w,
            h: h
        };
    },
    /**
     * Adds a new renderable entity (Sprite, Group) to the layer.
     * @param {*} element
     */
    attach: function (element){
        this.entities.push(element);
    },
    draw: function (ctx){
        var alpha,
            i,
            entityLen,
            e;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 360);
        ctx.scale(this.scaleX, this.scaleY);

        alpha = ctx.globalAlpha;

        entityLen = this.entities.length - 1;
        for (i = entityLen + 1; i--;) {
            e = this.entities[entityLen - i];

            if(e._destroy){
                l.entities.splice(entityLen - i, 1);
                entityLen--;
                continue;
            }

            ctx.globalAlpha = alpha * e.alpha;

            e.update();
            e.draw(ctx);
        }

        if(this.debugDrawing){
            var bounds;
            bounds = this.getBoundaries();
            ctx.beginPath();
            ctx.strokeStyle = '#0f0';
            ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);
            ctx.stroke();
            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            ctx.arc(0, 0, 2, 0, 365);
            ctx.fill();
        }

        ctx.restore();
    },
    /**
     * Update the groups origin position to any point and update the positions of all contained entities
     * so they remain at their current visual position.
     * @param {Number} x
     * @param {Number} y
     * @return this
     */
    changeOrigin: function (x, y){
        var oldX,
            oldY,
            key,
            e;

        oldX = this.x;
        oldY = this.y;

        for (key in this.entities) {
            e = this.entities[key];
            e.x -= -oldX + x;
            e.y -= -oldY + y;
        }

        this.x = x;
        this.y = y;

        return this;
    },
    /**
     * Will cause gamekit to "destroy" this element - means remove it from all layers.
     */
    destroy: function (){
        this._destroy = true;
    }
};

gamekit.Group.prototype.tween = gamekit.Sprite.prototype.tween;
gamekit.Group.prototype.prepareTween = gamekit.Sprite.prototype.prepareTween;