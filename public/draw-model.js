var DrawModel = (function() {
	var clientId = Math.floor(Math.random() * 1000000);

	return function(jsonRpcUrl) {
		var currentJsonRpcId = 0;
		function createJsonRpcRequestObject(method, params) {
			currentJsonRpcId++;
			return {
				jsonrpc: '2.0',
				id: currentJsonRpcId,
				method: method,
				params: params
			};
		}

		function sendRequestToServer(method, params) {
			return function(callback) {
				var request = new XMLHttpRequest();
				request.onload = function() {
					var jsonResponse = JSON.parse(request.response);
					if (jsonResponse.id !== requestObject.id) {
						return callback(new Error('Received response with a wrong ID: ' + request.response));
					}
					if (jsonResponse.error) {
						return callback(new Error('JSON-RPC Error: (' + jsonResponse.error.code + ') ' + jsonResponse.error.message));
					}
					callback(null, jsonResponse.result);
				};

				request.onerror = function(error) {
					callback(error);
				};

				request.open('post', jsonRpcUrl, true);
				request.setRequestHeader('Content-Type', 'application/json');

				var requestObject = createJsonRpcRequestObject(method, params);

				request.send(JSON.stringify(requestObject));
			};
		}

		return {
			sendBrushStroke: function(brush, strokes) {
				return sendRequestToServer('draw', { brush: brush, strokes: strokes });
			},
			getChanges: function(timeStamp) {
				return sendRequestToServer('getChanges', { timeStamp: timeStamp });
			},
			clearAll: function() {
				return sendRequestToServer('clearAll');
			}
		};
	};
})();