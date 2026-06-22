// --- Engine Configuration ---
const FONT_SIZE = 16;
const FONT_FAMILY = "monospace";
const CHAR_WIDTH = FONT_SIZE * 0.6; // Approximated width ratio for most monospace fonts
const CHAR_HEIGHT = FONT_SIZE;

// --- Engine State ---
let cols = 0;
let rows = 0;
let cameraX = 0;
let cameraY = 0;

// Input tracking
let isDragging = false;
let startX = 0;
let startY = 0;
let accumX = 0;
let accumY = 0;

// Setup Canvas Context
const canvas = document.getElementById("field") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

// --- Pillar 1: Responsiveness ---
function resizeGrid() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  // Derive maximum character cells that fit the physical screen boundaries
  cols = Math.floor(window.innerWidth / CHAR_WIDTH);
  rows = Math.floor(window.innerHeight / CHAR_HEIGHT);
}

// --- Pillar 2 & 3: Z-Layer Compositor ---
function renderFrame() {
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
  ctx.textBaseline = "top";

  // Loop through every single cell sequentially across the screen array
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let charToRender = " ";
      let charColor = "#333";

      // Translate local screen cell space into infinite world cell space
      const worldX = cameraX + x;
      const worldY = cameraY + y;

      // --- Layer 2: UI (Responsive Screen Space Anchors) ---
      // Top UI Bar
      if (y === 0) {
        charColor = "#00ff00";
        if (x === 2) charToRender = "[";
        else if (x > 2 && x < 8) charToRender = "MENU"[x - 3];
        else if (x === 8) charToRender = "]";
        else charToRender = "─";
      }
      // Bottom Debug HUD (Anchored dynamically relative to max rows)
      else if (y === rows - 1) {
        charColor = "#555";
        const debugString = ` CAM:(${cameraX},${cameraY}) CELLS:${cols}x${rows} `;
        if (x >= 0 && x < debugString.length) {
          charToRender = debugString[x];
          charColor = "#00ffff";
        } else {
          charToRender = "─";
        }
      }

      // --- Layer 1: World Entities (Dynamic World Space) ---
      else if (worldX === 5 && worldY === 5) {
        charToRender = "@"; // Player object static at world pos (5, 5)
        charColor = "#ff00ff";
      } else if (worldX === 12 && worldY === 8) {
        charToRender = "#"; // A terminal terminal block
        charColor = "#ffffff";
      }

      // --- Layer 0: Procedural Background (Infinite Deterministic Hash) ---
      else {
        // Simple deterministic pseudo-random distribution for grass/dots
        const hash =
          Math.abs(Math.sin(worldX * 12.9898 + worldY * 78.233)) * 43758.5453;
        const noise = hash - Math.floor(hash);
        if (noise > 0.97) {
          charToRender = ",";
          charColor = "#224422";
        } else if (noise > 0.94) {
          charToRender = ".";
          charColor = "#113311";
        }
      }

      // Paint resolved topmost character token to the current screen coordinate location
      if (charToRender !== " ") {
        ctx.fillStyle = charColor;
        ctx.fillText(charToRender, x * CHAR_WIDTH, y * CHAR_HEIGHT);
      }
    }
  }

  requestAnimationFrame(renderFrame);
}

// --- Pillar 4: Unified Input Resolvers ---
function handlePointerDown(e: MouseEvent | TouchEvent) {
  const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
  const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

  const cellX = Math.floor(clientX / CHAR_WIDTH);
  const cellY = Math.floor(clientY / CHAR_HEIGHT);

  // Intercept UI click checks before treating interaction as a camera drag map move
  if (cellY === 0 && cellX >= 2 && cellX <= 8) {
    alert("System Interface Accessed.");
    return; // Consume action completely
  }

  isDragging = true;
  startX = clientX;
  startY = clientY;
  accumX = 0;
  accumY = 0;
}

function handlePointerMove(e: MouseEvent | TouchEvent) {
  if (!isDragging) return;
  e.preventDefault();

  const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
  const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

  // Track raw accumulative pixel distance delta
  accumX += clientX - startX;
  accumY += clientY - startY;

  startX = clientX;
  startY = clientY;

  // Shift camera states across world coordinates only when delta clears character dimensions
  if (Math.abs(accumX) >= CHAR_WIDTH) {
    cameraX -= Math.sign(accumX);
    accumX -= Math.sign(accumX) * CHAR_WIDTH;
  }
  if (Math.abs(accumY) >= CHAR_HEIGHT) {
    cameraY -= Math.sign(accumY);
    accumY -= Math.sign(accumY) * CHAR_HEIGHT;
  }
}

function handlePointerUp() {
  isDragging = false;
}

// Bind Global Listeners
window.addEventListener("resize", resizeGrid);
canvas.addEventListener("mousedown", handlePointerDown);
window.addEventListener("mousemove", handlePointerMove);
window.addEventListener("mouseup", handlePointerUp);

// Mobile Touch Mappings
canvas.addEventListener("touchstart", handlePointerDown, { passive: false });
window.addEventListener("touchmove", handlePointerMove, { passive: false });
window.addEventListener("touchend", handlePointerUp);

// Fire Engine Core Loops
resizeGrid();
requestAnimationFrame(renderFrame);
