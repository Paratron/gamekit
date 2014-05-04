var loadScreen;

loadScreen = function(ctx, progress){
    ctx.fillColor = '#000';

    ctx.drawRect(0, 0, canvas.width, canvas.height);


};

gamekit.setLoadScreen = function(loadScreenFunc){
    loadScreen = loadScreenFunc;
};