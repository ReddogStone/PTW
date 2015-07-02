var RadioBar = (function() {
	function setSelected(controlUI, value) {
		controlUI.style.borderWidth = value ? '2px' : '0px';
	}

	function makeControl(title, color, width, height) {
		var controlUI = document.createElement('div');
		controlUI.style.backgroundColor = color || 'rgba(0,0,0,0)';
		controlUI.style.borderWidth = '0px';
		controlUI.style.borderStyle = 'solid';
		controlUI.style.borderColor = 'black';
		controlUI.style.boxShadow = '1px 1px 2px #888888';
		controlUI.style.padding = '2px';
		controlUI.style.margin = '1px';
		controlUI.style.cursor = 'pointer';
		controlUI.style.textAlign = 'center';

		if (width) {
			controlUI.style.width = width;
		}
		if (height) {
			controlUI.style.height = height;
		}

		controlUI.title = title;

		return controlUI;
	}

	function makeText(text) {
		var controlText = document.createElement('div');
		controlText.style.fontFamily = 'Arial,sans-serif';
		controlText.style.fontSize = '11px';
		controlText.style.paddingLeft = '4px';
		controlText.style.paddingRight = '4px';
		controlText.innerHTML = '<b>' + text + '</b>';
		return controlText;
	}

	function makeClickHandler(controls, selectedControl, customHandler) {
		return function() {
			for (var i = 0; i < controls.length; i++) {
				setSelected(controls[i], false);
			}
			setSelected(selectedControl, true);
			if (customHandler) {
				customHandler();
			}
		};
	}

	return function(controlDescriptions, initialSelectionIndex) {
		initialSelectionIndex = initialSelectionIndex || 0;

		var mainDiv = document.createElement('div');
		mainDiv.style.padding = '5px';

		var controlUI = document.createElement('div');
		controlUI.style.padding = '2px';
		controlUI.style.borderStyle = 'solid';
		controlUI.style.borderColor = 'black';
		controlUI.style.borderWidth = '0px';
		controlUI.style.boxShadow = '1px 1px 2px #888888';
		controlUI.style.cursor = 'pointer';
		controlUI.style.backgroundColor = 'white';

		for (var i = 0; i < controlDescriptions.length; i++) {
			var controlDescription = controlDescriptions[i];
			var control = makeControl(controlDescription.title, controlDescription.color, controlDescription.width, controlDescription.height);
			if (controlDescription.text) {
				control.appendChild(makeText(controlDescription.text));
			}
			mainDiv.appendChild(control);

			google.maps.event.addDomListener(control, 'click', makeClickHandler(mainDiv.children, control, controlDescription.onClick));
		}

		setSelected(mainDiv.children[initialSelectionIndex], true);

		return mainDiv;
	};
})();