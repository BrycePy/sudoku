var possible_grid = Array(81).fill(999);

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

function getMinRemainingPosRand() {
  var min_con = Math.min(...possible_grid.filter((e) => e != 0));
  var min_index = possible_grid.map((e, i) => (e == min_con) ? i : -1).filter((e) => e != -1);
  var index = min_index[Math.floor(Math.random() * min_index.length)];
  return [index % 9, Math.floor(index / 9)];
}

function getMinRemainingPos() {
  var min_con = Math.min(...possible_grid.filter((e) => e != 0));
  var index = possible_grid.indexOf(min_con);
  return [index % 9, Math.floor(index / 9)];
}

function isSolved(board) {
  for (var y = 0; y < 9; y++) {
    for (var x = 0; x < 9; x++) {
      if (_getBoard(board, x, y) == 0) {
        return false;
      }
    }
  }
  return true;
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

async function generateFilled(board, depth = 0) {
  if (depth == 0){
    updatePossibleGrid(board)
    numberAnswer = 0;
  }

  if(isSolved(board))
    return board;
    
  var [x, y] = getMinRemainingPosRand();
  var possible = getPossible(board, x, y);
  if (possible.length == 0) return;

  for (var c of possible) {
    var temp_grid = [...possible_grid];
    possible_grid[y * 9 + x] = 999;
    _setBoard(board, x, y, c);

    var canContinue = true;
    for (const pos of genRange(x, y)) {
      var [xi, yi] = pos;
      if(_getBoard(board, xi, yi) == 0){
        var possibleCount = getPossible(board, xi, yi).length;
        possible_grid[yi * 9 + xi] = possibleCount;
        if(possibleCount == 0)
          canContinue = false;
      }
    }
    if(canContinue){
      if(await generateFilled(board, depth + 1)){
        return board
      }
    }
    possible_grid.map((e, i) => temp_grid[i]);
  }
  _setBoard(board, x, y, 0);
}

var numberAnswer = 0;
async function hasMultipleAnswer(board, depth = 0) {
  if (depth == 0){
    updatePossibleGrid(board)
    numberAnswer = 0;
  }

  if(isSolved(board)){
    numberAnswer++;
    return numberAnswer > 1;
  }
    
  var [x, y] = getMinRemainingPos();
  var possible = getPossible(board, x, y);
  if (possible.length == 0) return false;

  for (var c of possible) {
    var temp_grid = [...possible_grid];
    possible_grid[y * 9 + x] = 999;
    _setBoard(board, x, y, c);

    var canContinue = true;
    for (const pos of genRange(x, y)) {
      var [xi, yi] = pos;
      if(_getBoard(board, xi, yi) == 0){
        var possibleCount = getPossible(board, xi, yi).length;
        possible_grid[yi * 9 + xi] = possibleCount;
        if(possibleCount == 0)
          canContinue = false;
      }
    }
    if(canContinue){
      if(await hasMultipleAnswer(board, depth + 1))
        return true;
    }
    possible_grid.map((e, i) => temp_grid[i]);
  }
  _setBoard(board, x, y, 0);
  return false;
}

async function generate(){
  var fullBoardRaw = await generateFilled(Array(9).fill(0).map(() => Array(9).fill(0)))
  var boards = []
  for(var i = 0; i < 3; i++){
    var fullBoard = [...fullBoardRaw].map((e) => [...e]);
    var attemptLeft = 10;
    while(attemptLeft > 0){
      var testClone = [...fullBoard].map(e=>[...e]);
      var [x, y] = [randInt(0, 8), randInt(0, 8)];
      while(_getBoard(testClone, x, y) == 0){
        x = randInt(0, 8);
        y = randInt(0, 8);
      }
      _setBoard(testClone, x, y, 0);
      var result = await hasMultipleAnswer(testClone);
      if(result){
        attemptLeft--;
      }else{
        _setBoard(fullBoard, x, y, 0);
      }
    }
    boards.push(fullBoard);
  }
  var boardNum = boards.map(e=>e.toString().match(/0/g).length);
  var index = boardNum.indexOf(Math.min(...boardNum));
  return boards[index];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export { generate };