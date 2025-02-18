const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;

// Predefined values in url
const url = new URL(window.location.href);
const params = new URLSearchParams(url.search);

const simulationParams = {
    n: params.get('n') || 800,
    nc: params.get('nc') || 5,
    radius: params.get('radius') || 2,
    forceRadius: params.get('forceRadius') || 160,
    forcePower: params.get('forcePower') || 1,
    mouseRepulsion: false,
    matrixEvolutionDelta: 1,
    matrixEvolutionInterval: null,
    matrixEvolutionDuration: 2 * 1000,
};

const initializeParameters = ['n', 'nc'];

let endAngle = 2 * Math.PI; 
let dt = 0.01;
let frictionHalfLife = 0.045;
let dampingFactor = Math.pow(0.5, dt / frictionHalfLife);
let evolvePredatorPreyDuration = 2 * 1000;
let predatorPreyPairs = generatePredatorPreyPairs(simulationParams.nc);

const baseDamping = 0.98;
const minDamping = 0.9;
const speedThreshold = 0.5;
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;
let mouseActive = false;

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
  mouseActive = true;
});
canvas.addEventListener('mouseleave', () => {
  mouseActive = false;
});

let positionX;
let positionY;
let velocitiesX;
let velocitiesY;
let colors;
let colorValues;
let attractionMatrix;

function initializeSimulation() {
    positionX = new Float32Array(simulationParams.n);
    positionY = new Float32Array(simulationParams.n);
    velocitiesX = new Float32Array(simulationParams.n);
    velocitiesY = new Float32Array(simulationParams.n);
    colors = new Int16Array(simulationParams.n);
    colorValues = [];
    attractionMatrix = createAttractionMatrix(simulationParams.nc);

    for (let i = 0; i < simulationParams.n; i++) {
        positionX[i] = Math.random() * canvas.width;
        positionY[i] = Math.random() * canvas.height;
        velocitiesX[i] = 0;
        velocitiesY[i] = 0;
        colors[i] = Math.floor(Math.random() * simulationParams.nc);
    }
    
    for (let i = 0; i < simulationParams.nc; i ++) {
        colorValues[i] = `hsl(${i * 360 / simulationParams.nc}, 100%, 50%)`;
    }   
}

function createAttractionMatrix() {
    const rows = [];
    const predatorPreyPairs = generatePredatorPreyPairs();

    for (let i = 0; i < simulationParams.nc; i++) {
        const row = [];
        for (let j = 0; j < simulationParams.nc; j++) {
            let value;
            if (i === j) {
                
                value = Math.random(); 
            } else if (isPredatorPrey(i, j, predatorPreyPairs)) {
                
                value = Math.random(); 
            } else if (isPredatorPrey(j, i, predatorPreyPairs)) {
                
                value = -Math.random(); 
            } else {
                
                value = Math.random() * 2 - 1; 
            }
            row.push(value);
        }
        rows.push(row);
    }
    return rows;
}

function generatePredatorPreyPairs() {
    if (simulationParams.nc < 2) return []; 
    return [];

    const pairs = [];
    const speciesList = Array.from({ length: simulationParams.nc }, (_, i) => i);
    const shuffledSpecies = speciesList.sort(() => Math.random() - 0.5);
    const assignedPairs = new Set();

    for (const predator of shuffledSpecies) {
        
        const potentialPrey = speciesList.filter(prey => 
            prey !== predator && 
            !assignedPairs.has(`${prey}-${predator}`)
        );

        if (potentialPrey.length === 0) {
            continue;
        }

        
        const prey = potentialPrey[Math.floor(Math.random() * potentialPrey.length)];

        pairs.push([predator, prey]);
        assignedPairs.add(`${predator}-${prey}`);
    }

    return pairs;
}

function isPredatorPrey(predator, prey) {
    return predatorPreyPairs.some(([pred, pr]) => pred === predator && pr === prey);
}

function evolvePredatorPreyPairs() {
    predatorPreyPairs = generatePredatorPreyPairs(simulationParams.nc);
    createAttractionMatrix();
}

// setInterval(evolvePredatorPreyPairs, evolvePredatorPreyDuration);

const beta = [0.1, 0.6];
function force(d, a = 0.3) {
    if (d < beta[0]) {
        return -2 * Math.pow(simulationParams.radius, 2) * Math.exp(-d / beta[0]);
    } else if ((d > beta[0]) && (d < beta[1])) {
        return simulationParams.radius * a * ((1 - Math.abs(2 * d - 1 - beta[0])) / (1 - beta[0]));
    } else if ((d > beta[1]) && (d < 1)) {
        return 0.1 * a * Math.sin(6 * d);
    } else {
        return 0;
    }
}

function minimumDistance(d, size) {
    if (d > size / 2) {
        return d - size;
    } else if (d < -size / 2) {
        return d + size;
    }
    return d;
}

function evolveAttractionMatrix() {
    if (simulationParams.nc < 1) return;

  let i = 0;
  let j = 0;

  if (simulationParams.nc > 2) {
    i = Math.floor(Math.random() * simulationParams.nc);
    while (j === i) {
        j = Math.floor(Math.random() * simulationParams.nc);
      }
  }
//   let delta = (Math.random() * simulationParams.matrixEvolutionDelta) / (2 * simulationParams.matrixEvolutionDelta);
    let delta = (Math.random() * simulationParams.matrixEvolutionDelta) - simulationParams.matrixEvolutionDelta / 2;
    attractionMatrix[i][j] += delta;
    attractionMatrix[i][j] = Math.max(-2, Math.min(3, attractionMatrix[i][j]));
}

function toggleEvolutionMatrix(toggle) {
    if (toggle) {
        simulationParams.matrixEvolutionInterval = setInterval(evolveAttractionMatrix, simulationParams.matrixEvolutionDuration);
    } else {
        clearInterval(simulationParams.matrixEvolutionInterval);
        simulationParams.matrixEvolutionInterval = null;
    }
}

function updateParticles() {
    for (let i = 0; i < simulationParams.n; i++) {
        let totalForceX = 0;
        let totalForceY = 0;
        const fr = simulationParams.forceRadius * simulationParams.radius;

        for (let j = 0; j < simulationParams.n; j++) {
            if (i === j) continue;

            const dx = minimumDistance(positionX[j] - positionX[i], canvas.width);
            const dy = minimumDistance(positionY[j] - positionY[i], canvas.height);
            const d = Math.sqrt(dx * dx + dy * dy);

            if (d > 0 && d < fr) {
                let f = force(d / fr, attractionMatrix[colors[i]][colors[j]]);

                totalForceX += (dx / d) * f;
                totalForceY += (dy / d) * f;
            }
        }

        if (simulationParams.mouseRepulsion && mouseActive) {
            const dxm = minimumDistance(mouseX - positionX[i], canvas.width);
            const dym = minimumDistance(mouseY - positionY[i], canvas.height);
            const dm = Math.sqrt(dxm * dxm + dym * dym);

            if (dm > 0 && dm < fr) {
                
                const repulsion = force(dm / simulationParams.forceRadius, -1);
                totalForceX += (dxm / dm) * repulsion * 50;
                totalForceY += (dym / dm) * repulsion * 50;
            }
        }

        velocitiesX[i] += fr * totalForceX * simulationParams.forcePower * dt;
        velocitiesY[i] += fr * totalForceY * simulationParams.forcePower * dt;

        velocitiesX[i] *= dampingFactor;
        velocitiesY[i] *= dampingFactor;

        let speed = Math.hypot(velocitiesX[i], velocitiesY[i]);
        let dynamicDamping = speed < speedThreshold ? minDamping : baseDamping;
        velocitiesX[i] *= dynamicDamping;
        velocitiesY[i] *= dynamicDamping;
    }

    for (let i = 0; i < simulationParams.n; i++) {
        positionX[i] += velocitiesX[i] * dt;
        positionY[i] += velocitiesY[i] * dt;

        if (positionX[i] < 0) positionX[i] += canvas.width;
        if (positionX[i] > canvas.width) positionX[i] -= canvas.width;
        if (positionY[i] < 0) positionY[i] += canvas.height;
        if (positionY[i] > canvas.height) positionY[i] -= canvas.height;
    }
}

function drawParticles() {
    for (let i = 0; i < simulationParams.n; i++) {
        ctx.beginPath();
        ctx.arc(positionX[i], positionY[i], simulationParams.radius, 0, endAngle);
        ctx.fillStyle = colorValues[colors[i]];
        ctx.fill();
    }
}

function clearCanvas() {
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

initializeSimulation();

function loop() {
    clearCanvas();
    updateParticles();
    drawParticles();
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
