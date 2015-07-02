var cont = require('node-monad').continuation;
var assert = require('assert');

var JsonRpcErrorCode = {
	PARSE_ERROR: -32700,
	INVALID_REQUEST: -32600,
	METHOD_NOT_FOUND: -32601,
	INVALID_PARAMS: -32602,
	INTERNAL_ERROR: -32603
};

function basicJsonRpcResultObject(id) {
	return {
		jsonrpc: '2.0',
		id: id
	};
}

function rpcResponse(id, properties) {
	var result = basicJsonRpcResultObject(id);
	Object.keys(properties).forEach(function(key) {
		result[key] = properties[key];
	});
	return result;
}

function rpcError(id, code, message) {
	return rpcResponse(id, { result: null, error: {code: code, message: message} });
}

function rpcResult(id, result) {
	if (result === undefined) {
		result = null;
	}
	return rpcResponse(id, { result: result });
}

exports.initialize = function(methods) {
	return {
		process: function(bodyString) {
			return cont(function*() {
				try {
					var body = JSON.parse(bodyString);
				} catch (e) {
					return rpcError(-1, JsonRpcErrorCode.PARSE_ERROR, e.message);
				}

				if (typeof body.id !== 'number') {
					return rpcError(-1, JsonRpcErrorCode.INVALID_REQUEST, 'Invalid "id" field!');
				}

				if (!(body.method in methods)) {
					return rpcError(body.id, JsonRpcErrorCode.METHOD_NOT_FOUND, 'Method "' + body.method + '" not found!');
				}

				var method = methods[body.method];

				var params = [];
				for (var i = 0; i < method.params.length; i++) {
					var paramDesc = method.params[i];
					var name = paramDesc.name;
					var errorMessage = paramDesc.validator(name, body.params);
					if (errorMessage) {
						return rpcError(body.id, JsonRpcErrorCode.INVALID_PARAMS, errorMessage);
					}

					params.push(body.params[name]);
				}

				try {
					var result = yield method.action.apply(null, params);
					return rpcResult(body.id, result);
				} catch (e) {
					console.log(e.stack);
					return rpcError(body.id, JsonRpcErrorCode.INTERNAL_ERROR, e.message);
				}
			});
		}
	};
};

function typeCheck(type) {
	return function(key, values) {
		var actualType = typeof values[key];
		if (type !== actualType) {
			return 'Invalid type for "' + key + '", expected "' + type + '", but was "' + actualType + '"';
		}
	}
}

function required(validator) {
	return function(key, values) {
		if (!(key in values)) {
			return 'Parameter "' + key + '" is required';
		}
		return validator(key, values);
	}
}

exports.validators = {
	string: required(typeCheck('string')),
	number: required(typeCheck('number')),
	boolean: required(typeCheck('boolean')),
	object: required(typeCheck('object')),
	array: required(function(key, values) {
		if (!Array.isArray(values[key])) {
			return 'Invalid type for "' + key + '", expected "array"';
		}
	}),
	enum: function() {
		var valueMap = {};
		for (var i = 0; i < arguments.length; i++) {
			valueMap[arguments[i]] = true;
		}
		return required(function(key, values) {
			var value = values[key];
			if (!valueMap[value]) {
				return 'Invalid value for "' + key + '" parameter: "' + value + '", should be one of (' + 
					Object.keys(valueMap).map(function(value) { return '"' + value + '"'; }).join(', ') + ')';
			}
		});
	},
	optional: function(validator) {
		return function(key, values) {
			if (!(key in values)) {
				return null;
			}
			return validator(key, values);
		};
	}
};
