import "./style.css";
import sudokuBoards from "./sudokuBoards.json";

var possible_grid = Array(81).fill(999);

var currentBoard = [
  [0,2,0,0,0,6,9,0,0],
  [0,0,0,0,5,0,0,2,0],
  [6,0,0,3,0,0,0,0,0],
  [9,4,0,0,0,7,0,0,0],
  [0,0,0,4,0,0,7,0,0],
  [0,3,0,2,0,0,0,8,0],
  [0,0,9,0,4,0,0,0,0],
  [3,0,0,9,0,2,0,1,7],
  [0,0,8,0,0,0,0,0,2]
]

var recursivePos = Array(81).fill([]);
var recursiveStack = [];

var running = false;
var terminate = false;
var skipping = false;

function getBoardHtml(board) {
  drawRecursiveTrace();
  var body = "";
  body += "<table>";
  for (var i = 0; i < 9; i++) {
    body += "<tr>";
    for (var j = 0; j < 9; j++) {
      var number =
        board[i][j] == 0
          ? "<span></span>"
          : `<span class="digit">${board[i][j]}`;
      var classes = [];
      if (Math.floor(i / 3) % 2 == Math.floor(j / 3) % 2) {
        classes.push("darker");
      }
      if (currentBoard[i][j] != 0) {
        classes.push("originalPosition");
      }
      // var possibleCount = `<span class="possibleCount">${recursivePos[j * 9 + i].join(" ")}</span>`;
      // var candidates = getPossible(board, i, j)
      if(possible_grid[j*9 + i] == 0){
        classes.push("impossible");
      }
      // var candidatesHtml = `<span class="possibleCount">${candidates.join(" ")}</span>`;
      var candidatesHtml = `<span class="possibleCount">${possible_grid[j*9 + i]}</span>`;
      body += `<td class="${classes.join(" ")}">${number}${candidatesHtml}</td>`;
    }
    body += "</tr>";
  }
  body += "</table>";
  return body;
}

function getBoardEditHtml(board) {
  var body = "";
  body += "<table>";
  for (var i = 0; i < 9; i++) {
    body += "<tr>";
    for (var j = 0; j < 9; j++) {
      var number = board[i][j] == 0 ? "" : board[i][j];
      number = `<input type="number" value="${number}" onchange="setBoard(${i}, ${j}, this)">`;
      var classes = [];
      if (Math.floor(i / 3) % 2 == Math.floor(j / 3) % 2) {
        classes.push("darker");
      }
      body += `<td class="${classes.join(" ")}">${number}</td>`;
    }
    body += "</tr>";
  }
  body += "</table>";
  if (isSolved(board)) {
    body += "<h1>Solved!</h1>";
  }
  return body;
}

function _setBoard(board, x, y, value) {
  board[x][y] = value;
  return board;
}

function _getBoard(board, x, y) {
  return board[x][y];
}

function genRange(x, y){
  var gx = Math.floor(x / 3) * 3
  var gy = Math.floor(y / 3) * 3
  var result = [
    [x,0],[x,1],[x,2],[x,3],[x,4],[x,5],[x,6],[x,7],[x,8],
    [0,y],[1,y],[2,y],[3,y],[4,y],[5,y],[6,y],[7,y],[8,y],
    [gx,gy],[gx,gy+1],[gx,gy+2],[gx+1,gy],[gx+1,gy+1],
    [gx+1,gy+2],[gx+2,gy],[gx+2,gy+1],[gx+2,gy+2]
  ]
  return result
}

function isValid(board, x, y, num) {
  if (_getBoard(board, x, y) !== 0) return false;

  for (let i = 0; i < 9; i++) {
    if (_getBoard(board, x, i) == num) return false;
    if (_getBoard(board, i, y) == num) return false;
  }

  let boxX = Math.floor(x / 3) * 3;
  let boxY = Math.floor(y / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (_getBoard(board, boxX + i, boxY + j) == num) return false;
    }
  }
  return true;
}

function getPossible(board, x, y) {
  if (_getBoard(board, x, y) !== 0) return [];

  let possible = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  possible = possible.filter((e) => isValid(board, x, y, e));
  return possible;
}

function getMinRemainingPos() {
  var min_con = Math.min(...possible_grid.filter((e) => e != 0));
  var index = possible_grid.indexOf(min_con);
  return [index % 9, Math.floor(index / 9)];
}

function isSolved(board) {
  for (var y = 0; y < 9; y++) {
    for (var x = 0; x < 9; x++) {
      if (board[x][y] == 0) {
        return false;
      }
    }
  }
  return true;
}

var iterCount = 0;
async function updateDisplay(board){
  iterCount++;
  if (terminate || skipping) return
  if (slider.value != 0 || iterCount % 100 == 0) {
    await asyncSleep(slider.value);
    document.querySelector("#sudokuBoard").innerHTML = getBoardHtml(board);
  }
}

function updatePossibleGrid(board){
  for (var y = 0; y < 9; y++) {
    for (var x = 0; x < 9; x++) {
      if (_getBoard(board, x, y) == 0) {
        var numPossible = getPossible(board, x, y).length;
        possible_grid[y * 9 + x] = numPossible;
      }else{
        possible_grid[y * 9 + x] = 999;
      }
    }
  }
}

async function solve(board, depth = 0) {
  if (terminate) return
  await updateDisplay(board)

  if (depth == 0) {
    updatePossibleGrid(board)
    recursiveStack.splice(0, recursiveStack.length);
  }

  if (isSolved(board))
    return board;

  var [x, y] = getMinRemainingPos();
  var possible = getPossible(board, x, y);
  if (possible.length == 0) return;


  try{
    recursivePos[y * 9 + x] = possible;
    var drawPos = [x, y];
    recursiveStack.push(drawPos);

    for (var c of possible) {
      drawPos[0] = x + (Math.random() * 0.5 - 0.25);
      drawPos[1] = y + (Math.random() * 0.5 - 0.25);

      var temp_grid = [...possible_grid];
      possible_grid[y * 9 + x] = 999;
      _setBoard(board, x, y, c);

      var canContinue = true;
      for (const pos of genRange(x, y)) {
        var [xi, yi] = pos;
        if(_getBoard(board, xi, yi) == 0){
          var possibleCount = getPossible(board, xi, yi).length;
          possible_grid[yi * 9 + xi] = possibleCount;
          if(possibleCount == 0 && optmizedCheckbox.checked)
            canContinue = false;
        }
      }

      if (canContinue && await solve(board, depth + 1))
        return board;

      possible_grid.map((e, i) => temp_grid[i]);
    }
    _setBoard(board, x, y, 0);

  }finally{
    recursiveStack.pop();
    recursivePos[y * 9 + x] = [];
    await updateDisplay(board)
  }
}

function asyncSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clearBoard() {
  for (var y = 0; y < 9; y++) {
    for (var x = 0; x < 9; x++) {
      _setBoard(currentBoard, x, y, 0);
    }
  }
}

async function setBoard(x, y, input) {
  _setBoard(currentBoard, x, y, 0);
  var value = parseInt(input.value);
  if (
    "123456789".split("").includes(input.value) &&
    getPossible(currentBoard, x, y).includes(value)
  ) {
    _setBoard(currentBoard, x, y, value);
  } else {
    _setBoard(currentBoard, x, y, 0);
    input.value = "";
  }
}
window.setBoard = setBoard;

function newBoard() {
  clearBoard();
  var difficulty = "hard"
  var boardNumber = Math.floor(Math.random() * sudokuBoards[difficulty].length);
  currentBoard = [...sudokuBoards[difficulty][boardNumber]];
  currentBoard = currentBoard.map((e) => [...e]);
  document.querySelector("#sudokuBoard").innerHTML = getBoardHtml(currentBoard);
  return [difficulty, boardNumber];
}

function startSolver() {
  skipButton.disabled = false;
  running = true;
  skipping = false;
  var startTime = performance.now();
  var board = [...currentBoard].map((e) => [...e]);
  solve(board).then((result) => {
    var timeTaken = (performance.now() - startTime).toFixed(0);
    running = false;
    startButton.disabled = false;
    startSkipButton.disabled = false;
    skipButton.disabled = true;
    skipping = false;
    recursivePos = Array(81).fill([]);
    if (terminate) {
      terminate = false;
      return;
    }
    if (!result) {
      document.querySelector("#sudokuBoard").innerHTML =
        getBoardHtml(currentBoard);
      document.querySelector(
        "#sudokuBoard"
      ).innerHTML += `<h1>No Solution (${timeTaken}ms)</h1>`;
    } else {
      document.querySelector("#sudokuBoard").innerHTML = getBoardHtml(result);
      document.querySelector(
        "#sudokuBoard"
      ).innerHTML += `<h1>Solved (${timeTaken}ms)</h1>`;
    }
    console.log(currentBoard);
  });
}

var body = `
  <h1>Sudoku Solver (CSP)</h1>
  <center>
    <div id="boardName"><h3>.</h3></div>
    <div id="boardContainer">
      <div id="sudokuBoard"></div>
      <canvas id="sudokuBoardTrace" width = "500" height = "500"></canvas>
    </div>
    <h3>
      <span>Speed</span>
      <input type="range" min="0" max="1000" value="100" class="slider" id="speedSetting">
      <button id="skipButton" disabled=1>skip animation</button>
    </h3>
  </center>
  <button id="startButton">start</button>
  <button id="startSkipButton">start (skip animation)</button>
  <button id="resetButton">reset</button>
  <button id="editButton">edit</button>
  <button id="clearButton">clear</button>
  <button id="newButton">new</button>
  <br>
  <br>
  <input type="checkbox" id="optmizedCheckbox" name="optmizedCheckbox" checked>
  <label for="optmizedCheckbox">smarter backtracking</label>
  `;

document.querySelector("#app").innerHTML = body;
var canvas = document.getElementById("sudokuBoardTrace");
var ctx = canvas.getContext("2d");
var slider = document.getElementById("speedSetting");
var startButton = document.getElementById("startButton");
var startSkipButton = document.getElementById("startSkipButton");
var resetButton = document.getElementById("resetButton");
var editButton = document.getElementById("editButton");
var clearButton = document.getElementById("clearButton");
var boardName = document.getElementById("boardName");
var newButton = document.getElementById("newButton");
var skipButton = document.getElementById("skipButton");
var optmizedCheckbox = document.getElementById("optmizedCheckbox");
document.querySelector("#sudokuBoard").innerHTML = getBoardHtml(currentBoard);

startButton.onclick = () => {
  startButton.disabled = true;
  startSkipButton.disabled = true;
  startSolver();
};

startSkipButton.onclick = () => {
  startButton.disabled = true;
  startSkipButton.disabled = true;
  slider.value = 0;
  startSolver();
  skipping = true;
  skipButton.disabled = true;
};

resetButton.onclick = async () => {
  if (running) {
    terminate = true;
    while (terminate) await asyncSleep(10);
  }
  document.querySelector("#sudokuBoard").innerHTML = getBoardHtml(currentBoard);
};

editButton.onclick = async () => {
  if (running) {
    terminate = true;
    while (terminate) await asyncSleep(10);
  }
  document.querySelector("#sudokuBoard").innerHTML = getBoardEditHtml(currentBoard);
  drawRecursiveTrace()
  boardName.innerHTML = ``;
};

clearButton.onclick = async () => {
  if (running) {
    terminate = true;
    while (terminate) await asyncSleep(10);
  }
  clearBoard();
  document.querySelector("#sudokuBoard").innerHTML = getBoardHtml(currentBoard);
  boardName.innerHTML = ``;
};

newButton.onclick = async () => {
  if (running) {
    terminate = true;
    while (terminate) await asyncSleep(10);
  }
  var [difficulty, boardNumber] = newBoard();
  boardName.innerHTML = `<h3>${difficulty} (${boardNumber})</h3>`;
};

skipButton.onclick = () => {
  skipping = true;
};

function drawRecursiveTrace() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  var cWidth = canvas.width / 9;
  var cHeight = canvas.height / 9;
  for (var i = 0; i < recursiveStack.length - 1; i++) {
    var [xf, yf] = recursiveStack[i];
    var [xt, yt] = recursiveStack[i + 1];
    ctx.strokeStyle = `hsl(${i * 10},100%,50%)`;
    ctx.beginPath();
    ctx.moveTo(yf * cWidth + cHeight * 0.5, xf * cHeight + cHeight * 0.5);
    ctx.lineTo(yt * cWidth + cHeight * 0.5, xt * cHeight + cHeight * 0.5);
    ctx.stroke();
  }
}
