var PixelController = (function() {
	var drawModel = DrawModel(JSON_RPC_URL);
	var currentPaintBuffer = null;

	function strokeWithBrush(layer, brush, parts) {
		for (var i = 0; i < 5; i++) {
			layer.paintWithBrush(MAX_ZOOM - i, brush, parts);		
		}
	}

	return {
		clearAll: function(map) {
			drawModel.clearAll()(function(err) { if (err) { throw err; } });
			map.canvasLayer.clear();
			map.backgroundLayer.clear();
		},
		paintWithBrush: function(map, brushDesc, x, y, color) {
			var brush = BrushPool.get(brushDesc);

			var part = {x: x, y: y, color: color};
			if (!currentPaintBuffer) {
				currentPaintBuffer = { brushDesc: brushDesc, parts: [part] };
			}

			currentPaintBuffer.parts.push(part);

			map.canvasLayer.paintWithBrush(map.internalMap.getZoom(), brush, currentPaintBuffer.parts.slice());
		},
		stopPainting: function() {
			drawModel.sendBrushStroke(currentPaintBuffer.brushDesc, currentPaintBuffer.parts)(function(err, res) {
				if (err) { throw err; }
			});

			currentPaintBuffer = null;
		},
		startUpdateLoop: function(map) {
			function asyncForEach(list, func) {
				return function(callback) {
					function next(index) {
						if (index >= list.length) { return callback(); }

						func(list[index], index, list)(function(err) {
							if (err) { return callback(err); }
							next(index + 1);
						});
					}

					next(0);
				};
			}

			var lastTimeStamp = new Date(0).getTime();

			function drawAndWaitForChanges(err, changes) {
				if (err) {
					throw err;
					return drawModel.getChanges(Date.now())(drawAndWaitForChanges);
				}

				var backgroundLayer = map.backgroundLayer;

				asyncForEach(changes, function(change) {
					return function(callback) {
						var brush = BrushPool.get(change.brush);
						var strokes = change.strokes;
						asyncForEach(strokes, function(stroke, index) {
							return function(callback) {
								strokeWithBrush(backgroundLayer, brush, strokes.slice(0, index + 1));
								setTimeout(function() { callback(); }, 0);
							};
						})(callback);
					};
				})(function(err) {
					if (err) { throw err; }

					var lastChange = changes[changes.length - 1];
					lastTimeStamp = lastChange ? lastChange.timeStamp : lastTimeStamp;

					drawModel.getChanges(lastTimeStamp)(drawAndWaitForChanges);
				});
			}
			drawModel.getChanges(lastTimeStamp)(drawAndWaitForChanges);
		}
	};
})();