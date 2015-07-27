var Map = (function() {
	var CUSTOM_MAPTYPE_ID = 'custom_style';

	return function(document, mapCanvas, center, zoom) {
		var currentTool = null;
		var onZoomChanged = null;

		var mapDiv = document.getElementById('map-canvas');
		var mapOptions = {
			zoom: zoom,
			center: center,
			draggable: false,
			mapTypeControlOptions: {
				mapTypeIds: [CUSTOM_MAPTYPE_ID]
			},
			mapTypeId: CUSTOM_MAPTYPE_ID,
			disableDefaultUI: true
		};

		var map = new google.maps.Map(mapDiv, mapOptions);

		var customMapType = new google.maps.StyledMapType([
			{
				stylers: [
					{ visibility: 'simplified' },
				]
			},
			{
				featureType: 'all',
				elementType: 'labels.icon',
				stylers: [
					{ visibility: 'off' }
				]
			},
			{
				featureType: 'all',
				elementType: 'geometry.fill',
				stylers: [
					{ hue: '#000201' },
					{ gamma: 2.0 }
				]
			}
		], { name: 'Paint' });
		map.mapTypes.set(CUSTOM_MAPTYPE_ID, customMapType);		

		var isMouseDown = false;
		var mouseButton = null;

		document.addEventListener('mouseup', function(event) {
			isMouseDown = false;
		}, false);
		document.addEventListener('mousedown', function(event) {
			isMouseDown = true;
			mouseButton = event.button;
		}, true);

		document.addEventListener("touchstart", function(event) {
			mouseButton = 0;
		}, false);
		var touchEnd = function(event) {
			isMouseDown = false;
		};
		document.addEventListener("touchend", touchEnd, false);
		document.addEventListener("touchcancel", touchEnd, false);

		google.maps.event.addListener(map, 'mousedown', function(event) {
			if (currentTool) {
				currentTool.mouseDown(mouseButton, event);
			}
		});
		google.maps.event.addListener(map, 'mousemove', function(event) {
			if (currentTool) {
				currentTool.mouseMove(mouseButton, isMouseDown, event);
			}
		});
		google.maps.event.addListener(map, 'mouseup', function(event) {
			if (currentTool) {
				currentTool.mouseUp(mouseButton, event);
			}
		});

		google.maps.event.addListener(map, 'zoom_changed', function(event) {
			if (onZoomChanged) {
				onZoomChanged(map.getZoom());
			}
		});

		var backgroundLayer = CanvasMapType(new google.maps.Size(TILE_SIZE, TILE_SIZE));
		var foregroundLayer = CanvasMapType(new google.maps.Size(TILE_SIZE, TILE_SIZE));

		map.overlayMapTypes.insertAt(0, backgroundLayer);
		map.overlayMapTypes.insertAt(1, foregroundLayer);

		return {
			get internalMap() {
				return map;
			},
			get canvasLayer() {
				return foregroundLayer;
			},
			get backgroundLayer() {
				return backgroundLayer;
			},
			setTool: function(tool) {
				currentTool = tool;
			},
			addControls: function(controlRoot, index) {
				if (index !== undefined) {
					controlRoot.index = index;
				}
				map.controls[google.maps.ControlPosition.TOP_RIGHT].push(controlRoot);
			},
			set onZoomChanged(value) {
				onZoomChanged = value;
			},
			set draggable(value) {
				map.setOptions({ draggable: value });
			}
		};
	};
})();