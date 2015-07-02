var static = require('node-static');

require('cont').run(function*() {
	var db = yield require('./lib/database')('mongodb://127.0.0.1:27017/paint-the-world');

	var userModel = yield require('./lib/user-model')(db.collection('users'));

	var JsonRpcErrorCode = {
		PARSE_ERROR: -32700,
		INVALID_REQUEST: -32600,
		METHOD_NOT_FOUND: -32601,
		INVALID_PARAMS: -32602,
		INTERNAL_ERROR: -32603
	};

	var sessions = {};
	var nextSessionId = 0;

	var methods = {
		'ping': function(params) {
			return function(callback) {
				setTimeout(callback, params.duration);
			};
		},
		'user.create': function(params) {
			return userModel.create(params.userName, params.password);
		},
		'user.login': function(params) {
			var userName = params.userName;
			var password = params.password;

			return function(callback) {
				userModel.validate(userName, password)(function(err, isValid) {
					console.log('VALIDATE:', err, isValid);

					if (err) { return callback(err); }
					if (!isValid) { return callback(null, {wrongLoginOrPassword: true}); }

					if (userName in sessions) {
						return callback(null, sessions[userName]);
					}

					var sessionId = nextSessionId++;
					sessions[userName] = sessionId;

					console.log('NEW SESSION:', sessionId);

					callback(null, sessionId);
				});
			};
		}
	};

	function createBasicJsonRpcResultObject(id) {
		return {
			ptwrpc: '1.0',
			id: id
		};
	}

	function sendJsonRpcResponse(id, properties, response) {
		var resultObject = createBasicJsonRpcResultObject(id);
		Object.keys(properties).forEach(function(key) {
			resultObject[key] = properties[key];
		});
		response.setHeader("Content-Type", "application/json");
		response.end(JSON.stringify(resultObject));
	}

	function sendRpcError(id, code, message, response) {
		sendJsonRpcResponse(id, { result: null, error: {code: code, message: message} }, response);
	}

	function sendRpcResult(id, result, response) {
		sendJsonRpcResponse(id, { result: result, error: null }, response);
	}

	function handleRpc(request, response) {
		var dataString = '';
		request.on('data', function(chunk) {
			dataString += chunk;
		});
		request.on('end', function() {
			var body = JSON.parse(dataString);
			console.log('BODY:', body);

			if (!('id' in body) || (typeof body.id !== 'number')) {
				return sendRpcError(-1, JsonRpcErrorCode.INVALID_REQUEST, 'Request body has no "id" field!', response);
			}

			if (!(body.method in methods)) {
				return sendRpcError(body.id, JsonRpcErrorCode.METHOD_NOT_FOUND, 'Method "' + body.method + '" not found!', response);
			}

			methods[body.method](body.params)(function(err, data) {
				if (err) { return sendRpcError(body.id, JsonRpcErrorCode.INTERNAL_ERROR, 'Error: ' + err, response); }
				sendRpcResult(body.id, (data !== undefined) ? data : null, response);
			});
		});
	}

	var file = new static.Server(process.argv[2]);

	require('http').createServer(function (request, response) {
		// console.log('REQ:', request.method, request.url);

		if ((request.method === 'POST') && (request.url === '/ptw-rpc')) {
			handleRpc(request, response);
		} else {
			request.addListener('end', function () {
				file.serve(request, response);
			}).resume();
		}
	}).listen(8080);

	console.log('Server is up and running');
})(function(err) { throw err; });
