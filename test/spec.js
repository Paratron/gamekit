
describe('Gamekit', function() {
	it('exists', function() {
		expect(gamekit).not.toBe(null);
	});
	it('loads asset file', function() {
		var json;
		waitsFor(function() {
			gamekit.getJSON('assets.json').then(function(result){
				json = result;
			});
		});

		expect(json).not.toBe(null);
	})
});