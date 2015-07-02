var MercatorProjection = (function() {

	var pixelOrigin = new google.maps.Point(TILE_SIZE / 2, TILE_SIZE / 2);
	var pixelsPerLonDegree = TILE_SIZE / 360;
	var pixelsPerLonRadian = TILE_SIZE / (2 * Math.PI);

	function bound(value, opt_min, opt_max) {
		if (opt_min != null) value = Math.max(value, opt_min);
		if (opt_max != null) value = Math.min(value, opt_max);
		return value;
	}

	function degreesToRadians(deg) {
		return deg * (Math.PI / 180);
	}

	function radiansToDegrees(rad) {
		return rad / (Math.PI / 180);
	}

	return {
		fromLatLngToPoint: function(latLng, opt_point) {
			var point = opt_point || new google.maps.Point(0, 0);
			var origin = pixelOrigin;

			point.x = origin.x + latLng.lng() * pixelsPerLonDegree;

			// Truncating to 0.9999 effectively limits latitude to 89.189. This is
			// about a third of a tile past the edge of the world tile.
			var siny = bound(Math.sin(degreesToRadians(latLng.lat())), -0.9999, 0.9999);
			point.y = origin.y + 0.5 * Math.log((1 + siny) / (1 - siny)) *
			-pixelsPerLonRadian;
			return point;
		},

		fromPointToLatLng: function(point) {
			var origin = pixelOrigin;
			var lng = (point.x - origin.x) / pixelsPerLonDegree;
			var latRadians = (point.y - origin.y) / -pixelsPerLonRadian;
			var lat = radiansToDegrees(2 * Math.atan(Math.exp(latRadians)) - Math.PI / 2);
			return new google.maps.LatLng(lat, lng);
		}
	};
})();