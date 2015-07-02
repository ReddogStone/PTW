var MongoClient = require('mongodb').MongoClient;

module.exports = function(url) {
	return function(callback) {
		MongoClient.connect(url, callback);
	};
};
