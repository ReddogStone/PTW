var BrushPicker = (function() {
	
	return function(onValueChanged) {
		var controlDescriptions = [
			{
				title: 'Solid Square',
				color: 'white',
				text: 'Square',
				onClick: function() {
					onValueChanged('square');
				}
			},
			{
				title: 'Soft Circle',
				color: 'white',
				text: 'Circle',
				onClick: function() {
					onValueChanged('soft-circle');
				}
			},
			{
				title: 'Line',
				color: 'white',
				text: 'Line',
				onClick: function() {
					onValueChanged('smooth-line');
				}
			}
		];

		var SELECTED = 2;
		controlDescriptions[SELECTED].onClick();
		return RadioBar(controlDescriptions, SELECTED);
	};
})();