import { playChessPieceSound } from "../../all.js";

"use strict";

const canvas = document.getElementById("c");
const rect = canvas.getBoundingClientRect();
canvas.width = rect.width;
canvas.height = rect.height;
const cwidth = canvas.width, cheight = canvas.height;

const drawer = canvas.getContext("2d");
drawer.fillRect(0, 0, cwidth, cheight);

const pieceColors = ["white", "black"];
const pieceForwards = [1, -1];
const boardColors = ["brown", "tan"];

let selectedPiece = null;
let currentPlayer = 0;

class Board {
    constructor(width = 8, height = 8) {
        this.width = width;
        this.height = height;
        this.initPieces();
    }

    initPieces() {
        this.pieces = new Array(this.width);

        for (let x = 0; x < this.width; x++) {
            const col = new Array(this.height);

            for (let y = 0; y < this.height; y++) {
                let newPiece = null;
                const pieceTile = (x + y) % 2 == 0;
                const whiteZone = y >= 5, blackZone = y <= 2;
                if (pieceTile && whiteZone) {
                    newPiece = new Piece(this, x, y, "white");
                }
                if (pieceTile && blackZone) {
                    newPiece = new Piece(this, x, y, "black");
                }
                col[y] = newPiece;
            }

            this.pieces[x] = col;
        }
    }

    validPos(x, y) {
        return (x >= 0 && x < this.width && y >= 0 && y < this.height);
    }

    getPiece(x, y) {
        return this.pieces[x][y];
    }

    setPiece(x, y, piece) {
        if (piece instanceof Piece) {
            piece.x = x;
            piece.y = y;
        }
        this.pieces[x][y] = piece;
    }

    removePiece(x, y) {
        this.setPiece(x, y, null);
    }

    isEmpty(x, y) {
        return this.pieces[x][y] == null;
    }

    getLoss(color) {
        let pieceCount = 0;
        let canColorMove = false;
        this.pieces.forEach((col) => {
            col.forEach((piece) => {
                //screen only for pieces of the test color
                if (piece == null) {
                    return;
                }
                if (piece.color !== color) {
                    return;
                }

                pieceCount++;
                canColorMove |= piece.canMoveAnywhere();
            });
        });

        if (pieceCount == 0 || !canColorMove) {
            return true;
        }
        return false;
    }

    canPlayerCapture(color) {
        let canColorCapture = false;
        this.pieces.forEach((col) => {
            col.forEach((piece) => {
                //screen only for pieces of the test color
                if (piece == null) {
                    return;
                }
                if (piece.color !== color) {
                    return;
                }

                canColorCapture |= piece.canCaptureAnywhere();
            });
        });

        return canColorCapture;
    }

    getDimensionInfo() {
        const tileSize = Math.min(cwidth / board.width, cheight / board.height);
        const boardWidth = tileSize * board.width, boardHeight = tileSize * board.height;
        const widthOffset = (cwidth - boardWidth) / 2, heightOffset = (cheight - boardHeight) / 2;
        return [tileSize, widthOffset, heightOffset];
    }
}

class Piece {
    constructor(board, xPos = 0, yPos = 0, color = "white") {
        this.board = board;
        this.x = xPos;
        this.y = yPos;
        this.color = color;
        this.king = { value: false };
    }

    isKing() {
        return this.king.value;
    }

    getForwards() {
        return pieceForwards[pieceColors.indexOf(this.color)];
    }

    canMove(x, y) {
        //first is the test for canMove, second is if it is a capture
        const returnVals = [false, false];
        //check if position is valid
        if (!this.board.validPos(x, y)) {
            return returnVals;
        }
        //can't move to a filled square
        if (!this.board.isEmpty(x, y)) {
            return returnVals;
        }
        //only allow diagonal movement
        const xDiff = x - this.x, yDiff = y - this.y;
        const xDist = Math.abs(xDiff), yDist = Math.abs(yDiff);
        if (yDist / xDist != 1) {
            return returnVals;
        }
        //can't move backwards unless you're a king
        if (Math.sign(-yDiff) != this.getForwards() && !this.isKing()) {
            return returnVals;
        }
        //check if you're capturing, if so, then only allow if the correct type of piece is being captured
        const capturing = xDist == 2;
        if (capturing) {
            const captured = this.board.getPiece(this.x + Math.sign(xDiff), this.y + Math.sign(yDiff));
            if (captured == null || captured.color === this.color) {
                return returnVals;
            }

            returnVals[1] = true;
        }
        //only allowed to move one square at a time
        returnVals[0] = (xDist == 1) || returnVals[1];

        return returnVals;
    }

    canMoveAnywhere() {
        for (let x = 0; x < this.board.width; x++) {
            for (let y = 0; y < this.board.width; y++) {
                if (this.canMove(x, y)[0]) {
                    return true;
                }
            }
        }
        return false;
    }

    canCaptureAnywhere() {
        for (let x = 0; x < this.board.width; x++) {
            for (let y = 0; y < this.board.width; y++) {
                if (this.canMove(x, y)[1]) {
                    return true;
                }
            }
        }
        return false;
    }

    move(x, y) {
        //handle capturing
        const capture = Math.abs(x - this.x) == 2;
        if (capture) {
            const xStep = Math.sign(x - this.x), yStep = Math.sign(y - this.y);
            this.board.removePiece(this.x + xStep, this.y + yStep);
        }

        //handle becoming a king
        const test = (this.getForwards() == 1) ? 0 : this.board.height - 1;
        if (y == test) {
            this.king.value = true;
        }

        this.board.removePiece(this.x, this.y);
        this.board.setPiece(x, y, this);

        return capture;
    }
}

//END OF GAME CLASS DEFINITIONS

function drawCircle(centerX, centerY, radius, color) {
    drawer.beginPath();
    drawer.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    drawer.fillStyle = color;
    drawer.fill();
    drawer.closePath();
}

function drawBoard(board) {
    if (!(board instanceof Board)) {
        console.log("Tried to draw an object that was not a board!");
        return;
    }

    drawer.fillStyle = "black";
    drawer.fillRect(0, 0, cwidth, cheight);

    //drawing the background tiles
    const [tileSize, widthOffset, heightOffset] = board.getDimensionInfo();
    let mustCapture = false;
    if (selectedPiece != null) {
        mustCapture = board.canPlayerCapture(selectedPiece.color);
    }

    for (let x = 0; x < board.width; x++) {
        for (let y = 0; y < board.height; y++) {
            const color = boardColors[(x + y) % 2];
            drawer.fillStyle = color;

            const xPos = x * tileSize + widthOffset, yPos = y * tileSize + heightOffset;
            drawer.fillRect(xPos, yPos, tileSize, tileSize);

            const midPoint = tileSize / 2;
            const centerX = x * tileSize + widthOffset + midPoint;
            const centerY = y * tileSize + heightOffset + midPoint;
            const radius = midPoint;

            //drawing the pieces
            const piece = board.getPiece(x, y);
            if (piece != null) {
                drawCircle(centerX, centerY, radius, piece.color);

                if (piece.isKing()) {
                    drawCircle(centerX, centerY, radius / 1.5, "gold");
                }
            }

            //drawing guide dots for possible moves
            if (selectedPiece != null) {
                const moves = selectedPiece.canMove(x, y);
                let able = false;
                if (mustCapture) {
                    able = moves[1];
                } else {
                    able = moves[0];
                }
                if (able) {
                    drawCircle(centerX, centerY, radius / 3, "gray");
                }
            }
        }
    }
}

function advanceGame() {
    const previous = currentPlayer;
    currentPlayer = (currentPlayer + 1) % pieceColors.length;

    if (board.getLoss(pieceColors[currentPlayer])) {
        alert(pieceColors[previous].toUpperCase() + " WINS!");
    }
}

function boardClicked(board, x, y) {
    const [tileSize, widthOffset, heightOffset] = board.getDimensionInfo();
    const boardX = Math.floor((x - widthOffset) / tileSize), boardY = Math.floor((y - heightOffset) / tileSize);

    handleClick: {
        if (!board.validPos(boardX, boardY)) {
            break handleClick;
        }

        const piece = board.getPiece(boardX, boardY);
        if (piece != null) {
            //has to be the correct player's color
            if (piece.color !== pieceColors[currentPlayer]) {
                break handleClick;
            }

            selectedPiece = piece;
            break handleClick;
        }

        if (selectedPiece != null) {
            //gets the index of the values returned by piece.canMove() to check whether or not the player can just move in general OR if they have to capture
            const moveRequirement = board.canPlayerCapture(pieceColors[currentPlayer]) ? 1 : 0;

            if (selectedPiece.canMove(boardX, boardY)[moveRequirement]) {
                selectedPiece.move(boardX, boardY);
                playChessPieceSound();
                advanceGame();
            }
            selectedPiece = null;
        }
    }

    drawBoard(board);
}

const board = new Board(8, 8);
drawBoard(board);

canvas.addEventListener("click", (evt) => {
    boardClicked(board, evt.offsetX, evt.offsetY);
});

function resetBoard() {
    currentPlayer = 0;
    selectedPiece = null;

    board.initPieces();
    drawBoard(board);
}
window.resetBoard = resetBoard;