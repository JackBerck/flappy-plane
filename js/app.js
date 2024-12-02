const canvas = document.getElementById("gameCanvas"); // Get the canvas element
const ctx = canvas.getContext("2d"); // Get the context of the canvas

let planeY = canvas.height / 2; // Initial position of the plane
let gravity = 0.4; // Gravity value
let lift = -8; // Lift value
let velocity = 0; // Initial velocity
let score = 0; // Initial score
let angle = 0; // Initial angle
let isGameStarted = false; // Game started flag
let initialOffset = 0; // Initial offset for the plane
let initialDirection = 1; // Initial direction for the plane
const roadSpeed = 2; // Speed of the road
let roadX = 0; // Initial position of the road

// Load the plane image
const planeObj = new Image();
planeObj.src = "/assets/img/icons/boeing-767.png";

// Load the road image
const roadObj = new Image();
roadObj.src = "/assets/img/backgrounds/roadway.jpg";

// Load the tower image
const towerObj = new Image();
towerObj.src = "/assets/img/icons/tower.png";
towerObj.onload = () => {
  towerWidth = towerObj.width; // Update width setelah image load
  initialAnimation();
};

// Load sound effects
const gameOverSound = new Audio("/assets/sounds/explosion.mp3");
gameOverSound.load(); // Pre-load audio
let isSoundLoaded = false;

gameOverSound.addEventListener('canplaythrough', () => {
    isSoundLoaded = true;
}, false);

gameOverSound.addEventListener('error', (e) => {
    console.error('Error loading sound:', e);
});

// Load explosion image
const explosionObj = new Image();
explosionObj.src = "/assets/img/effects/explosion.gif";

// Tambah variabel posisi ledakan
let explosionX = 0;
let explosionY = 0;

// Tower settings
let towerWidth = 50; // Set default width jika image belum load
const towerGap = 150; // Gap between upper and lower towers
const towerSpeed = 3; // Speed of the towers
const towers = []; // Array to store towers
let towerSpawnInterval = 100; // Perlambat spawn rate tower

// Function to create a new pair of towers
function createTower() {
  // Pastikan dimensi valid
  if (towerWidth <= 0 || !towerObj.complete) return;

  const minHeight = 100; // Minimum height untuk tower
  const maxHeight = canvas.height - towerGap - 100; // Maximum height
  const randomHeight =
    Math.floor(Math.random() * (maxHeight - minHeight)) + minHeight;
  const upperTower = {
    x: canvas.width,
    y: 0,
    width: towerWidth,
    height: randomHeight,
  };
  const lowerTower = {
    x: canvas.width,
    y: randomHeight + towerGap,
    width: towerWidth,
    height: canvas.height - randomHeight - towerGap, // 64 for the road
  };
  towers.push(upperTower, lowerTower);
}

// Function to draw towers
function drawTowers() {
  towers.forEach((tower) => {
    // Menggambar outline persegi
    ctx.strokeRect(
      tower.x,      // x koordinat tower
      tower.y,      // y koordinat tower
      tower.width,  // lebar tower
      tower.height  // tinggi tower
    );

    ctx.save(); // Save the current state of the context
    if (tower.y === 0) {
      // Check if it's the upper tower
      ctx.translate(tower.x + tower.width / 2, tower.height / 2); // Translate to the center of the tower
      ctx.rotate(Math.PI); // Rotate 180 degrees
      ctx.drawImage(
        towerObj,           // gambar tower
        -tower.width / 2,   // x tujuan (digeser setengah lebar ke kiri)
        -tower.height / 2,  // y tujuan (digeser setengah tinggi ke atas)
        tower.width,        // lebar gambar
        tower.height        // tinggi gambar
      );
    } else {
      ctx.drawImage(towerObj, tower.x, tower.y, tower.width, tower.height);
    }
    ctx.restore(); // Restore the context to the previous state
  });
}

// Function to update towers
function updateTowers() {
  for (let i = towers.length - 1; i >= 0; i--) {
    const tower = towers[i];
    tower.x -= towerSpeed;

    // Improved collision detection
    const planeWidth = planeObj.width * 0.1;
    const planeHeight = planeObj.height * 0.1;
    const planeX = 144;

    // Tambah margin collision untuk lebih akurat
    const collisionMargin = 10;
    if (
      planeX < tower.x + tower.width - collisionMargin && // Pesawat di kiri tower
      planeX + planeWidth > tower.x + collisionMargin && // Pesawat di kanan tower
      planeY < tower.y + tower.height - collisionMargin && // Pesawat di atas tower
      planeY + planeHeight > tower.y + collisionMargin // Pesawat di bawah tower
    ) {
      explosionX = planeX - planeWidth/2; // Set posisi ledakan
      explosionY = planeY - planeHeight/2;
      isGameStarted = false;
      drawGameOver();
      return;
    }

    // Remove towers that move off-screen
    if (tower.x + tower.width < 0) {
      towers.splice(i, 1);
    }
  }

  // Check if a tower was passed to increase the score
  towers.forEach((tower, index) => {
    if (!tower.passed && tower.x + tower.width < 144) {
      score += 0.5; // Increment score for each tower pair
      tower.passed = true; // Mark tower as passed
    }
  });

  // Validasi sebelum spawn tower baru
  if (frameCount % towerSpawnInterval === 0 && towerObj.complete) {
    createTower();
  }
}

// Frame count for the game loop
let frameCount = 0;

// Draw the road on the canvas
function drawRoad() {
  // ctx.drawImage(roadObj, 0, 580, canvas.width, 100);
  const roadWidth = roadObj.width;
  const roadHeight = 100;

  function drawMovingRoad() {
    ctx.clearRect(0, 580, canvas.width, roadHeight); // Clear the road area
    roadX -= roadSpeed; // Move the road to the left
    if (roadX <= -roadWidth) {
      roadX = 0; // Reset the road position
    }
    ctx.drawImage(roadObj, roadX, 580, roadWidth, roadHeight); // Draw the first road image
    ctx.drawImage(roadObj, roadX + roadWidth, 580, roadWidth, roadHeight); // Draw the second road image
  }

  if (isGameStarted) {
    requestAnimationFrame(drawMovingRoad); // Call the drawMovingRoad function again
  }

  drawMovingRoad();
}

// Draw the plane on the canvas
function drawPlane() {
  const planeWidth = planeObj.width * 0.1;
  const planeHeight = planeObj.height * 0.1;

  ctx.strokeStyle = "red";
  ctx.strokeRect(144, planeY, planeWidth, planeHeight);

  ctx.save(); // Save the current state of the context
  ctx.translate(144, planeY + planeHeight / 2); // Translate the context to the center of the plane
  ctx.rotate(angle); // Rotate the context based on the angle
  ctx.drawImage(
    planeObj,          // gambar pesawat
    0,   // x tujuan (digeser setengah lebar ke kiri)
    -planeHeight / 2,  // y tujuan (digeser setengah tinggi ke atas)
    planeWidth,        // lebar gambar
    planeHeight        // tinggi gambar
  );
  ctx.restore(); // Restore the context to the previous state
}

// Initial animation for the plane
function initialAnimation() {
  const planeWidth = planeObj.width * 0.1;
  const planeHeight = planeObj.height * 0.1;
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
  initialOffset += initialDirection * 0.5; // Update the initial offset
  // Change the direction if the offset is greater than 10 or less than -10
  if (initialOffset > 10 || initialOffset < -10) {
    initialDirection *= -1;
  }
  // angle = initialOffset / 20; // Adjust angle based on initial offset *if needed
  ctx.save(); // Save the current state of the context
  ctx.translate(144, canvas.height / 2 + initialOffset); // Translate the context to the center of the plane
  ctx.rotate(angle); // Rotate the context based on the angle
  ctx.drawImage(
    planeObj,
    0,
    -planeHeight / 2,
    planeWidth,
    planeHeight
  );
  ctx.restore(); // Restore the context to the previous state
  drawRoad(); // Draw the road on the canvas
  // Call the initialAnimation function again to create a loop effect if the game is not started
  if (!isGameStarted) {
    requestAnimationFrame(initialAnimation);
  }
}

// Display score
function displayScore() {
  ctx.fillStyle = "white";
  ctx.font = "24px serif";
  ctx.fillText("Score: " + Math.floor(score), 10, 30);
}

// Update drawGameOver to include final score
function drawGameOver() {
  if (isSoundLoaded) {
    try {
        gameOverSound.currentTime = 0; // Reset audio ke awal
        gameOverSound.play()
        .catch(e => console.error('Error playing sound:', e));
    } catch (e) {
        console.error('Error playing sound:', e);
    }
  }
  
  // Draw explosion
  ctx.drawImage(
    explosionObj,
    explosionX,
    explosionY,
    planeObj.width * 0.2,  // Ukuran ledakan 2x ukuran pesawat
    planeObj.height * 0.2
  );
  
  // Delay text game over
  setTimeout(() => {
    ctx.fillStyle = "white";
    ctx.font = "48px serif";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 50);
    ctx.font = "24px serif";
    ctx.fillText(
      "Score: " + Math.floor(score),
      canvas.width / 2,
      canvas.height / 2
    );
    ctx.fillText("Click to restart", canvas.width / 2, canvas.height / 2 + 50);
  }, 1000); // Delay 1 detik
}

// Update the game state
function update() {
  if (!isGameStarted) return; // Return if the game is not started

  const planeWidth = planeObj.width * 0.1;
  const planeHeight = planeObj.height * 0.1;
  velocity += gravity; // Update the velocity based on gravity
  planeY += velocity; // Update the position of the plane based on the velocity

  angle = Math.min(Math.max(velocity / 20, -Math.PI / 10), Math.PI / 10); // Update the angle based on the velocity

  // Check if the plane hits the top of the canvas and stop the plane if it does
  if (planeY + planeHeight >= canvas.height - 64) {
    explosionX = 144 - planeWidth/2; // Set posisi ledakan
    explosionY = planeY - planeHeight/2;
    isGameStarted = false;
    const gameOverSound = new Audio("/assets/sounds/explosion.mp3");
    gameOverSound.play();
    drawGameOver();
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
  drawTowers(); // Draw the towers on the canvas
  drawRoad(); // Draw the road on the canvas
  drawPlane(); // Draw the plane on  the canvas
  requestAnimationFrame(update); // Call the update function again

  frameCount++; // Increment the frame count
  updateTowers(); // Update the towers
}

// Add event listener for keydown event
document.addEventListener("keydown", () => {
  if (!isGameStarted) {
    isGameStarted = true;
    update();
  }
  velocity += lift;
});

// Add event listener for touchstart event
document.addEventListener("touchstart", () => {
  if (!isGameStarted) {
    isGameStarted = true;
    update();
  }
  velocity += lift;
});

// Add event listener for click event to restart the game
canvas.addEventListener("click", () => {
  if (!isGameStarted) {
    document.location.reload();
  }
});

// Remove the initial call to initialAnimation
// initialAnimation(); // Call the initialAnimation function to start the game
