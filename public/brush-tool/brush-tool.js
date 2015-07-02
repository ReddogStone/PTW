var BrushTool = (function() {
	return function(map, pixelController, viewModel) {
		function makePaintHandler(start) {
			return function clickHandler(event) {
				var coords = MercatorProjection.fromLatLngToPoint(event.latLng);
				// var x = Math.floor(coords.x / SQUARE_WIDTH) * SQUARE_WIDTH;
				// var y = Math.floor(coords.y / SQUARE_WIDTH) * SQUARE_WIDTH;
				var x = coords.x;
				var y = coords.y;

				pixelController.paintWithBrush(map, viewModel.brush, x, y, viewModel.color, start);
			}
		}

		var onMapDown = makePaintHandler(true);
		var onMapMove = makePaintHandler(false);
		return {
			mouseDown: function(mouseButton, event) {
				if (mouseButton === 0) {
					onMapDown(event);
				}
			},
			mouseMove: function(mouseButton, isMouseDown, event) {
				if (isMouseDown) {
					onMapMove(event);
				}
			},
			mouseUp: function(mouseButton, event) {
				if (mouseButton === 0) {
					pixelController.stopPainting();
				}				
			}
		};
	};
})();