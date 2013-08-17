    /**
     * The gamekit layers are used to render on multiple levels.
     * @type {Array}
     */
    function GamekitLayer(){
        this.entities = [];
        this.visible = true;
        this.alpha = 1;
    }

    GamekitLayer.prototype = {
        /**
         * Adds a new renderable entity (Sprite, Group) to the layer.
         * @param {*} element
         */
        attach: function (element){
            this.entities.push(element);
        }
    };

    gamekit.layer = [new GamekitLayer()];

    /**
     * Adds a new layer on top.
     */
    gamekit.createLayer = function (){
        var l;
        l = new GamekitLayer();

        gamekit.layer.push(l);

        return l;
    };