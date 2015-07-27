var ToolPicker = (function() {
	
	return function(onValueChanged) {
		var controlDescriptions = [
			{
				title: 'Draw',
				color: 'white',
				text: 'Draw',
				onClick: function() {
					onValueChanged('brush');
				}
			},
			{
				title: 'Clear',
				color: 'white',
				text: 'Clear',
				onClick: function() {
					onValueChanged('clear');
				}
			},
			{
				title: 'Pan',
				color: 'white',
				text: 'Pan',
				onClick: function() {
					onValueChanged('pan');
				}
			}
		];

		var SELECTED = 0;
		controlDescriptions[SELECTED].onClick();
		return RadioBar(controlDescriptions, SELECTED);
	};
})();