// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const ELEPHANT_SIZE = 20;
const FARM_SIZE = 15;  // Smaller farms
const DETERRENT_SIZE = 15;

// Game state
let score = 0;
let resources = 100;
let elephants = [];
let farms = [];
let deterrents = [];
let gameOver = false;
let gameStarted = false;
let lastResourceUpdate = 0;

// Get canvas context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Game objects
class GameObject {
    constructor(x, y, size, color) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.range = 100; // Default range
    }    draw() {
        // Draw range indicator
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw deterrent
        ctx.globalAlpha = 1;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
    }
}

class Elephant extends GameObject {
    constructor(x, y) {
        super(x, y, ELEPHANT_SIZE, '#808080');
        this.speed = 0.5;  // Slower elephant movement
        this.targetFarm = null;
        this.isLeaving = false;  // New state for leaving behavior
        this.spawnSide = x === 0 ? 'left' : x === CANVAS_WIDTH ? 'right' : y === 0 ? 'top' : 'bottom';
    }    update() {
        if (this.isLeaving) {
            // Move toward the original spawn side
            let targetX = this.x;
            let targetY = this.y;
            
            switch(this.spawnSide) {
                case 'left': targetX = -50; break;
                case 'right': targetX = CANVAS_WIDTH + 50; break;
                case 'top': targetY = -50; break;
                case 'bottom': targetY = CANVAS_HEIGHT + 50; break;
            }

            const angle = Math.atan2(targetY - this.y, targetX - this.x);
            this.x += Math.cos(angle) * this.speed;
            this.y += Math.sin(angle) * this.speed;
            
            return;
        }

        if (!this.targetFarm) {
            this.targetFarm = findNearestFarm(this);
        }        
        
        if (this.targetFarm) {
            // Check for nearby deterrents
            const nearbyDeterrent = deterrents.find(d => 
                Math.hypot(d.x - this.x, d.y - this.y) < d.range
            );            if (nearbyDeterrent) {
                // Set elephant to leaving state when deterred
                this.isLeaving = true;
            } else {
                // Move toward farm
                const angle = Math.atan2(this.targetFarm.y - this.y, this.targetFarm.x - this.x);
                this.x += Math.cos(angle) * this.speed;
                this.y += Math.sin(angle) * this.speed;

                // Check if elephant reached farm
                if (Math.hypot(this.x - this.targetFarm.x, this.y - this.targetFarm.y) < FARM_SIZE) {
                    gameOver = true;
                }
            }
        }
    }
}

// Deterrent types
const DETERRENT_TYPES = {
    beehive: { color: '#FFD700', range: 120, cost: 25 },
    chili: { color: '#FF4444', range: 80, cost: 15 },
    light: { color: '#00FFFF', range: 100, cost: 20 }
};

let selectedDeterrent = 'beehive';

// Initialize game
function initGame() {
    // Reset game state
    score = 0;
    resources = 100;
    elephants = [];
    farms = [];
    deterrents = [];
    gameOver = false;
    gameStarted = false;
    lastResourceUpdate = 0;

    // Create initial farms
    for (let i = 0; i < 3; i++) {
        farms.push(new GameObject(
            Math.random() * (CANVAS_WIDTH - 100) + 50,
            Math.random() * (CANVAS_HEIGHT - 100) + 50,
            FARM_SIZE,
            '#8B4513'
        ));
    }

    // Add event listeners for deterrent selection
    const deterrentBtns = document.querySelectorAll('.deterrent-btn');
    deterrentBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            deterrentBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedDeterrent = btn.id;
        });
    });    // Add start button listener
    const startButton = document.getElementById('startButton');
    const startOverlay = document.getElementById('startOverlay');
    startButton.addEventListener('click', () => {
        gameStarted = true;
        startOverlay.style.display = 'none';
    });

    // Add canvas click listener for placing deterrents
    canvas.addEventListener('click', (e) => {
        if (!gameStarted || gameOver) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const deterrentType = DETERRENT_TYPES[selectedDeterrent];
        
        if (resources >= deterrentType.cost) {
            const deterrent = new GameObject(x, y, DETERRENT_SIZE, deterrentType.color);
            deterrent.range = deterrentType.range;
            deterrents.push(deterrent);
            resources -= deterrentType.cost;
            updateUI();
        }
    });
}

// Helper functions
function findNearestFarm(elephant) {
    return farms.reduce((nearest, farm) => {
        const distance = Math.hypot(farm.x - elephant.x, farm.y - elephant.y);
        if (!nearest || distance < Math.hypot(nearest.x - elephant.x, nearest.y - elephant.y)) {
            return farm;
        }
        return nearest;
    }, null);
}

function updateUI() {
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('resources').textContent = `Resources: ${resources}`;
}

// Game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (!gameStarted) {
        // Draw "Click Start to Begin" message
        ctx.fillStyle = '#333';
        ctx.font = '24px Arial';
        ctx.fillText('Click Start to Begin', CANVAS_WIDTH/2 - 100, CANVAS_HEIGHT/2);
        requestAnimationFrame(gameLoop);
        return;
    }

    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.fillText('Game Over!', CANVAS_WIDTH/2 - 100, CANVAS_HEIGHT/2);
        ctx.font = '24px Arial';
        ctx.fillText('Final Score: ' + score, CANVAS_WIDTH/2 - 60, CANVAS_HEIGHT/2 + 50);
        // Show start button again
        document.getElementById('startOverlay').style.display = 'flex';
        return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);    // Spawn new elephant randomly
    if (Math.random() < 0.01 && elephants.length < 5) {  // Reduced spawn rate
        const side = Math.floor(Math.random() * 4);
        let x, y;
        switch(side) {
            case 0: x = 0; y = Math.random() * CANVAS_HEIGHT; break;
            case 1: x = CANVAS_WIDTH; y = Math.random() * CANVAS_HEIGHT; break;
            case 2: x = Math.random() * CANVAS_WIDTH; y = 0; break;
            case 3: x = Math.random() * CANVAS_WIDTH; y = CANVAS_HEIGHT; break;
        }
        elephants.push(new Elephant(x, y));
    }

    // Update and draw game objects
    elephants.forEach(elephant => {
        elephant.update();
        elephant.draw();
    });

    farms.forEach(farm => farm.draw());
    deterrents.forEach(deterrent => deterrent.draw());    // Update score and resources
    score++;
    
    // Add resources every 10 seconds (600 frames at 60fps)
    if (score - lastResourceUpdate >= 600) {
        resources += 5;
        lastResourceUpdate = score;
    }

    // Clean up elephants that have left the screen
    elephants = elephants.filter(elephant => {
        const margin = 100;
        return elephant.x > -margin && 
               elephant.x < CANVAS_WIDTH + margin && 
               elephant.y > -margin && 
               elephant.y < CANVAS_HEIGHT + margin;
    });

    updateUI();

    // Next frame
    requestAnimationFrame(gameLoop);
}

// Start game
initGame();
gameLoop();
