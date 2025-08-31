// Global variables
let towers = { A: [], B: [], C: [] };
let moves = [];
let currentMoveIndex = 0;
let animationSpeed = 1000;
let isAnimating = false;
let isPaused = false;
let animationTimeout = null;

// DOM elements
let diskCountInput;
let startBtn;
let resetBtn;
let pauseBtn;
let speedSlider;
let speedValue;
let currentMoveSpan;
let minMovesSpan;
let moveList;
let towerElements = {};

// Initialize elements
function initializeElements() {
  diskCountInput = document.getElementById("diskCount");
  startBtn = document.getElementById("startBtn");
  resetBtn = document.getElementById("resetBtn");
  pauseBtn = document.getElementById("pauseBtn");
  speedSlider = document.getElementById("speedSlider");
  speedValue = document.getElementById("speedValue");
  currentMoveSpan = document.getElementById("currentMove");
  minMovesSpan = document.getElementById("minMoves");
  moveList = document.getElementById("moveList");

  towerElements.A = document.getElementById("tower-A");
  towerElements.B = document.getElementById("tower-B");
  towerElements.C = document.getElementById("tower-C");
}

// Setup event listeners
function setupEventListeners() {
  startBtn.addEventListener("click", startSolving);
  resetBtn.addEventListener("click", reset);
  pauseBtn.addEventListener("click", togglePause);

  speedSlider.addEventListener("input", function (e) {
    const speed = parseInt(e.target.value);
    speedValue.textContent = speed;
    animationSpeed = 2000 - speed * 180;
  });

  diskCountInput.addEventListener("change", reset);
}

// Reset the game
function reset() {
  // Clear any running animations
  if (animationTimeout) {
    clearTimeout(animationTimeout);
  }

  // Reset state
  towers = { A: [], B: [], C: [] };
  moves = [];
  currentMoveIndex = 0;
  isAnimating = false;
  isPaused = false;

  // Reset UI elements
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  pauseBtn.textContent = "Pause";

  // Clear existing disks
  document.querySelectorAll(".disk").forEach(function (disk) {
    disk.remove();
  });

  // Create new disks
  const diskCount = parseInt(diskCountInput.value);
  createDisks(diskCount);

  // Update stats
  updateStats();
  clearMoveLog();

  // Calculate min moves
  const minMoves = Math.pow(2, diskCount) - 1;
  minMovesSpan.textContent = minMoves;
}

// Create disks
function createDisks(count) {
  const towerA = towerElements.A.querySelector(".rod");

  // Create disks from largest to smallest
  for (let i = count; i >= 1; i--) {
    const disk = document.createElement("div");
    disk.className = "disk disk-" + i;
    disk.textContent = i;
    disk.style.bottom = 20 + (count - i) * 27 + "px";
    disk.style.left = "50%";
    disk.style.transform = "translateX(-50%)";

    towerA.appendChild(disk);
    towers.A.push(i);
  }
}

// Recursive Tower of Hanoi algorithm
function solveTowerOfHanoi(n, source, destination, middle) {
  if (n === 1) {
    // Base case: move single disk
    moves.push({
      disk: 1,
      from: source,
      to: destination,
      description: "Move top disk from " + source + " to " + destination,
    });
  } else {
    // Recursive case:
    // 1. Move n-1 disks from source to middle
    solveTowerOfHanoi(n - 1, source, middle, destination);

    // 2. Move the largest disk from source to destination
    moves.push({
      disk: n,
      from: source,
      to: destination,
      description: "Move top disk from " + source + " to " + destination,
    });

    // 3. Move n-1 disks from middle to destination
    solveTowerOfHanoi(n - 1, middle, destination, source);
  }
}

// Start solving
function startSolving() {
  const diskCount = parseInt(diskCountInput.value);

  // Generate solution moves using recursive algorithm
  moves = [];
  solveTowerOfHanoi(diskCount, "A", "C", "B");

  // Update UI
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  isAnimating = true;
  currentMoveIndex = 0;

  // Display move sequence
  displayMoveSequence();

  // Start animation
  animateNextMove();
}

// Display move sequence
function displayMoveSequence() {
  moveList.innerHTML = "";
  moves.forEach(function (move, index) {
    const moveItem = document.createElement("div");
    moveItem.className = "move-item";
    moveItem.id = "move-" + index;
    moveItem.textContent = index + 1 + ". " + move.description;
    moveList.appendChild(moveItem);
  });
}

// Animate next move
function animateNextMove() {
  if (isPaused || currentMoveIndex >= moves.length) {
    if (currentMoveIndex >= moves.length) {
      completeSolution();
    }
    return;
  }

  const move = moves[currentMoveIndex];

  // Highlight current move in log
  document.querySelectorAll(".move-item").forEach(function (item) {
    item.classList.remove("current");
  });
  document.getElementById("move-" + currentMoveIndex).classList.add("current");

  // Perform the move
  moveDisk(move.from, move.to, function () {
    currentMoveIndex++;
    updateStats();

    // Schedule next move
    animationTimeout = setTimeout(animateNextMove, animationSpeed);
  });
}

// Move disk with callback instead of async/await
function moveDisk(fromTower, toTower, callback) {
  // Get the disk to move (top disk from source tower)
  const diskSize = towers[fromTower].pop();
  towers[toTower].push(diskSize);

  // Find the disk element
  const diskElement = document.querySelector(".disk-" + diskSize);

  // Calculate positions
  const fromElement = towerElements[fromTower].querySelector(".rod");
  const toElement = towerElements[toTower].querySelector(".rod");

  const fromRect = fromElement.getBoundingClientRect();
  const toRect = toElement.getBoundingClientRect();

  // Calculate new position
  const deltaX = toRect.left - fromRect.left;
  const newBottom = 20 + (towers[toTower].length - 1) * 27;

  // Add moving class for higher z-index
  diskElement.classList.add("moving");

  // Animate the move using nested timeouts
  // Move up
  diskElement.style.transform = "translateX(-50%) translateY(-80px)";

  setTimeout(function () {
    // Move horizontally
    diskElement.style.left = "calc(50% + " + deltaX + "px)";

    setTimeout(function () {
      // Move down
      diskElement.style.transform = "translateX(-50%) translateY(0)";
      diskElement.style.bottom = newBottom + "px";

      setTimeout(function () {
        // Remove moving class and finalize position
        diskElement.classList.remove("moving");
        diskElement.style.left = "50%";

        // Move to new parent
        toElement.appendChild(diskElement);

        // Call the callback to continue animation
        if (callback) callback();
      }, 300);
    }, 200);
  }, 300);
}

// Toggle pause
function togglePause() {
  isPaused = !isPaused;

  if (isPaused) {
    pauseBtn.textContent = "Resume";
    if (animationTimeout) {
      clearTimeout(animationTimeout);
    }
  } else {
    pauseBtn.textContent = "Pause";
    animateNextMove();
  }
}

// Complete solution
function completeSolution() {
  isAnimating = false;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  pauseBtn.textContent = "Pause";

  // Show completion message
  alert(
    "🎉 Puzzle solved in " + moves.length + " moves!\nmin solution achieved!"
  );
}

// Update stats
function updateStats() {
  currentMoveSpan.textContent = currentMoveIndex;
}

// Clear move log
function clearMoveLog() {
  moveList.innerHTML = "<p>Start solving to see move sequence</p>";
}

// Initialize the game when the page loads
document.addEventListener("DOMContentLoaded", function () {
  initializeElements();
  setupEventListeners();
  reset();
});
