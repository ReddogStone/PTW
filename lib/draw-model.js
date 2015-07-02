var cont = require('node-monad').continuation;

exports.initialize = function(fs) {
	return {
		load: function(path) {
			return cont(function*() {
				var data = yield fs.readFile.bind(fs, path, {encoding: 'utf-8'});
				return JSON.parse(data);
			});
		},
		store: function(storage, path) {
			return cont(function*() {
				var data = JSON.stringify(storage);
				yield fs.writeFile.bind(fs, path, data, { encoding: 'utf8' });
			});
		},
		drawWithBrush: function(brush, strokes) {

		},
		getChanges: function(fromDateTime) {

		}
	};
};
