// ================================================================ Consts

const TETROMINOES = [
  [[0,0], [1,0], [2,0], [3,0]], // i
  [[0,0], [1,0], [0,1], [1,1]], // o
  [[1,0], [0,1], [1,1], [2,1]], // t
  [[0,0], [0,1], [1,1], [2,1]], // j
  [[2,0], [0,1], [1,1], [2,1]], // l
  [[1,0], [2,0], [0,1], [1,1]], // s
  [[0,0], [1,0], [1,1], [2,1]], // z
];

// Purple, Red, Blue, Yellow, Teal, Orange, Cyan
const COLORS = ['#9C27B0', '#F44336', '#2196F3', '#FFEB3B', '#009688', '#FF9800', '#00BCD4'];

const DIRECTION = {
  IDLE: 0,
  DOWN: 1,
  LEFT: 2,
  RIGHT: 3,
};

const STATE = {
  PLAYING: 0,
  OVER: 1,
};

// ================================================================ Variables

let canvas;
let context;
let currentTetrominoColor;
let currentTetromino;
let direction;
let scoreText;
let audio = new Audio('./audio/tetris.mp3');
let speed = 1000;
let score = 0;
let level = 1;
let gameState = STATE.PLAYING;
let gameBoardArrayHeight = 20;
let gameBoardArrayWidth = 11;
let startX = 4;
let startY = 0;
let coordinateArray = [...Array(gameBoardArrayHeight)].map((e) => Array(gameBoardArrayWidth).fill(0));
let gameBoardArray = [...Array(gameBoardArrayHeight)].map((e) => Array(gameBoardArrayWidth).fill(0));
let stoppedShapeArray = [...Array(gameBoardArrayHeight)].map((e) => Array(gameBoardArrayWidth).fill(0));

// ================================================================ Classes

class Coordinates {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

// ================================================================ Methods

const createTetromino = () => {
  const randomTetromino = Math.floor(Math.random() * TETROMINOES.length);
  currentTetromino = TETROMINOES[randomTetromino];
  currentTetrominoColor = COLORS[randomTetromino];
};

const hitTheWall = () => {
  for(let i = 0; i < currentTetromino.length; i++) {
    const newX = currentTetromino[i][0] + startX;
    if (newX <= 0 && direction === DIRECTION.LEFT) return true;
    if (newX >= 11 && direction === DIRECTION.RIGHT) return true;
  }

  return false;
}

const checkForVerticalCollision = () => {
  let tetrominoCopy = currentTetromino;
  let collision = false;

  for (let i = 0; i < tetrominoCopy.length; i++) {
    let square = tetrominoCopy[i];
    let x = square[0] + startX;
    let y = square[1] + startY;

    if(direction === DIRECTION.DOWN) y++;

    if (typeof stoppedShapeArray[x][y+1] === 'string') {
      deleteTetromino();
      startY++;
      drawTetromino();
      collision = true;
      break;
    }

    if (y >= 20) {
      collision = true;
      break;
    }
  }

  if (collision) {
    if (startY <= 1) {
      gameState = STATE.OVER;
    } else {
      for (let i = 0; i < tetrominoCopy.length; i++) {
        let square = tetrominoCopy[i];
        let x = square[0] + startX;
        let y = square[1] + startY;
        stoppedShapeArray[x][y] = currentTetrominoColor;
      }

      checkForCompletedRows();
      createTetromino();
      direction = DIRECTION.IDLE;
      startX = 4;
      startY = 0
      drawTetromino();
    }
  }

  return collision;
};

const checkForHorizontalCollision = () => {
  let tetrominoCopy = currentTetromino;
  let collision = false;

  for (let i = 0; i < tetrominoCopy.length; i++) {
    let square = tetrominoCopy[i];
    let x = square[0] + startX;
    let y = square[1] + startY;

    if (direction === DIRECTION.LEFT) x--;
    if (direction === DIRECTION.RIGHT) x++;

    let stoppedShapeValue = stoppedShapeArray[x][y];

    if (typeof stoppedShapeValue === 'string') {
      collision = true;
      break;
    }
  }

  return collision;
};

const checkForCompletedRows = () => {
  let rowsToDelete = 0;
  let startOfDeletion = 0;

  for (let y = 0; y < gameBoardArrayHeight; y++) {
    let completed = true;

    for (let x = 0; x < gameBoardArrayWidth + 1; x++) {
      let square = stoppedShapeArray[x][y];

      if (square === 0 || typeof square === 'undefined') {
        completed = false;
        break;
      }
    }

    if (completed) {
      if (startOfDeletion === 0) startOfDeletion = y;
      rowsToDelete++;

      for (let i = 0; i < gameBoardArrayWidth; i++) {
        stoppedShapeArray[i][y] = 0;
        gameBoardArray[i][y] = 0;

        let coordinateX = coordinateArray[i][y].x;
        let coordinateY = coordinateArray[i][y].y;

        context.fillStyle = 'white';
        context.fillRect(coordinateX, coordinateY, 20, 20);
      }
    }
  }

  if (rowsToDelete > 0) {
    score += 10 * rowsToDelete;
    scoreText.innerHTML = score;
    moveAllRowsDown(rowsToDelete, startOfDeletion);
  }
};

const moveAllRowsDown = (rowsToDelete, startOfDeletion) => {
  for(let i = startOfDeletion - 1; i >= 0; i--) {
    for (let x = 0; x < gameBoardArrayWidth; x++) {
      let y2 = i + rowsToDelete;
      let square = stoppedShapeArray[x][i];
      let nextSquare = stoppedShapeArray[x][y2];

      if (typeof square === 'string') {
        nextSquare = square;
        gameBoardArray[x][y2] = 1;
        stoppedShapeArray[x][y2] = square;

        let coordinateX = coordinateArray[x][y2].x;
        let coordinateY = coordinateArray[x][y2].y;
        context.fillStyle = nextSquare;
        context.fillRect(coordinateX, coordinateY, 20, 20);

        square = 0;
        gameBoardArray[x][i] = 0;
        stoppedShapeArray[x][i] = 0;

        coordinateX = coordinateArray[x][i].x;
        coordinateY = coordinateArray[x][i].y;
        context.fillStyle = 'white';
        context.fillRect(coordinateX, coordinateY, 20, 20);
      }
    }
  }
};

const rotateTetromino = () => {
  let newRotation = new Array();
  let tetrominoCopy = currentTetromino;
  let currentTetrominoBackup;

  for (let i = 0; i < tetrominoCopy.length; i++) {
    currentTetrominoBackup = [...currentTetromino];
    let x = tetrominoCopy[i][0];
    let y = tetrominoCopy[i][1];
    let newX = getLastSquareX() - y;
    let newY = x;
    newRotation.push([newX, newY]);
  }

  deleteTetromino();

  try {
    currentTetromino = newRotation;
    drawTetromino();
  } catch (e) {
    if (e instanceof TypeError) {
      currentTetromino = currentTetrominoBackup;
      deleteTetromino();
      drawTetromino();
    }
  }
};

const getLastSquareX = () => {
  let lastX = 0;

  for (let i = 0; i < currentTetromino.length; i++) {
    let square = currentTetromino[i];
    if (square[0] > lastX) lastX = square[0];
  }

  return lastX;
};

const createCoordinatesArray = () => {
  let i = 0;
  let j = 0;

  for (let y = 0; y <= 441; y += 21) {
    for (let x = 0; x <= 252; x += 21) {
      coordinateArray[i][j] = new Coordinates(x, y);
      i++;
    }
    j++;
    i = 0;
  }
};

const drawTetromino = () => {
  for (let i = 0; i < currentTetromino.length; i++) {
    let x = currentTetromino[i][0] + startX;
    let y = currentTetromino[i][1] + startY;
    gameBoardArray[x][y] = 1;

    let coordinateX = coordinateArray[x][y].x;
    let coordinateY = coordinateArray[x][y].y;

    context.fillStyle = currentTetrominoColor;
    context.fillRect(coordinateX, coordinateY, 20, 20);
  }
};

const deleteTetromino = () => {
  for (let i = 0; i <= currentTetromino.length - 1; i++) {
    let x = currentTetromino[i][0] + startX;
    let y = currentTetromino[i][1] + startY;
    gameBoardArray[x][y] = 0;

    let coordinateX = coordinateArray[x][y].x;
    let coordinateY = coordinateArray[x][y].y;

    context.fillStyle = 'white';
    context.fillRect(coordinateX, coordinateY, 20, 20);
  }
};

const handleKeyPress = (key) => {
  if (gameState === STATE.OVER) return;

  if (key.keyCode === 65) {
    direction = DIRECTION.LEFT;

    if(hitTheWall() || checkForHorizontalCollision()) return;

    deleteTetromino();
    startX--;
    drawTetromino();
  }

  if (key.keyCode === 68) {
    direction = DIRECTION.RIGHT;

    if(hitTheWall() || checkForHorizontalCollision()) return;

    deleteTetromino();
    startX++;
    drawTetromino();
  }

  if (key.keyCode === 83) {
    moveDownTetromino();
  }

  if (key.keyCode === 87) {
    rotateTetromino();
  }
};

const moveDownTetromino = () => {
  direction = DIRECTION.DOWN;

  if(checkForVerticalCollision()) return;

  deleteTetromino();
  startY++;
  drawTetromino();
};

const createTetrominoes = () => {
  tetrominos
};

const setupCanvas = () => {
  context = canvas.getContext('2d');
  canvas.width = 504;
  canvas.height = 840;

  context.scale(2, 2);

  context.fillStyle = 'white';
  context.fillRect(0, 0, canvas.width, canvas.height);

  document.addEventListener('keydown', handleKeyPress);

  createTetromino();
  createCoordinatesArray();
  drawTetromino();
};

const playAudio = () => {
  audio.addEventListener('ended', function() {
    this.currentTime = 0;
    this.play();
  }, false);

  audio.play();
};

// ================================================================ Execution

document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('start-game-button');
  const form = document.getElementById('config-form');
  const guide = document.getElementById('guide');
  const scoreboard = document.getElementById('score');
  scoreText = document.getElementById('score-text');

  canvas = document.getElementById('game-canvas');

  startButton.addEventListener('click', () => {
    const difficulty = document.getElementById('difficulty').value;
    if (difficulty === '9') audio = new Audio('./audio/rosalia.mp3');

    speed = speed / Number(difficulty);

    canvas.classList.remove('hidden');
    scoreboard.classList.remove('hidden');
    guide.classList.add('hidden');
    form.classList.add('hidden');

    playAudio();
    setupCanvas();

    window.setInterval(() => {
      if (gameState !== STATE.OVER) {
        moveDownTetromino();
      }
    }, speed);
  });
});
