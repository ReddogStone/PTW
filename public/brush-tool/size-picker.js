var SizePicker = (function() {
	var SIZES = [11, 21, 31, 41, 51, 101, 201];

	return function(onValueChanged) {
		var controlDescriptions = SIZES.map(function(size) {
			return {
				title: '' + size,
				color: 'white',
				text: '' + size,
				onClick: function() {
					onValueChanged(size);
				}
			};
		});

		var SELECTED = 3;
		controlDescriptions[SELECTED].onClick();
		return RadioBar(controlDescriptions, SELECTED);
	};
})();