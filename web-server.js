var MAX_CHANGES = 1;

var static = require('node-static');
var cont = require('node-monad').continuation;

var fs = require('fs');
var path = require('path');

var drawModel = require('./lib/draw-model').initialize(fs);

var rpcLib = require('./lib/rpc');
var V = rpcLib.validators;

var STORAGE_PATH = path.join(__dirname, 'data/storage.dat');

function parseBody(request) {
	return function(callback) {
		var dataString = '';
		request.on('data', function(chunk) {
			dataString += chunk;
		});
		request.on('end', function() {
			try {
				callback(null, dataString);
			} catch (e) {
				callback(e);
			}
		});
	};
}

function logError(err) {
	if (err) { console.log(err.stack); }
}

var file = new static.Server(process.argv[2]);

cont(function*() {
	var data = yield drawModel.load(STORAGE_PATH);

	var waitingQueue = [];
	function waitForChange() {
		return function(callback) {
			waitingQueue.push(callback);
		};
	}

	var methods = {
		'draw': {
			params: [
				{ name: 'brush', validator: V.object },
				{ name: 'strokes', validator: V.array }
			],
			action: function(brush, strokes) {
				// console.log('BRUSH:', brush);
				// console.log('STROKES:', strokes);

				return cont(function*() {
					var entry = {
						timeStamp: Date.now(),
						brush: brush,
						strokes: strokes
					};

					data.push(entry);
					yield drawModel.push(STORAGE_PATH, entry);

					waitingQueue.forEach(function(callback) {
						callback(null, [entry]);
					});
					waitingQueue.length = 0;
				});
			}
		},
		'getChanges': {
			params: [
				{ name: 'timeStamp', validator: V.number }
			],
			action: function(timeStamp) {
				return cont(function*() {
					var lastEntry = data[data.length - 1];
					if (!lastEntry || (lastEntry.timeStamp <= timeStamp)) {
						var change = yield waitForChange();
						return change;
					}

					return data.filter(function(entry) {
						return entry.timeStamp > timeStamp;
					}).slice(0, MAX_CHANGES);
				});
			}
		},
		'clearAll': {
			params: [],
			action: function() {
				return cont(function*() {
					data = [];
					yield drawModel.store(data, STORAGE_PATH);
				});
			}			
		}
	}
	var rpc = rpcLib.initialize(methods);

	require('http').createServer(function (request, response) {
		cont(function*() {
//			console.log('REQ:', request.method, request.url);

			if ((request.method === 'POST') && (request.url === '/ptw.rpc')) {
				var body = yield parseBody(request);
				var rpcResult = yield rpc.process(body);
				response.setHeader("Content-Type", "application/json");
				response.end(JSON.stringify(rpcResult));
			} else {
				request.on('end', function () {
					file.serve(request, response);
				}).resume();
			}
		})(logError);
	}).listen(8080);
	console.log('Server is up and running');
})(logError);