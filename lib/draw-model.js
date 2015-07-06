var cont = require('node-monad').continuation;

var TIME_STAMP_SIZE = 6;
var BRUSH_SIZE = 2 + 2 + 4;
var STROKE_SIZE = 2 * 8;

function colorToBuffer(color) {
	var result = new Buffer(4);
	result.writeUInt8(Math.floor(color.red * 255), 0);
	result.writeUInt8(Math.floor(color.green * 255), 1);
	result.writeUInt8(Math.floor(color.blue * 255), 2);
	result.writeUInt8(Math.floor(color.alpha * 255), 3);
	return result;
}

function brushToBuffer(brush) {
	var buffer = new Buffer(4);
	buffer.writeUInt16BE(brush.shape, 0);
	buffer.writeUInt16BE(brush.size, 2);
	return Buffer.concat([buffer, colorToBuffer(brush.color)]);
}

function timeToBuffer(timeStamp) {
	var result = new Buffer(TIME_STAMP_SIZE);
	result.writeUIntBE(timeStamp, 0, TIME_STAMP_SIZE);
	return result;
}

function strokeToBuffer(stroke) {
	var result = new Buffer(STROKE_SIZE);
	result.writeDoubleBE(stroke.x, 0);
	result.writeDoubleBE(stroke.y, 8);
	return result;
}

function entryToBuffer(entry) {
	var buffer = Buffer.concat([
		timeToBuffer(entry.timeStamp),
		brushToBuffer(entry.brush)
	].concat(entry.strokes.map(strokeToBuffer)));

	var result = new Buffer(buffer.length + 4);
	result.writeUInt32BE(buffer.length);
	buffer.copy(result, 4);
	return result;
}

function readColor(buffer) {
	var colorInt = buffer.readUInt32BE(0);
	return {
		red: (buffer.readUInt8(0) & 0xFF) / 255,
		green: (buffer.readUInt8(1) & 0xFF) / 255,
		blue: (buffer.readUInt8(2) & 0xFF) / 255,
		alpha: (buffer.readUInt8(3) & 0xFF) / 255
	};
}

function readBrush(buffer) {
	return {
		shape: buffer.readUInt16BE(0),
		size: buffer.readUInt16BE(2),
		color: readColor(buffer.slice(4))
	}
}

function readEntry(buffer) {
	var timeStamp = buffer.readUIntBE(0, 6);
	var brush = readBrush(buffer.slice(TIME_STAMP_SIZE));

	var strokeBuffer = buffer.slice(TIME_STAMP_SIZE + BRUSH_SIZE);
	var strokeCount = strokeBuffer.length / STROKE_SIZE;
	if (strokeCount !== Math.floor(strokeCount)) {
		console.error('Wrong entry size (' + buffer.length + '):', buffer);
		throw new Error('Wrong entry size');
	}

	var strokes = [];
	for (var i = 0; i < strokeCount; i++) {
		strokes.push({
			x: strokeBuffer.readDoubleBE(i * STROKE_SIZE),
			y: strokeBuffer.readDoubleBE(i * STROKE_SIZE + 8)
		});
	}

	return {
		timeStamp: timeStamp,
		brush: brush,
		strokes: strokes
	};
}

exports.initialize = function(fs) {
	return {
		load: function(path) {
			return cont(function*() {
				try {
					var buffer = yield fs.readFile.bind(fs, path);
				} catch (e) {
					return [];
				}

				var result = [];
				while (buffer.length > 0) {
					var entrySize = buffer.readUInt32BE(0);
					result.push(readEntry(buffer.slice(4, entrySize + 4)));
					buffer = buffer.slice(4 + entrySize);
				}

				return result;
			});
		},
		store: function(storage, path) {
			return cont(function*() {
				var fd = yield fs.open.bind(fs, path, 'w');
				var buffer = Buffer.concat(storage.map(entryToBuffer));
				yield fs.write.bind(fs, fd, buffer, 0, buffer.length);
				yield fs.close.bind(fs, fd);
			});
		},
		push: function(path, entry) {
			return cont(function*() {
				var fd = yield fs.open.bind(fs, path, 'a');
				var buffer = entryToBuffer(entry);
				var written = yield fs.write.bind(fs, fd, buffer, 0, buffer.length);
				yield fs.close.bind(fs, fd);
			});
		},
		drawWithBrush: function(brush, strokes) {

		},
		getChanges: function(fromDateTime) {

		}
	};
};
