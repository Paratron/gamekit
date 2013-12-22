    /**
     * The gamekit layers are used to render on multiple levels.
     * @type {Array}
     */
    function GamekitLayer(){
        this.entities = [];
        this.visible = true;
        this.alpha = 1;
        this._core = gamekit;
    }

    GamekitLayer.prototype = {
        /**
         * Adds a new renderable entity (Sprite, Group) to the layer.
         * @param {*} element
         */
        attach: function (element){
            element._core = this._core;
            this.entities.push(element);
        }
    };

    gamekit.layer = [new GamekitLayer()];

    /**
     * Adds a new layer on top.
     */
    gamekit.Core.prototype.createLayer = function (){
        var l;
        l = new GamekitLayer();
        l._core = this;

        this.layer.push(l);

        return l;
    };