var BrushPool = (function() {
	var brushes = {};

	function hashString(description) {
		return description.shape + '_' + description.size + '_' + Color.toCss(description.color);
	}

	function squareShape(size) {
		var offset = Math.floor(size / 2);
		var result = [];
		for (var i = 0; i < size; i++) {
			for (var j = 0; j < size; j++) {
				result.push({x: i - offset, y: j - offset});
			}
		}
		return result;
	}

	function circleShape(size) {
		var radius = size / 2;
		var squareRadius = radius * radius;
		var offset = Math.ceil(radius);
		var result = [];
		for (var i = -offset; i < offset + 1; i++) {
			for (var j = -offset; j < offset + 1; j++) {
				var squareDistance = i * i + j * j;
				if (squareDistance <= squareRadius) {
					var distance = Math.sqrt(squareDistance);
					var opacity = Math.max(0.0, (radius - distance) / radius);
					opacity = Math.pow(opacity, 10);

					result.push({x: i, y: j, opacity: opacity});
				}
			}
		}
		return result;		
	}

	function makeImageBrush(shapeFunc, size, color) {
		var brushPixels = shapeFunc(size);

		var canvas = document.createElement('canvas');
		canvas.width = size;
		canvas.height = size;

		var context = canvas.getContext('2d');
		var imageData = context.getImageData(0, 0, size, size);
		var data = imageData.data;
		var offset = Math.floor(size / 2);
		var byteColor = Color.toByteArray(color);
		for (var i = 0; i < brushPixels.length; i++) {
			var pixel = brushPixels[i];
			var x = pixel.x + offset;
			var y = pixel.y + offset;

			if (x < 0 || y < 0 || x >= size || y >= size) {
				continue;
			}

			var opacity = (pixel.opacity !== undefined) ? pixel.opacity : 1.0;
			var currentOffset = (y * size + x) * 4;
			data[currentOffset] = byteColor[0];
			data[currentOffset + 1] = byteColor[1];
			data[currentOffset + 2] = byteColor[2];
			data[currentOffset + 3] = Math.floor(byteColor[3] * opacity);
		}
		context.putImageData(imageData, 0, 0);

		return {
			size: size,
			getBBForStroke: function(parts) {

			},
			stroke: function(context, size, parts) {
				var currentPart = parts[parts.length - 1];

				var x = currentPart.x;
				var y = currentPart.y;

				var offScreen = document.createElement('canvas');
				offScreen.width = size;
				offScreen.height = size;
				var offScreenContext = offScreen.getContext('2d');

				offScreenContext.globalCompositeOperation = 'source-over';
				offScreenContext.drawImage(canvas, 0, 0);
				offScreenContext.globalCompositeOperation = 'source-atop';
				offScreenContext.fillStyle = Color.toCss(color);
				offScreenContext.fillRect(0, 0, size, size);

				context.drawImage(offScreen, x - size * 0.5, y - size * 0.5, size, size);
			}
		};
	}

	function makeLineBrush(size, color) {
		return {
			size: size,
			getBBForStroke: function(size, parts) {
				var lastPart = parts[parts.length - 2];
				var currentPart = parts[parts.length - 1];

				var hs = size * 0.5;

				if (lastPart) {
					var left = Math.min(lastPart.x, currentPart.x) - hs;
					var right = Math.max(lastPart.x, currentPart.x) + hs;
					var top = Math.min(lastPart.y, currentPart.y) - hs;
					var bottom = Math.max(lastPart.y, currentPart.y) + hs;
					return {
						x: left,
						y: top,
						sx: right - left,
						sy: bottom - top
					};
				}

				return {
					x: currentPart.x - hs,
					y: currentPart.y - hs,
					sx: size,
					sy: size
				};
			},
			draw: function(context, size, parts) {
				var lastPart = parts[parts.length - 2];
				var currentPart = parts[parts.length - 1];

				var x = currentPart.x;
				var y = currentPart.y;

				var lineWidth = size;
				var cssColor = Color.toCss(color);

				if (lastPart) {
					var lastX = lastPart.x;
					var lastY = lastPart.y;

					context.strokeStyle = cssColor;
					context.lineWidth = lineWidth;

					context.beginPath();
					context.moveTo(lastX, lastY);
					context.lineTo(x, y);
					context.stroke();
				}

				context.fillStyle = cssColor;
				context.beginPath();
				context.arc(x, y, lineWidth * 0.5, 0, Math.PI * 2);
				context.fill();
			}
		};
	}

	function make(description) {
		var shapeFunc = null;
		switch (description.shape) {
			case BrushShape.CIRCLE: return makeImageBrush(circleShape, description.size, description.color);
			case BrushShape.SQUARE: return makeImageBrush(squareShape, description.size, description.color);
			case BrushShape.LINE: return makeLineBrush(description.size, description.color);
			default: throw new Error('No know shape "' + description.shape + '"');
		}
		
	}

	var exports = {
		get: function(description) {
			return brushes[hashString(description)] || exports.prepare(description);
		},
		prepare: function(description) {
			var hash = hashString(description);
			if (!(hash in brushes)) {
				brushes[hash] = make(description);
			}

			return brushes[hash];
		}
	};

	return exports;
})();