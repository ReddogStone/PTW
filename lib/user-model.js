module.exports = function(collection) {
	return function(callback) {
		collection.ensureIndex({ "userName": 1 }, { unique: true }, function(err, res) {
			if (err) { return callback(err); }

			callback(null, {
				create: function(userName, password) {
					return function(callback) {
						collection.insert({ userName: userName, password: password }, function(err) {
							callback(err, !err && {ok: true});
						});
					};
				},
				validate: function(userName, password) {
					return function(callback) {
						collection.count({userName: userName, password: password}, function(err, count) {
							return callback(err, !err && (count > 0));
						});
					};
				}
			});
		});
	};
};
