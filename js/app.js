const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let planeY = canvas.height / 2;
let gravity = 0.4;
let lift = -8;
let velocity = 0;
let score = 0;
let angle = 0;
let isGameStarted = false;
let initialOffset = 0;
let initialDirection = 1;

const planeObj = new Image();
planeObj.src = "/assets/img/icons/boeing-767.png";

function drawPlane() {
  const planeWidth = planeObj.width * 0.1;
  const planeHeight = planeObj.height * 0.1;
  ctx.save();
  ctx.translate(144, planeY + planeHeight / 2);
  ctx.rotate(angle);
  ctx.drawImage(
    planeObj,
    -planeWidth / 2,
    -planeHeight / 2,
    planeWidth,
    planeHeight
  );
  ctx.restore();
}

function initialAnimation() {
  const planeWidth = planeObj.width * 0.1;
  const planeHeight = planeObj.height * 0.1;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  initialOffset += initialDirection * 0.5;
  if (initialOffset > 10 || initialOffset < -10) {
    initialDirection *= -1;
  }
  // angle = initialOffset / 20; // Adjust angle based on initial offset
  ctx.save();
  ctx.translate(144, canvas.height / 2 + initialOffset);
  ctx.rotate(angle);
  ctx.drawImage(
    planeObj,
    -planeWidth / 2,
    -planeHeight / 2,
    planeWidth,
    planeHeight
  );
  ctx.restore();
  if (!isGameStarted) {
    requestAnimationFrame(initialAnimation);
  }
}

function update() {
  if (!isGameStarted) return;

  const planeWidth = planeObj.width * 0.1;
  const planeHeight = planeObj.height * 0.1;
  velocity += gravity;
  planeY += velocity;

  // Adjust the angle based on the velocity
  angle = Math.min(Math.max(velocity / 20, -Math.PI / 10), Math.PI / 10);

  // Make sure the plane doesn't go off the screen
  if (planeY + planeHeight >= canvas.height) {
    planeY = canvas.height - planeHeight;
    velocity = 0;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPlane();
  requestAnimationFrame(update);
}

document.addEventListener("keydown", () => {
  if (!isGameStarted) {
    isGameStarted = true;
    update();
  }
  velocity += lift;
});

document.addEventListener("touchstart", () => {
  if (!isGameStarted) {
    isGameStarted = true;
    update();
  }
  velocity += lift;
});

initialAnimation();
