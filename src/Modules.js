    //Module support.
    /**
     * The module namespace.
     * Access all defined modules through this.
     * @type {{}}
     */
    gamekit.m = {};

    /**
     * The root folder of all game modules.
     * @type {string}
     */
    gamekit.moduleFolder = 'lib/game/';

    /**
     * Define a new module to be fetchable via dependsOn().
     * Defined modules can be accessed via gamekit.m.moduleName
     * @param {String} name The module name/key
     * @param {Function} code The initialization function
     */
    gamekit.defineModule = function (name, code){
        gamekit.m[name] = (typeof code === 'function') ? code() : code;

        //For module definitions that return a promise.
        if(gamekit.m[name] instanceof gamekit.Promise){
            gamekit.m[name].then(function(pChild, result){
                gamekit.m[name] = result;
            });
        }
    };

    /**
     * Require function for modules. Loads module files dynamically if not yet present in the namespace.
     * @param {String|Array} moduleNames Either a string (for one module), or an array of strings.
     * @returns {gamekit.Promise}
     */
    gamekit.fetchModules = function (moduleNames){
        var key,
            promise,
            modulesLoading,
            loadCounter,
            s;

        promise = new gamekit.Promise();
        modulesLoading = [];
        loadCounter = 0;

        if(typeof moduleNames === 'string'){
            moduleNames = [moduleNames];
        }

        function loadCallback(){
            loadCounter++;
            if(loadCounter === modulesLoading.length){
                promise.resolve();
            }
        }

        function errorCallback(){
            promise.reject();
        }

        for (key in moduleNames) {
            //TODO: possible multiple load attempts because it doesn't remember previous attempts.
            if(gamekit.m[moduleNames[key]] === undefined){
                modulesLoading.push(gamekit.moduleFolder + moduleNames[key] + '.js');
            }
        }

        if(modulesLoading.length){
            for (key in modulesLoading) {
                s = document.createElement('script');
                s.onload = loadCallback;
                s.onerror = errorCallback;
                document.head.appendChild(s);
                s.src = modulesLoading[key];
                modulesLoading[key] = s;
            }
        } else {
            promise.resolve();
        }

        return promise;
    };