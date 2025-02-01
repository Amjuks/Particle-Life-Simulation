const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;

// Setup
let n = 1300; // Number of Particles
let nc = 5; // Number of Colors
let radius = 1; // Radius of Particle
let endAngle = 2 * Math.PI; // End Angle of Arc
let forceRadius = 150; // Radius in which any force applies
let dt = 0.01;
let frictionHalfLife = 0.045;
let dampingFactor = Math.pow(0.5, dt / frictionHalfLife);
let forcePower = 5;
let matrixEvolution = 1;
let matrixEvolutionDuration = 1 * 1000;
let evolvePredatorPreyDuration = 30 * 1000;
let predatorPreyPairs = generatePredatorPreyPairs(nc);

// Particle Properties
const positionX = new Float32Array(n);
const positionY = new Float32Array(n);
const velocitiesX = new Float32Array(n);
const velocitiesY = new Float32Array(n);
const colors = new Int16Array(n);
let attractionMatrix = createAttractionMatrix(nc);

const baseDamping = 0.98;
const minDamping = 0.9;
const speedThreshold = 0.5;

// Mouse state for interaction
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;
let mouseActive = false;

// Listen for mouse events
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
  mouseActive = false;
});
canvas.addEventListener('mouseleave', () => {
  mouseActive = false;
});

// Create Attraction Matrix with Symbiotic Pairs
function createAttractionMatrix(nc) {
    const rows = [];
    const symbioticPairs = generateSymbioticPairs(nc);

    for (let i = 0; i < nc; i++) {
        const row = [];
        for (let j = 0; j < nc; j++) {
            if (i === j) {
                row.push(Math.random() * 1);
            } else if (isSymbiotic(i, j, symbioticPairs)) {
                row.push(Math.random() * 1 + 1);
            } else {
                row.push(Math.random() * 2 - 1);
            }
        }
        rows.push(row);
    }
    return rows;
}

function generateSymbioticPairs(nc) {
    if (nc < 2) return [];
    const pairs = [];
    const availableColors = Array.from({ length: nc }, (_, i) => i);

    while (availableColors.length > 1) {
        const index1 = Math.floor(Math.random() * availableColors.length);
        const color1 = availableColors.splice(index1, 1)[0];
        const index2 = Math.floor(Math.random() * availableColors.length);
        const color2 = availableColors.splice(index2, 1)[0];
        pairs.push([color1, color2]);
    }
    return pairs;
}

function isSymbiotic(i, j, pairs) {
    for (const pair of pairs) {
        if ((pair[0] === i && pair[1] === j) || (pair[0] === j && pair[1] === i)) {
            return true;
        }
    }
    return false;
}

// Setup Particle Properties
for (let i = 0; i < n; i++) {
    positionX[i] = Math.random() * canvas.width;
    positionY[i] = Math.random() * canvas.height;
    velocitiesX[i] = 0;
    velocitiesY[i] = 0;
    colors[i] = Math.floor(Math.random() * nc);
}

function generatePredatorPreyPairs(nc) {
    if (nc < 2) return []; 

    const pairs = [];
    const availableSpecies = Array.from({ length: nc }, (_, i) => i);

    for (let i = 0; i < nc; i++) {
        let prey;
        do {
            prey = availableSpecies[Math.floor(Math.random() * availableSpecies.length)];
        } while (prey === i);

        pairs.push([i, prey]);
    }

    return pairs;
}

function isPredatorPrey(predator, prey) {
    return predatorPreyPairs.some(([pred, pr]) => pred === predator && pr === prey);
}

function evolvePredatorPreyPairs() {
    predatorPreyPairs = generatePredatorPreyPairs(nc);
}

setInterval(evolvePredatorPreyPairs, evolvePredatorPreyDuration);

// Force function used between particles
const beta = [0.1, 0.6];
function force(d, a = 0.3) {
    if (d < beta[0]) {
        return -2 * Math.exp(-d / beta[0]);
    } else if ((d > beta[0]) && (d < beta[1])) {
        return a * ((1 - Math.abs(2 * d - 1 - beta[0])) / (1 - beta[0]));
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
    if (nc < 1) return;

  const i = Math.floor(Math.random() * nc);
  let j = Math.floor(Math.random() * nc);
  while (j === i) {
    j = Math.floor(Math.random() * nc);
  }
  let delta = (Math.random() * matrixEvolution - (matrixEvolution / 2));
  attractionMatrix[i][j] += delta;
  attractionMatrix[i][j] = Math.max(-2, Math.min(3, attractionMatrix[i][j]));
}

// Evolve matrix every 2 seconds
setInterval(evolveAttractionMatrix, matrixEvolutionDuration);

function updateParticles() {
    for (let i = 0; i < n; i++) {
        let totalForceX = 0;
        let totalForceY = 0;

        for (let j = 0; j < n; j++) {
            if (i === j) continue;

            const dx = minimumDistance(positionX[j] - positionX[i], canvas.width);
            const dy = minimumDistance(positionY[j] - positionY[i], canvas.height);
            const d = Math.sqrt(dx * dx + dy * dy);

            if (d > 0 && d < forceRadius) {
                let f = force(d / forceRadius, attractionMatrix[colors[i]][colors[j]]);

                // Apply Predator-Prey Rules
                if (isPredatorPrey(colors[i], colors[j])) {
                    f *= 2; // Predator is strongly attracted to prey
                } else if (isPredatorPrey(colors[j], colors[i])) {
                    f *= -1.5; // Prey is repelled by its predator
                }

                totalForceX += (dx / d) * f;
                totalForceY += (dy / d) * f;
            }
        }

        // Apply mouse repulsion if active
        if (mouseActive) {
            const dxm = minimumDistance(mouseX - positionX[i], canvas.width);
            const dym = minimumDistance(mouseY - positionY[i], canvas.height);
            const dm = Math.sqrt(dxm * dxm + dym * dym);

            // If the particle is close enough to the mouse, push it away
            if (dm > 0 && dm < forceRadius) {
                // A simple inverse-square law repulsion
                const repulsion = force(dm / forceRadius, -1);
                totalForceX += (dxm / dm) * repulsion * 3;
                totalForceY += (dym / dm) * repulsion * 3;
            }
        }

        velocitiesX[i] += forceRadius * totalForceX * forcePower * dt;
        velocitiesY[i] += forceRadius * totalForceY * forcePower * dt;

        velocitiesX[i] *= dampingFactor;
        velocitiesY[i] *= dampingFactor;

        let speed = Math.hypot(velocitiesX[i], velocitiesY[i]);
        let dynamicDamping = speed < speedThreshold ? minDamping : baseDamping;
        velocitiesX[i] *= dynamicDamping;
        velocitiesY[i] *= dynamicDamping;
    }

    for (let i = 0; i < n; i++) {
        positionX[i] += velocitiesX[i] * dt;
        positionY[i] += velocitiesY[i] * dt;

        if (positionX[i] < 0) positionX[i] += canvas.width;
        if (positionX[i] > canvas.width) positionX[i] -= canvas.width;
        if (positionY[i] < 0) positionY[i] += canvas.height;
        if (positionY[i] > canvas.height) positionY[i] -= canvas.height;
    }
}

function drawParticles() {
    for (let i = 0; i < n; i++) {
        ctx.beginPath();
        ctx.arc(positionX[i], positionY[i], radius, 0, endAngle);
        ctx.fillStyle = `hsl(${colors[i] * 360 / nc}, 100%, 50%)`;
        ctx.fill();
    }
}

function clearCanvas() {
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function loop() {
    clearCanvas();
    updateParticles();
    drawParticles();
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
