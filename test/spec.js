
describe('Gamekit', function() {
	it('exists', function() {
		expect(gamekit).not.toBe(null);
	});
	it('loads a whatever asset file', function() {
		var json;
		waitsFor(function() {
			gamekit.getJSON('lib/assets.json').then(function(result){
				json = result;
			});
			return json;
		});

		runs(function() {
			expect(json).toEqual({ test: 'test.jpg' });
		});
	})
});