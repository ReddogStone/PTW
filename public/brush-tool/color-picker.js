var ColorPicker = (function() {
	var WIDTH = '100px';
	var HEIGHT = '20px';

	return function(onValueChanged) {
		var controlDescriptions = COLORS.map(function(colorEntry) {
			return {
				title: colorEntry.name,
				color: Color.toCss(colorEntry.value),
				width: WIDTH,
				height: HEIGHT,
				onClick: function() {
					onValueChanged(colorEntry.value);
				}
			};
		});
		controlDescriptions.push({
			title: 'Erase',
			color: null,
			width: WIDTH,
			height: HEIGHT,
			onClick: function() {
				onValueChanged(null);
			}
		});

		var SELECTED = 2;
		controlDescriptions[SELECTED].onClick();
		return RadioBar(controlDescriptions, SELECTED);
	};
})();