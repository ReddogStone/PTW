var ViewModel = (function() {
	var brushShape = BrushShape.LINE;
	var brushSize = 1;
	var color = Color.make(0.0, 0.0, 0.0, 1.0);
	var pixelSize = 1;
	var brush = null;

	function updateBrush() {
		brush = brushShape(brushSize * pixelSize, color);
	}

	var exports = {
		get color() {
			return color;
		},
		set color(value) {
			color = value;
			// updateBrush();
		},
		get brushSize() {
			return brushSize;
		},
		set brushSize(value) {
			brushSize = value;
			// updateBrush();
		},
		get pixelSize() {
			return pixelSize;
		},
		set pixelSize(value) {
			pixelSize = value;
			// updateBrush();
		},
		set brushShape(value) {
			brushShape = value;
			// updateBrush();
		},
		get brush() {
			return {
				shape: brushShape,
				size: brushSize,
				color: color
			};
		},
	};
	return exports;
})();