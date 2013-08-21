
describe('Gamekit', function() {

	it('exists', function() {
		expect(gamekit).not.toBe(null);
	});

	describe('Promise', function(){
		it('resolves an async call', function(){

		});

		it('rejects an async call', function(){

		});

		it('does something after the call is resolved or rejected', function(){

		});
	});

	describe('AssetLoader', function(){
		it('loads an asset file', function() {
			var asset, done,
				success = function(result){
					asset = result;
					done = true;
				};
			runs(function(){
				gamekit.getJSON('lib/assets/assets.json').then(success);
			});

			waitsFor(function() {
				return done;
			}, 'ajax timed out', 5000);

			runs(function() {
				expect(asset).toEqual({ background: 'background.jpg', test : 'test.JPG' });
			});
		});

		it('fetches an asset', function(){
			var asset, done,
				success = function(result){
					asset = result;
					done = true;
				};
			runs(function(){
				gamekit.fetchAssets('assets.json').then(success);
			});

			waitsFor(function() {
				return done;
			}, 'ajax timed out', 5000);

			runs(function(){
				expect(asset).not.toBe(null);
			})
		});
	});

	describe('ModuleLoader', function(){
		it('fetches a module', function(){
			var module, done,
				success = function(result){
					module = result;
					done = true
				};

			runs(function(){
				gamekit.fetchModules('main').then(success);
			});

			waitsFor(function(){
				return done;
			});

			runs(function(){
				expect(module).not.toBe(null);
			});
		});
	});

	describe('Layers', function(){
		it('creates a new layer', function(){

		});

		it('attaches an entity to a layer', function(){

		});
	});

	describe('Sprite', function(){
		it('is drawed', function(){

		});

		it('moves', function(){

		});

		it('prepares to be moved', function(){

		});
	});

	describe('Group of sprites', function(){
		it('attaches a new sprite', function(){

		});

		it('all entities are drawn', function(){

		});

		it('moves all entities', function(){

		});

		it('prepares all entities to be moved', function(){

		});
	});

	describe('Keyboard input', function(){
		it('receives an input', function(){

		});

		it('does action with input', function(){

		});
	});

	describe('Pointer input', function(){
		it('receives an input', function(){

		});

		it('does action with input', function(){

		});
	});
});