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

	function line(x0, y0, x1, y1, setPixel) {
		var startX = Math.ceil(x0);
		var startY = Math.ceil(y0);

		var endX = Math.floor(x1);
		var endY = Math.floor(y1);

		var dx = x1 - x0;
		var dy = y1 - y0;

		var slope = dy / dx;

		var offY = (startX - x0) * slope;

		setPixel(Math.floor(x0), Math.floor(y0), 1);
		setPixel(Math.ceil(x1), Math.ceil(y1), 1);

		var y = startY;
		for (var x = startX; x <= endX; x++) {
			setPixel(x, y, 1 + offY);
			setPixel(x, y - 1, -offY);
			offY += slope;
			if (offY < -1) {
				offY += 1;
				y -= 1;
			}
		}
	}

	function drawLinePath(context, x0, y0, x1, y1, size, cssColor) {
		var dx = x1 - x0;
		var dy = y1 - y0;
		var l = Math.sqrt(dx * dx + dy * dy);
		var scale = size * 0.5 / l;
		dx *= scale;
		dy *= scale;

		context.fillStyle = cssColor;

		context.beginPath();
		context.moveTo(x0 - dx, y0 - dy);
		context.arcTo(x0 - dx - dy, y0 - dy + dx, x0 - dy, y0 + dx, size * 0.5);
		context.lineTo(x1 - dy, y1 + dx);
		context.arcTo(x1 - dy + dx, y1 + dx + dy, x1 + dx, y1 + dy, size * 0.5);
		context.arcTo(x1 + dx + dy, y1 + dy - dx, x1 + dy, y1 - dx, size * 0.5);
		context.lineTo(x0 + dy, y0 - dx);
		context.arcTo(x0 + dy - dx, y0 - dx - dy, x0 - dx, y0 - dy, size * 0.5);
		context.fill();
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

				var curX = currentPart.x;
				var curY = currentPart.y;

				var lineWidth = size;

				var lastX = curX;
				var lastY = curY;
				if (lastPart) {
					var lastX = lastPart.x;
					var lastY = lastPart.y;
				}

				if (!color) {
					
					return;
				}

				var backColor = Color.toCss(Color.make(color.red, color.green, color.blue, 0.2));
				drawLinePath(context, lastX, lastY, curX, curY, lineWidth + 1.5, backColor);

				var cssColor = Color.toCss(color);
				drawLinePath(context, lastX, lastY, curX, curY, lineWidth + 0.5, cssColor);

					// // Smooth
					// var bb = this.getBBForStroke(size, parts);
					// bb.x = Math.floor(bb.x);
					// bb.y = Math.floor(bb.y);
					// bb.sx = Math.ceil(bb.sx);
					// bb.sy = Math.ceil(bb.sy);
					// var imageData = context.getImageData(bb.x, bb.y, bb.sx, bb.sy);
					// var data = imageData.data;

					// var hs = size * 0.5;
					// var red = Math.floor(color.red * 255);
					// var green = Math.floor(color.green * 255);
					// var blue = Math.floor(color.blue * 255);
					// var alpha = Math.floor(color.alpha * 255);

					// function setPixel(x, y, a) {
					// 	if (x < 0 || x > bb.sx || y < 0 || y > bb.sy) {
					// 		return;
					// 	}

					// 	var offset = (y * bb.sx + x) * 4;
					// 	data[offset] = red;
					// 	data[offset + 1] = green;
					// 	data[offset + 2] = blue;
					// 	data[offset + 3] = alpha * a;
					// }

					// line(lastX - bb.x + offX, lastY - bb.y + offY, curX - bb.x + offX, curY - bb.y + offY, setPixel);
//					line(lastX - bb.x + hs, lastY - bb.y, x - bb.x + hs, y - bb.y, setPixel);

//					context.putImageData(imageData, bb.x, bb.y);

//					context.strokeStyle = cssColor;
//					context.lineWidth = lineWidth;
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