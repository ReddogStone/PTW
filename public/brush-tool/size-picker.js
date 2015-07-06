var SizePicker = (function() {
	var INITIAL_VALUE = 50;

	return function(onValueChanged) {
		var main = document.createElement('div');

		var label = document.createElement('label');
		label.innerHTML = 'Size';

		var valueText = document.createElement('div');
		valueText.innerHTML = INITIAL_VALUE;

		var slider = document.createElement('input')
		slider.setAttribute('type', 'range');
		slider.setAttribute('min', 1);
		slider.setAttribute('max', 200);
		slider.setAttribute('value', INITIAL_VALUE);
		slider.setAttribute('step', 1);

		slider.addEventListener('change', function(event) {
			onValueChanged(slider.value);
			valueText.innerHTML = slider.value;
		}, true);

		slider.addEventListener('input', function(event) {
			valueText.innerHTML = slider.value;
		}, true);

		main.appendChild(label);
		main.appendChild(slider);
		main.appendChild(valueText);

		onValueChanged(INITIAL_VALUE);

		return main;

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