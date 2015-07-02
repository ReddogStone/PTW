var CanvasMapType = (function() {
	function getKey(x, y) {
		return x + ':' + y;
	}

	function getAffectedTileKeys(tiles, zoom, tileSize, targetRect) {
		var factor = (1 << zoom) / tileSize;

		var sx = targetRect.sx * (1 << MAX_ZOOM);
		var sy = targetRect.sy * (1 << MAX_ZOOM);

		var rightOffset = sx / tileSize;
		var bottomOffset = sy / tileSize;

		var left = factor * targetRect.x;
		var top = factor * targetRect.y;
		var right = factor * targetRect.x + rightOffset;
		var bottom = factor * targetRect.y + bottomOffset;

		var tileLeft = Math.floor(left);
		var tileRight = Math.floor(right);
		var tileTop = Math.floor(top);
		var tileBottom = Math.floor(bottom);

		return [getKey(tileLeft, tileTop), getKey(tileRight, tileTop), getKey(tileLeft, tileBottom), getKey(tileRight, tileBottom)];
	}

	function brushStroke(tileCanvas, zoom, brush, parts) {
		var coord = tileCanvas._coord;
		var context = tileCanvas.getContext('2d');

		// var leftOffset = -Math.floor(brush.width / 2);
		// var topOffset = -Math.floor(brush.height / 2);
		// var rightOffset = brush.width + leftOffset;
		// var bottomOffset = brush.height + topOffset;

		var factor = 1 << zoom;
		var transformedParts = parts.map(function(part) {
			return {
				x: factor * part.x - coord.x * TILE_SIZE,
				y: factor * part.y - coord.y * TILE_SIZE,
				color: part.color
			};
		});

		// var left = factor * currentPart.x + leftOffset;
		// var top = factor * currentPart.y + topOffset;
		// var right = factor * currentPart.x + rightOffset;
		// var bottom = factor * currentPart.y + bottomOffset;

		// var x = left - coord.x * TILE_SIZE;
		// var y = top - coord.y * TILE_SIZE;
		// var sx = right - left;
		// var sy = bottom - top;

		brush.draw(context, brush.size / (1 << (MAX_ZOOM - zoom)), transformedParts);

/*
		var offScreen = document.createElement('canvas');
		offScreen.width = sx;
		offScreen.height = sy;
		var offScreenContext = offScreen.getContext('2d');

		offScreenContext.globalCompositeOperation = 'source-over';
		offScreenContext.drawImage(brush, 0, 0);
		offScreenContext.globalCompositeOperation = 'source-atop';
		offScreenContext.fillStyle = Color.toCss(color);
		offScreenContext.fillRect(0, 0, sx, sy);

		context.drawImage(offScreen, x, y);
*/
/*				var brushContext = brush.getContext('2d');
				var brushData = brushContext.getImageData(0, 0, brush.width, brush.height).data;
				var imageData = context.getImageData(x, y, brush.width, brush.height);
				var data = imageData.data;
				for (var i = 0; i < brush.width * brush.height; i++) {
					var destRed = data[4 * i];
					var destGreen = data[4 * i + 1];
					var destBlue = data[4 * i + 2];
					var destAlpha = data[4 * i + 3];
					var sourceRed = brushData[4 * i];
					var sourceGreen = brushData[4 * i + 1];
					var sourceBlue = brushData[4 * i + 2];
					var sourceAlpha = brushData[4 * i + 3];

					var sa = sourceAlpha / 255;
					var da = destAlpha / 255;
					var suma = sa + da;

					data[4 * i] = sourceRed * sourceAlpha + destRed * (1 - sourceAlpha);
					data[4 * i + 1] = sourceGreen * sourceAlpha + destGreen * (1 - sourceAlpha);
					data[4 * i + 2] = sourceBlue * sourceAlpha + destBlue * (1 - sourceAlpha);
					data[4 * i + 3] = sourceAlpha + destAlpha;
					data[4 * i] = (sourceRed * sa + destRed * da) / suma;
					data[4 * i + 1] = (sourceGreen * sa + destGreen * da) / suma;
					data[4 * i + 2] = (sourceBlue * sa + destBlue * da) / suma;
					data[4 * i + 3] = Math.min(255.0, sourceAlpha + destAlpha);

					if (sourceAlpha > 0) {
						if (sourceGreen > 200) {
							console.log(sourceRed, ',', sourceGreen, ',', sourceBlue);
						}

						data[4 * i] = sourceRed;
						data[4 * i + 1] = sourceGreen;
						data[4 * i + 2] = sourceBlue;
						data[4 * i + 3] = 255;
					}
				}

				context.putImageData(imageData, x, y); */

/*				var gradient = context.createRadialGradient(x + sx / 2, y + sx / 2, 0, x + sx / 2, y + sx / 2, sx / 2);

				var r = Math.floor(color.red * 255);
				var g = Math.floor(color.green * 255);
				var b = Math.floor(color.blue * 255);

				gradient.addColorStop(0, 'rgba(' + r +',' + g + ',' + b + ',0.1)');
				gradient.addColorStop(1, 'rgba(' + r +',' + g + ',' + b + ',0)');

				context.fillStyle = gradient;

				context.beginPath();
				context.arc(x + sx / 2, y + sx / 2, sx / 2, 0, 2 * Math.PI);
				context.fill();
				context.closePath(); */		
	}

	CanvasMapTypeProto = {
		getTile: function(coord, zoom, ownerDocument) {
			var tileSize = this.tileSize;

			var canvas = ownerDocument.createElement('canvas');
			canvas._coord = coord;
			canvas.width = tileSize.width;
			canvas.height = tileSize.height;

			var key = getKey(coord.x, coord.y);

			this._tiles[key] = canvas;
			var strokes = this._strokes[key] = this._strokes[key] || [];

			strokes.forEach(function(stroke) {
				brushStroke(canvas, stroke.zoom, stroke.brush, stroke.parts);
			});

			return canvas;
		},
		releaseTile: function(tile) {
			var coord = tile._coord;
			delete this._tiles[coord.x + ':' + coord.y];
		},
		clear: function() {
			for (var key in this._tiles) {
				var tile = this._tiles[key];
				tile.getContext('2d').clearRect(0, 0, tile.width, tile.height);
			}

			for (var key in this._strokes) {
				this._strokes[key].length = 0;
			}
		},
		setPixel: function(zoom, coords, color) {
			var affectedTiles = getAffectedTiles(this._tiles, zoom, coords, this.tileSize.width, SQUARE_WIDTH);

			Object.keys(affectedTiles).forEach(function(key) {
				var tile = affectedTiles[key];
				if (!tile) {
					return;
				}

				var coord = tile._coord;
				var context = tile.getContext('2d');

				var factor = 1 << zoom;
				var left = factor * coords.x;
				var top = factor * coords.y;
				var right = factor * (coords.x + SQUARE_WIDTH);
				var bottom = factor * (coords.y + SQUARE_WIDTH);

				var x = left - coord.x * TILE_SIZE;
				var y = top - coord.y * TILE_SIZE;
				var sx = right - left;
				var sy = bottom - top;

				context.clearRect(x, y, sx, sy);

				if (color) {
					context.globalAlpha = 0.8;
					context.fillStyle = color;
					context.fillRect(x, y, sx, sy);

/*					context.strokeStyle = color;
					context.lineWidth = 1;
					context.globalAlpha = 1;
					context.strokeRect(x + 0.5, y + 0.5, sx - 1, sy - 1); */
				}
			});
		},
		paintWithBrush: function(zoom, brush, parts) {
			var size = brush.size / (1 << MAX_ZOOM);
			var targetRect = brush.getBBForStroke(size, parts);
			var affectedTileKeys = getAffectedTileKeys(this._tiles, zoom, this.tileSize.width, targetRect);

			var angle = Math.random() * 2 * Math.PI;

			var strokes = this._strokes;
			var tiles = this._tiles;

			affectedTileKeys.forEach(function(key) {
				if (!(key in strokes)) {
					strokes[key] = [];
				}
				strokes[key].push({
					zoom: zoom,
					parts: parts,
					brush: brush
				});

				if (key in tiles) {
					brushStroke(tiles[key], zoom, brush, parts);
				}
			});
		}
	};

	function CanvasMapType(tileSize) {
		var result = Object.create(CanvasMapTypeProto);
		result.tileSize = tileSize;
		result._tiles = {};
		result._strokes = {};
		return result;
	}

	return CanvasMapType;
})();