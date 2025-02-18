const form = document.querySelector('.form-container');
let inactivityTimeout;

const formInputs = {};

function showForm() {
  form.style.display = 'block';
  setTimeout(() => {
    form.style.opacity = 1;
    form.style.transform = 'translate(-50%, -50%) scale(1)';
  }, 10);
  resetInactivityTimeout();
}

function hideForm() {
  form.style.opacity = 0;
  form.style.transform = 'translate(-50%, -50%) scale(0.9)';
  setTimeout(() => {
    form.style.display = 'none';
  }, 500);
}

function resetInactivityTimeout() {
	clearTimeout(inactivityTimeout);
	inactivityTimeout = setTimeout(hideForm, 5000);
}

function updateURLparams(param, value) {
  params.set(param, value);
  url.search = params.toString();
  window.history.replaceState({}, '', url);
}

function updateInputValues(input, display, initialize, multiplier=1, round=0) {
	const displayElement = document.querySelector(display);

	if (initialize) {
		input.addEventListener('input', () => {
			const value = input.value;
			displayElement.textContent = (value * multiplier).toFixed(round);
			simulationParams[initialize] = value;
      updateURLparams(initialize, value);
			if (initializeParameters.includes(initialize)) {
				initializeSimulation();
			}
		});
	} else {
		input.addEventListener('input', () => {
			const value = input.value;
			displayElement.textContent = (value * multiplier).toFixed(round);
      updateURLparams(initialize, value);
		});
	}

	input.dispatchEvent(new Event('input'));
}

function updateCheckboxValues(input, func) {
  func(input.checked);

  input.addEventListener('change', () => {
    func(input.checked);
  })
}

function initFormInputs() {
    const inputs = [
        'numberOfParticles',
        'numberOfColors',
        'radius',
        'forceRadius',
        'forcePower',
        'matrixEvolutionDelta',
        'matrixEvolutionDuration',
        'predatorPreyEvolutionDuration',
        'toggleMatrixEvolution',
        'togglePredatorPreyEvolution',
        'mouseRepulsion',
        'toggleAttractionMatrix',
    ];

    inputs.forEach(inputId => {
        formInputs[inputId] = document.getElementById(inputId);
    })

    formInputs[inputs[0]].value = simulationParams.n;
    formInputs[inputs[1]].value = simulationParams.nc;
    formInputs[inputs[2]].value = simulationParams.radius;
    formInputs[inputs[3]].value = simulationParams.forceRadius;
    formInputs[inputs[4]].value = simulationParams.forcePower;
    formInputs[inputs[5]].value = simulationParams.matrixEvolutionDelta;
    formInputs[inputs[6]].value = simulationParams.matrixEvolutionDuration;
    formInputs[inputs[8]].value = simulationParams.enableMatrixEvolution;

	updateInputValues(formInputs[inputs[0]], '#numberOfParticlesValue', 'n');
	updateInputValues(formInputs[inputs[1]], '#numberOfColorsValue', 'nc');
	updateInputValues(formInputs[inputs[2]], '#radiusValue', 'radius', 1, 1);
	updateInputValues(formInputs[inputs[3]], '#forceRadiusValue', 'forceRadius');
	updateInputValues(formInputs[inputs[4]], '#forcePowerValue', 'forcePower');
	updateInputValues(formInputs[inputs[5]], '#matrixEvolutionDeltaValue', 'matrixEvolutionDelta', 1, 2);
	updateInputValues(formInputs[inputs[6]], '#matrixEvolutionDurationValue', 'matrixEvolutionDuration', 0.001, 1);
  updateCheckboxValues(formInputs[inputs[8]], toggleEvolutionMatrix);
  updateCheckboxValues(formInputs[inputs[10]], () => { simulationParams.mouseRepulsion = formInputs[inputs[10]].checked; });
}

initFormInputs();

document.addEventListener('click', (event) => {
  if (!form.contains(event.target)) {
    if (form.style.display === 'none') {
      showForm();
    } else {
      hideForm();
    }
  }
});

form.addEventListener('mousemove', resetInactivityTimeout);
form.addEventListener('click', resetInactivityTimeout);
form.addEventListener('keypress', resetInactivityTimeout);

console.log("Form Set");