// Amy Runs - Pink & White Lagos City Edition Engine

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Responsive Canvas Size Setup
function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Game States
let isRunning = false;
let scoreDistance = 0;
let gemsCollected = 0;
let totalUnlockedGems = 0;
let speed = 6.0; // Starting running speed
let speedMultiplier = 0.0015; // Speed increment curve over distance

// Player Outfits & Selected State
let equippedOutfit = 1;
const unlockedOutfits = [1];

// Lanes: 0 = Left, 1 = Center, 2 = Right
let currentLane = 1;
const lanePositions = [0.22, 0.50, 0.78]; // X-ratios across screen width

// Amy Character Physics
const amy = {
    x: 0,
    y: 0,
    lane: 1,
    targetX: 0,
    jumpY: 0,
    jumpVelocity: 0,
    isJumping: false,
    isSliding: false,
    slideTimer: 0,
    width: 44,
    height: 85
};

// Game Entities Arrays
let obstacles = [];
let gems = [];
let frameCount = 0;

// Lagos Skyline Visual Props
let bridgeOffset = 0;

// DOM Elements
const menuOverlay = document.getElementById("menu-overlay");
const closetOverlay = document.getElementById("closet-overlay");
const gameoverOverlay = document.getElementById("gameover-overlay");
const startBtn = document.getElementById("start-btn");
const closetBtn = document.getElementById("closet-btn");
const closeClosetBtn = document.getElementById("close-closet-btn");
const restartBtn = document.getElementById("restart-btn");
const menuBtn = document.getElementById("menu-btn");

const gemsDisplay = document.getElementById("gems-display");
const scoreDisplay = document.getElementById("score-display");
const finalScore = document.getElementById("final-score");
const finalGems = document.getElementById("final-gems");
const previewAvatar = document.getElementById("preview-avatar");
const currentOutfitName = document.getElementById("current-outfit-name");

// Controls Event Listeners
function moveLeft() {
    if (currentLane > 0) currentLane--;
}
function moveRight() {
    if (currentLane < 2) currentLane++;
}
function triggerJump() {
    if (!amy.isJumping && !amy.isSliding) {
        amy.isJumping = true;
        amy.jumpVelocity = -14;
    }
}
function triggerSlide() {
    if (!amy.isSliding && !amy.isJumping) {
        amy.isSliding = true;
        amy.slideTimer = 35; // Frames duration of sliding
    }
}

// Keyboard Listeners
window.addEventListener("keydown", (e) => {
    if (!isRunning) return;
    if (e.key === "ArrowLeft" || e.key === "a") moveLeft();
    if (e.key === "ArrowRight" || e.key === "d") moveRight();
    if (e.key === "ArrowUp" || e.key === "w" || e.key === " ") triggerJump();
    if (e.key === "ArrowDown" || e.key === "s") triggerSlide();
});

// Mobile Button Listeners
document.getElementById("btn-left").addEventListener("click", moveLeft);
document.getElementById("btn-right").addEventListener("click", moveRight);
document.getElementById("btn-jump").addEventListener("click", triggerJump);
document.getElementById("btn-slide").addEventListener("click", triggerSlide);

// Touch Swipe Gestures
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true });

canvas.addEventListener("touchend", (e) => {
    if (!isRunning) return;
    const diffX = e.changedTouches[0].clientX - touchStartX;
    const diffY = e.changedTouches[0].clientY - touchStartY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 30) moveRight();
        else if (diffX < -30) moveLeft();
    } else {
        if (diffY < -30) triggerJump();
        else if (diffY > 30) triggerSlide();
    }
}, { passive: true });

// DRAWING FUNCTIONS

// Draw Lekki-Ikoyi Link Bridge Skyline (Lagos Backdrop)
function drawLagosSkyline() {
    // Sky Background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.5);
    skyGrad.addColorStop(0, "#fbcfe8");
    skyGrad.addColorStop(1, "#fdf2f8");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.5);

    // Sun / Sunset Pink Circle
    ctx.fillStyle = "#f472b6";
    ctx.beginPath();
    ctx.arc(canvas.width * 0.5, canvas.height * 0.22, 45, 0, Math.PI * 2);
    ctx.fill();

    // Lekki Bridge Cables & Pillars Silhouette
    ctx.strokeStyle = "rgba(219, 39, 119, 0.35)";
    ctx.lineWidth = 3;

    // Bridge Tower A
    const towerX = canvas.width * 0.3;
    const towerY = canvas.height * 0.38;
    ctx.beginPath();
    ctx.moveTo(towerX, towerY);
    ctx.lineTo(towerX - 30, canvas.height * 0.5);
    ctx.moveTo(towerX, towerY);
    ctx.lineTo(towerX + 30, canvas.height * 0.5);
    ctx.stroke();

    // Stay Cables
    for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(towerX, towerY + (i * 8));
        ctx.lineTo(towerX - 70 + (i * 10), canvas.height * 0.5);
        ctx.lineTo(towerX + 70 - (i * 10), canvas.height * 0.5);
        ctx.stroke();
    }
}

// Draw 3D-Perspective Running Track
function drawRoad() {
    const horizonY = canvas.height * 0.42;

    // Main Pink Road Surface
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.35, horizonY);
    ctx.lineTo(canvas.width * 0.65, horizonY);
    ctx.lineTo(canvas.width * 0.98, canvas.height);
    ctx.lineTo(canvas.width * 0.02, canvas.height);
    ctx.closePath();
    ctx.fill();

    // Road Borders (Hot Pink Lines)
    ctx.strokeStyle = "#f472b6";
    ctx.lineWidth = 6;
    ctx.stroke();

    // Lane Lines
    ctx.strokeStyle = "rgba(244, 114, 182, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.45, horizonY);
    ctx.lineTo(canvas.width * 0.34, canvas.height);
    ctx.moveTo(canvas.width * 0.55, horizonY);
    ctx.lineTo(canvas.width * 0.66, canvas.height);
    ctx.stroke();
}

// Draw Amy Protagonist (Cute Black/Nigerian Girl Character Model)
function drawAmy() {
    const horizonY = canvas.height * 0.42;
    const roadLength = canvas.height - horizonY;
    
    // Target X Position based on lane
    const targetXRatio = lanePositions[currentLane];
    amy.targetX = canvas.width * targetXRatio;
    
    // Smooth lane transition interpolation
    amy.x += (amy.targetX - amy.x) * 0.25;
    
    // Jump physics update
    if (amy.isJumping) {
        amy.jumpY += amy.jumpVelocity;
        amy.jumpVelocity += 0.8; // Gravity
        if (amy.jumpY >= 0) {
            amy.jumpY = 0;
            amy.isJumping = false;
        }
    }

    // Slide timer update
    let currentHeight = amy.height;
    if (amy.isSliding) {
        currentHeight = amy.height * 0.5;
        amy.slideTimer--;
        if (amy.slideTimer <= 0) {
            amy.isSliding = false;
        }
    }

    const drawY = (canvas.height - 110) + amy.jumpY;

    // Shadow
    ctx.fillStyle = "rgba(219, 39, 119, 0.2)";
    ctx.beginPath();
    ctx.ellipse(amy.x, canvas.height - 25, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Character Sprite Rendering
    ctx.save();
    ctx.translate(amy.x, drawY);

    // Head / Melanin Skin Tone
    ctx.fillStyle = "#8d5524"; // Rich Brown Skin Tone
    ctx.beginPath();
    ctx.arc(0, -currentHeight + 15, 12, 0, Math.PI * 2);
    ctx.fill();

    // Stylish Afro Puffs / Braids
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.arc(-10, -currentHeight + 10, 7, 0, Math.PI * 2); // Left Puff
    ctx.arc(10, -currentHeight + 10, 7, 0, Math.PI * 2);  // Right Puff
    ctx.fill();

    // Outfits Coloring
    if (equippedOutfit === 1) { // Lagos Chic (Pink Top & Dark Tights)
        ctx.fillStyle = "#ec4899"; // Top
        ctx.fillRect(-12, -currentHeight + 28, 24, 22);
        ctx.fillStyle = "#1e293b"; // Tights
        ctx.fillRect(-10, -currentHeight + 50, 8, currentHeight - 50);
        ctx.fillRect(2, -currentHeight + 50, 8, currentHeight - 50);
    } else if (equippedOutfit === 2) { // Ankara Glam (Rose Red Set)
        ctx.fillStyle = "#f43f5e";
        ctx.fillRect(-14, -currentHeight + 28, 28, currentHeight - 35);
    } else { // Y2K Pink (Magenta Top & White Pants)
        ctx.fillStyle = "#d946ef";
        ctx.fillRect(-12, -currentHeight + 28, 24, 20);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-10, -currentHeight + 48, 8, currentHeight - 48);
        ctx.fillRect(2, -currentHeight + 48, 8, currentHeight - 48);
    }

    // White Sneakers
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-12, -8, 9, 8);
    ctx.fillRect(3, -8, 9, 8);

    ctx.restore();
}

// SPANW OBSTACLES & GEMS
function spawnEntities() {
    if (frameCount % Math.max(30, Math.floor(90 - speed * 4)) === 0) {
        const laneIdx = Math.floor(Math.random() * 3);
        const type = Math.random() > 0.4 ? "barrier" : "high_bar";

        obstacles.push({
            lane: laneIdx,
            y: 0,
            type: type, // "barrier" (must jump) or "high_bar" (must slide)
            passed: false
        });
    }

    if (frameCount % 40 === 0) {
        const laneIdx = Math.floor(Math.random() * 3);
        gems.push({
            lane: laneIdx,
            y: 0
        });
    }
}

// UPDATE & DRAW OBSTACLES / GEMS
function updateEntities() {
    const horizonY = canvas.height * 0.42;

    // Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.y += speed;

        const progress = obs.y / (canvas.height - horizonY);
        const currentY = horizonY + obs.y;
        const currentX = canvas.width * lanePositions[obs.lane];
        const scale = 0.3 + (progress * 0.7);

        // Draw Obstacle (Traffic Cone / Barrier)
        ctx.save();
        ctx.translate(currentX, currentY);
        ctx.scale(scale, scale);

        if (obs.type === "barrier") {
            // Low Barrier (Jump over)
            ctx.fillStyle = "#db2777";
            ctx.fillRect(-22, -30, 44, 30);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(-22, -20, 44, 8);
        } else {
            // High Bar (Slide under)
            ctx.fillStyle = "#f472b6";
            ctx.fillRect(-30, -75, 60, 12);
            ctx.fillRect(-30, -75, 8, 75);
            ctx.fillRect(22, -75, 8, 75);
        }
        ctx.restore();

        // Collision Check
        if (obs.y > (canvas.height - horizonY - 90) && obs.y < (canvas.height - horizonY - 20)) {
            if (obs.lane === currentLane) {
                if (obs.type === "barrier" && amy.jumpY > -20) {
                    gameOver();
                    return;
                }
                if (obs.type === "high_bar" && !amy.isSliding) {
                    gameOver();
                    return;
                }
            }
        }

        if (obs.y > canvas.height) {
            obstacles.splice(i, 1);
        }
    }

    // Gems
    for (let j = gems.length - 1; j >= 0; j--) {
        const gem = gems[j];
        gem.y += speed;

        const currentY = horizonY + gem.y;
        const currentX = canvas.width * lanePositions[gem.lane];

        // Draw Pink Diamond Gem
        ctx.fillStyle = "#db2777";
        ctx.beginPath();
        ctx.arc(currentX, currentY, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Collect Check
        if (gem.y > (canvas.height - horizonY - 100) && gem.y < (canvas.height - horizonY - 10)) {
            if (gem.lane === currentLane) {
                gemsCollected++;
                totalUnlockedGems++;
                gemsDisplay.textContent = gemsCollected;
                gems.splice(j, 1);
                continue;
            }
        }

        if (gem.y > canvas.height) {
            gems.splice(j, 1);
        }
    }
}

// MAIN GAME LOOP
function gameLoop() {
    if (!isRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Environments & City
    drawLagosSkyline();
    drawRoad();

    // Spawning & Physics Update
    frameCount++;
    scoreDistance += Math.floor(speed * 0.1);
    scoreDisplay.textContent = `${scoreDistance} m`;

    // Dynamic Speed Curve (Game gets harder and faster gradually)
    speed += speedMultiplier;

    spawnEntities();
    updateEntities();
    drawAmy();

    requestAnimationFrame(gameLoop);
}

// GAME CONTROL FUNCTIONS
function startGame() {
    isRunning = true;
    scoreDistance = 0;
    gemsCollected = 0;
    speed = 6.0;
    currentLane = 1;
    obstacles = [];
    gems = [];
    frameCount = 0;

    gemsDisplay.textContent = "0";
    scoreDisplay.textContent = "0 m";

    menuOverlay.classList.add("hidden");
    gameoverOverlay.classList.add("hidden");

    requestAnimationFrame(gameLoop);
}

function gameOver() {
    isRunning = false;
    finalScore.textContent = `${scoreDistance} m`;
    finalGems.textContent = `${gemsCollected} 💎`;
    gameoverOverlay.classList.remove("hidden");
}

// CLOSET SELECTION
document.querySelectorAll(".outfit-card").forEach(card => {
    card.addEventListener("click", () => {
        const outfitId = parseInt(card.dataset.outfit);
        const cost = parseInt(card.dataset.cost);

        if (unlockedOutfits.includes(outfitId)) {
            equippedOutfit = outfitId;
            updateClosetUI();
        } else if (totalUnlockedGems >= cost) {
            totalUnlockedGems -= cost;
            unlockedOutfits.push(outfitId);
            equippedOutfit = outfitId;
            updateClosetUI();
        } else {
            alert(`You need ${cost} gems to unlock this outfit!`);
        }
    });
});

function updateClosetUI() {
    document.querySelectorAll(".outfit-card").forEach(card => {
        const outfitId = parseInt(card.dataset.outfit);
        if (outfitId === equippedOutfit) {
            card.classList.add("selected");
            card.querySelector(".status-tag").textContent = "Equipped";
        } else if (unlockedOutfits.includes(outfitId)) {
            card.classList.remove("selected");
            card.querySelector(".status-tag").textContent = "Owned";
        }
    });

    previewAvatar.className = `avatar-outfit-${equippedOutfit}`;
    const outfitNames = { 1: "Lagos Chic", 2: "Ankara Glam", 3: "Y2K Pink" };
    currentOutfitName.textContent = outfitNames[equippedOutfit];
}

// EVENT LISTENERS
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);
menuBtn.addEventListener("click", () => {
    gameoverOverlay.classList.add("hidden");
    menuOverlay.classList.remove("hidden");
});

closetBtn.addEventListener("click", () => {
    menuOverlay.classList.add("hidden");
    closetOverlay.classList.remove("hidden");
    updateClosetUI();
});

closeClosetBtn.addEventListener("click", () => {
    closetOverlay.classList.add("hidden");
    menuOverlay.classList.remove("hidden");
});
