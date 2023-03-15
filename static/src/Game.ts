import * as THREE from 'three'
import Pawn from './Pawn'
import BoardSquare from './BoardSquare'
import Tween from '@tweenjs/tween.js'
import { net } from './main'
import Queen from './Queen'

export default class Game {
    size: number
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    raycaster: THREE.Raycaster
    mouseVector: THREE.Vector2
    board: number[][]
    pawns: number[][]
    player: string
    yourTurn: boolean
    capturingMode: boolean
    endGame: boolean

    constructor() {
        this.endGame = false
        this.capturingMode = false;
        this.yourTurn = false
        this.size = 50
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, 4 / 3, 0.1, 10000);
        this.camera.position.set(this.size * 12, 800, this.size * 4)
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor(0x4a4a4a);
        (document.getElementById("root") as HTMLDivElement).append(this.renderer.domElement);
        this.camera.lookAt(this.size * 4, 0, this.size * 4);
        this.raycaster = new THREE.Raycaster();
        this.mouseVector = new THREE.Vector2();
        this.player = ""

        this.board = [
            [1, 0, 1, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1, 0, 1]
        ];
        // 0 - empty
        // 1 - black pawn
        // 2 - white pawn
        //x  0  1  2  3  4  5  6  7
        this.pawns = [
            [0, 2, 0, 2, 0, 2, 0, 2], //y 0
            [2, 0, 2, 0, 2, 0, 2, 0], //y 1
            [0, 0, 0, 0, 0, 0, 0, 0], //y 2
            [0, 0, 0, 0, 0, 0, 0, 0], //y 3
            [0, 0, 0, 0, 0, 0, 0, 0], //y 4
            [0, 0, 0, 0, 0, 0, 0, 0], //y 5
            [0, 1, 0, 1, 0, 1, 0, 1], //y 6
            [1, 0, 1, 0, 1, 0, 1, 0]  //y 7
        ];
        // this.pawns = [
        //     [0, 1, 0, 2, 0, 0, 0, 0],
        //     [2, 0, 0, 0, 0, 0, 0, 0],
        //     [0, 0, 0, 2, 0, 0, 0, 0],
        //     [0, 0, 0, 0, 0, 0, 2, 0],
        //     [0, 1, 0, 1, 0, 0, 0, 0],
        //     [0, 0, 1, 0, 1, 0, 1, 0],
        //     [0, 0, 0, 0, 0, 0, 0, 0],
        //     [0, 0, 0, 0, 2, 0, 0, 0]
        // ];

        //this.scene.add(new THREE.AxesHelper(100))

        this.createBoard()

        this.render()
    }

    render = () => {
        Tween.update();
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight - 100);

        requestAnimationFrame(this.render);
        this.renderer.render(this.scene, this.camera);
        this.camera.lookAt(this.size * 4, 0, this.size * 4);
    }

    createBoard = () => {
        let cube

        for (let i = 0; i < this.board.length; i++) {
            for (let j = 0; j < this.board[i].length; j++) {
                if (this.board[i][j] == 1) {
                    cube = new BoardSquare("light", this.size, i, j)
                    this.scene.add(cube);
                    cube.position.set(i * this.size + this.size / 2, 2.5, j * this.size + this.size / 2)
                } else {
                    cube = new BoardSquare("dark", this.size, i, j)
                    this.scene.add(cube);
                    cube.position.set(i * this.size + this.size / 2, 2.5, j * this.size + this.size / 2)
                }
            }
        }
    }

    givePawns = () => {
        let cylinder

        for (let i = 0; i < this.pawns.length; i++) {
            for (let j = 0; j < this.pawns[i].length; j++) {
                if (this.pawns[i][j] == 2) {
                    cylinder = new Pawn("white", this.size, i, j)

                    this.scene.add(cylinder);
                    cylinder.position.set(j * this.size + this.size / 2, 10, i * this.size + this.size / 2)

                } else if (this.pawns[i][j] == 1) {
                    cylinder = new Pawn("black", this.size, i, j)

                    this.scene.add(cylinder);
                    cylinder.position.set(j * this.size + this.size / 2, 10, i * this.size + this.size / 2)
                }
            }
        }
    }

    checkForMovePawn = (player: number) => {
        //console.log("checkForMovePawn");

        if (this.yourTurn) {
            let pawnCanEat = false;
            let pawnChecked = false;
            let whatWasClicked: BoardSquare | Pawn | Queen
            let oldPawn: any

            window.addEventListener("mousedown", (e) => {
                if (this.yourTurn && !this.capturingMode) {
                    if (this.endGame == false) {
                        this.mouseVector.x = (e.clientX / (document.getElementById("root") as HTMLDivElement).offsetWidth) * 2 - 1;
                        this.mouseVector.y = -((e.clientY - 100) / (document.getElementById("root") as HTMLDivElement).offsetHeight) * 2 + 1;
                        this.raycaster.setFromCamera(this.mouseVector, this.camera);

                        const intersects = this.raycaster.intersectObjects(this.scene.children);

                        if (intersects.length > 0) {
                            whatWasClicked = (<BoardSquare | Queen | Pawn>intersects[0].object);

                            if (whatWasClicked instanceof Pawn) {
                                if (whatWasClicked == oldPawn) {
                                    whatWasClicked.material.color.setHex(0xffffff);
                                    pawnChecked = false;
                                    oldPawn = undefined;

                                    this.clearPossibleMoves();
                                } else {
                                    if (player == 1) {
                                        if (whatWasClicked.player == "white") {
                                            if (pawnChecked) {
                                                oldPawn.material.color.setHex(0xffffff);
                                                whatWasClicked.material.color.setHex(0xff0000);
                                                oldPawn = intersects[0].object;
                                            } else {
                                                whatWasClicked.material.color.setHex(0xff0000);
                                                pawnChecked = true;
                                                oldPawn = intersects[0].object;
                                            }

                                            this.colorPossibleMovesForWhite(whatWasClicked);
                                        }
                                    } else {
                                        if (whatWasClicked.player == "black") {
                                            if (pawnChecked) {
                                                oldPawn.material.color.setHex(0xffffff);
                                                whatWasClicked.material.color.setHex(0xff0000);
                                                oldPawn = intersects[0].object;
                                            } else {
                                                whatWasClicked.material.color.setHex(0xff0000);
                                                pawnChecked = true;
                                                oldPawn = intersects[0].object;
                                            }

                                            this.colorPossibleMovesForBlack(whatWasClicked);
                                        }
                                    }
                                }
                            } else if (whatWasClicked instanceof Queen) {
                                this.clearPossibleMoves();
                                console.log("queen");
                                console.log("pawns:", this.pawns[whatWasClicked.queenY][whatWasClicked.queenX]);

                                if (whatWasClicked == oldPawn) {
                                    whatWasClicked.material.color.setHex(0xffffff);
                                    pawnChecked = false;
                                    oldPawn = undefined;

                                    this.clearPossibleMoves();
                                } else {
                                    if (player == 1) {
                                        if (whatWasClicked.player == "white") {
                                            if (pawnChecked) {
                                                oldPawn.material.color.setHex(0xffffff);
                                                whatWasClicked.material.color.setHex(0xff0000);
                                                oldPawn = intersects[0].object;
                                            } else {
                                                whatWasClicked.material.color.setHex(0xff0000);
                                                pawnChecked = true;
                                                oldPawn = intersects[0].object;
                                            }

                                            this.colorPossibleMovesForWhiteQueen(whatWasClicked);
                                        }
                                    } else {
                                        if (whatWasClicked.player == "black") {
                                            if (pawnChecked) {
                                                oldPawn.material.color.setHex(0xffffff);
                                                whatWasClicked.material.color.setHex(0xff0000);
                                                oldPawn = intersects[0].object;
                                            } else {
                                                whatWasClicked.material.color.setHex(0xff0000);
                                                pawnChecked = true;
                                                oldPawn = intersects[0].object;
                                            }

                                            this.colorPossibleMovesForBlackQueen(whatWasClicked);
                                        }
                                    }
                                }
                            } else {
                                console.log("pawns:", this.pawns[whatWasClicked.boardY][whatWasClicked.boardX]);

                                if (whatWasClicked.squareColor == "dark") {
                                    if (pawnChecked) {
                                        if (oldPawn instanceof Pawn) {
                                            if (whatWasClicked.material.color.getHex() == 0x00ff00) {
                                                //move pawn

                                                new Tween.Tween(oldPawn.position)
                                                    .to({ x: whatWasClicked.position.x, z: whatWasClicked.position.z }, 500)
                                                    .easing(Tween.Easing.Circular.Out)
                                                    .start()

                                                oldPawn.material.color.setHex(0xffffff);
                                                pawnChecked = false;

                                                if (player == 1) {
                                                    this.pawns[whatWasClicked.boardY][whatWasClicked.boardX] = 2;
                                                    this.pawns[oldPawn.pawnY][oldPawn.pawnX] = 0;
                                                }
                                                else {
                                                    this.pawns[whatWasClicked.boardY][whatWasClicked.boardX] = 1;
                                                    this.pawns[oldPawn.pawnY][oldPawn.pawnX] = 0;
                                                }

                                                net.movePawn(oldPawn.pawnX, oldPawn.pawnY, whatWasClicked.boardX, whatWasClicked.boardY, this.pawns);

                                                oldPawn.pawnX = whatWasClicked.boardX;
                                                oldPawn.pawnY = whatWasClicked.boardY;


                                                this.clearPossibleMoves();

                                                console.log("koniec ruchu - zwykly 2");

                                                oldPawn = undefined;

                                                net.nextTurn();
                                            } else if (whatWasClicked.material.color.getHex() == 0x0000ff) {
                                                //capture pawn

                                                new Tween.Tween(oldPawn.position)
                                                    .to({ x: whatWasClicked.position.x, z: whatWasClicked.position.z }, 500)
                                                    .easing(Tween.Easing.Circular.Out)
                                                    .start()

                                                oldPawn.material.color.setHex(0xffffff);
                                                pawnChecked = false;

                                                this.removePawn((whatWasClicked.boardX + oldPawn.pawnX) / 2, (whatWasClicked.boardY + oldPawn.pawnY) / 2);

                                                if (player == 1) {
                                                    this.pawns[whatWasClicked.boardY][whatWasClicked.boardX] = 2;
                                                    this.pawns[oldPawn.pawnY][oldPawn.pawnX] = 0;
                                                } else {
                                                    this.pawns[whatWasClicked.boardY][whatWasClicked.boardX] = 1;
                                                    this.pawns[oldPawn.pawnY][oldPawn.pawnX] = 0;
                                                }

                                                net.capturePawn(oldPawn.pawnX, oldPawn.pawnY, whatWasClicked.boardX, whatWasClicked.boardY, this.pawns, (whatWasClicked.boardX + oldPawn.pawnX) / 2, (whatWasClicked.boardY + oldPawn.pawnY) / 2)

                                                oldPawn.pawnX = whatWasClicked.boardX;
                                                oldPawn.pawnY = whatWasClicked.boardY;

                                                if (player == 1) {
                                                    pawnCanEat = this.checkIfWhitePawnCanEat(oldPawn);
                                                }
                                                else {
                                                    pawnCanEat = this.checkIfBlackPawnCanEat(oldPawn);
                                                }

                                                console.log("pawnCanEat:", pawnCanEat);

                                                if (pawnCanEat) {
                                                    this.clearPossibleMoves();
                                                    this.nextCaptures(oldPawn);
                                                } else {
                                                    this.clearPossibleMoves();
                                                    console.log("koniec ruchu - zwykly 2");

                                                    this.checkLoser();

                                                    this.capturingMode = false;
                                                    net.nextTurn();
                                                }

                                                oldPawn = undefined;
                                            }
                                        } else if (oldPawn instanceof Queen) {
                                            if (whatWasClicked.material.color.getHex() == 0x00ff00) {
                                                //move pawn

                                                new Tween.Tween(oldPawn.position)
                                                    .to({ x: whatWasClicked.position.x, z: whatWasClicked.position.z }, 500)
                                                    .easing(Tween.Easing.Circular.Out)
                                                    .start()

                                                oldPawn.material.color.setHex(0xffffff);
                                                pawnChecked = false;

                                                if (player == 1) {
                                                    this.pawns[whatWasClicked.boardY][whatWasClicked.boardX] = 2;
                                                    this.pawns[oldPawn.queenY][oldPawn.queenX] = 0;
                                                }
                                                else {
                                                    this.pawns[whatWasClicked.boardY][whatWasClicked.boardX] = 1;
                                                    this.pawns[oldPawn.queenY][oldPawn.queenX] = 0;
                                                }

                                                net.movePawn(oldPawn.queenX, oldPawn.queenY, whatWasClicked.boardX, whatWasClicked.boardY, this.pawns);

                                                oldPawn.queenX = whatWasClicked.boardX;
                                                oldPawn.queenY = whatWasClicked.boardY;


                                                this.clearPossibleMoves();

                                                console.log("koniec ruchu - zwykly 2");

                                                oldPawn = undefined;

                                                net.nextTurn();
                                            } else if (whatWasClicked.material.color.getHex() == 0x0000ff) {
                                                //capture pawn do naprawienia
                                                /*
                                                ####################################################################################
                                                ####################################################################################
                                                ####################################################################################
                                                ####################################################################################
                                                ####################################################################################
                                                ####################################################################################
                                                ####################################################################################
                                                ####################################################################################
                                                                                                */

                                                new Tween.Tween(oldPawn.position)
                                                    .to({ x: whatWasClicked.position.x, z: whatWasClicked.position.z }, 500)
                                                    .easing(Tween.Easing.Circular.Out)
                                                    .start()

                                                oldPawn.material.color.setHex(0xffffff);
                                                pawnChecked = false;

                                                let startX = oldPawn.queenX;
                                                let endX = whatWasClicked.boardX;

                                                let startY = oldPawn.queenY;
                                                let endY = whatWasClicked.boardY;

                                                let xList = [];
                                                let yList = [];

                                                if (startX < endX) {
                                                    for (let i = startX + 1; i < endX; i++) {
                                                        xList.push(i);
                                                    }
                                                } else {
                                                    for (let i = startX - 1; i > endX; i--) {
                                                        xList.push(i);
                                                    }
                                                }

                                                if (startY < endY) {
                                                    for (let i = startY + 1; i < endY; i++) {
                                                        yList.push(i);
                                                    }
                                                } else {
                                                    for (let i = startY - 1; i > endY; i--) {
                                                        yList.push(i);
                                                    }
                                                }

                                                if (player == 1) {
                                                    this.pawns[whatWasClicked.boardY][whatWasClicked.boardX] = 2;
                                                    this.pawns[oldPawn.queenY][oldPawn.queenX] = 0;
                                                } else {
                                                    this.pawns[whatWasClicked.boardY][whatWasClicked.boardX] = 1;
                                                    this.pawns[oldPawn.queenY][oldPawn.queenX] = 0;
                                                }

                                                //console.log("xList:", xList);
                                                //console.log("yList:", yList);

                                                for (let i = 0; i < xList.length; i++) {
                                                    this.removePawn(xList[i], yList[i]);
                                                    this.pawns[yList[i]][xList[i]] = 0;
                                                    net.capturePawn(oldPawn.queenX, oldPawn.queenY, whatWasClicked.boardX, whatWasClicked.boardY, this.pawns, xList[i], yList[i])
                                                }

                                                oldPawn.queenX = whatWasClicked.boardX;
                                                oldPawn.queenY = whatWasClicked.boardY;

                                                this.clearPossibleMoves();
                                                console.log("koniec ruchu - zwykly 2");

                                                this.checkLoser();

                                                this.capturingMode = false;
                                                net.nextTurn();

                                                oldPawn = undefined;
                                            }
                                        }
                                    }

                                    this.checkLoser();
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    checkForPromotion = () => {
        console.log("checkForPromotion");

        for (let i = 0; i < this.scene.children.length; i++) {
            if (this.scene.children[i] instanceof Pawn) {
                let sceneChildren = <Pawn>this.scene.children[i];

                if (sceneChildren.player == "white") {
                    if (sceneChildren.pawnY == 7) {
                        let x = sceneChildren.pawnX;
                        let y = sceneChildren.pawnY;

                        this.removePawn(x, y)

                        let cylinder = new Queen("white", this.size, y, x)
                        this.scene.add(cylinder);
                        cylinder.position.set(x * this.size + this.size / 2, 20, y * this.size + this.size / 2)

                        console.log("promocja");

                        this.pawns[y][x] = 2;

                        break;
                    }
                } else if (sceneChildren.player == "black") {
                    if (sceneChildren.pawnY == 0) {
                        let x = sceneChildren.pawnX;
                        let y = sceneChildren.pawnY;

                        this.removePawn(x, y)

                        let cylinder = new Queen("black", this.size, y, x)
                        this.scene.add(cylinder);
                        cylinder.position.set(x * this.size + this.size / 2, 20, y * this.size + this.size / 2)

                        console.log("promocja");

                        this.pawns[y][x] = 1;

                        break;
                    }
                }
            }
        }
        return 0;
    }

    nextCaptures = (pawn: Pawn) => {
        console.log("nextCaptures");

        this.clearPossibleMoves();

        let pawnCanEat = false;
        if (pawn.player == "white") {
            pawnCanEat = this.checkIfWhitePawnCanEat(pawn);
        } else {
            pawnCanEat = this.checkIfBlackPawnCanEat(pawn);
        }

        if (pawnCanEat) {
            this.capturingMode = true;
            pawn.material.color.setHex(0xff0000);

            window.addEventListener("mousedown", (e) => {
                if (this.yourTurn) {
                    this.mouseVector.x = (e.clientX / (document.getElementById("root") as HTMLDivElement).offsetWidth) * 2 - 1;
                    this.mouseVector.y = -((e.clientY - 100) / (document.getElementById("root") as HTMLDivElement).offsetHeight) * 2 + 1;
                    this.raycaster.setFromCamera(this.mouseVector, this.camera);

                    const intersects = this.raycaster.intersectObjects(this.scene.children);

                    if (intersects.length > 0) {
                        let whatWasClicked = (<BoardSquare | Pawn>intersects[0].object);

                        if (whatWasClicked instanceof BoardSquare) {
                            if (whatWasClicked.squareColor == "dark") {
                                if (whatWasClicked.material.color.getHex() == 0x0000ff) {
                                    //capture pawn

                                    new Tween.Tween(pawn.position)
                                        .to({ x: whatWasClicked.position.x, z: whatWasClicked.position.z }, 500)
                                        .easing(Tween.Easing.Circular.Out)
                                        .start()

                                    pawn.material.color.setHex(0xffffff);

                                    this.removePawn((whatWasClicked.boardX + pawn.pawnX) / 2, (whatWasClicked.boardY + pawn.pawnY) / 2);

                                    if (pawn.player == "white") {
                                        this.pawns[whatWasClicked.boardY][whatWasClicked.boardX] = 2;
                                        this.pawns[pawn.pawnY][pawn.pawnX] = 0;
                                    } else {
                                        this.pawns[whatWasClicked.boardY][whatWasClicked.boardX] = 1;
                                        this.pawns[pawn.pawnY][pawn.pawnX] = 0;
                                    }

                                    net.capturePawn(pawn.pawnX, pawn.pawnY, whatWasClicked.boardX, whatWasClicked.boardY, this.pawns, (whatWasClicked.boardX + pawn.pawnX) / 2, (whatWasClicked.boardY + pawn.pawnY) / 2)

                                    pawn.pawnX = whatWasClicked.boardX;
                                    pawn.pawnY = whatWasClicked.boardY;

                                    if (pawn.player == "white") {
                                        pawnCanEat = this.checkIfWhitePawnCanEat(pawn);
                                    }
                                    else {
                                        pawnCanEat = this.checkIfBlackPawnCanEat(pawn);
                                    }

                                    if (pawnCanEat) {
                                        this.clearPossibleMoves();
                                        this.nextCaptures(pawn);
                                    } else {
                                        console.log("koniec ruchu - zbijanie 1");

                                        this.checkLoser();

                                        this.capturingMode = false;
                                        net.nextTurn();
                                    }
                                }
                            }
                        }
                    }
                }
            });
        } else {
            console.log("koniec ruchu - zbijanie 2");
            return
        }
    }

    checkLoser = () => {
        let areWhitePawnsLeft = false,
            areBlackPawnsLeft = false;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (this.pawns[i][j] == 2) {
                    areWhitePawnsLeft = true;
                } else if (this.pawns[i][j] == 1) {
                    areBlackPawnsLeft = true;
                }
            }
        }

        if (areWhitePawnsLeft && this.player == "white" && !areBlackPawnsLeft) {
            console.log("noPieces");

            net.lost("noPieces");
        } else if (areBlackPawnsLeft && this.player == "black" && !areWhitePawnsLeft) {
            console.log("noPieces");
            net.lost("noPieces");
        }
    }

    setPlayer = (player: number) => {
        if (player == 1) {
            this.player = "white"
            new Tween.Tween(this.camera.position)
                .to({ x: this.size * 4, y: 700, z: -100 }, 500)
                .easing(Tween.Easing.Circular.Out)
                .start()
        } else {
            this.player = "black"
            new Tween.Tween(this.camera.position)
                .to({ x: this.size * 4, y: 700, z: 500 }, 500)
                .easing(Tween.Easing.Circular.Out)
                .start()
        }
        this.checkForMovePawn(player);
    }

    colorPossibleMovesForBlack = (whatWasClicked: Pawn) => {
        this.clearPossibleMoves();
        let coloredSquares = 0;
        //1 czarny
        //2 bialy
        //0 puste

        //lewa gora
        if (whatWasClicked.pawnY - 2 >= 0 && whatWasClicked.pawnX - 2 >= 0) {
            if (this.pawns[whatWasClicked.pawnY - 1][whatWasClicked.pawnX - 1] == 2) {
                if (this.pawns[whatWasClicked.pawnY - 2][whatWasClicked.pawnX - 2] == 0) {
                    for (let i = 0; i < this.scene.children.length; i++) {
                        let sceneChildren = <BoardSquare>this.scene.children[i];

                        if (this.scene.children[i] instanceof BoardSquare) {
                            if (sceneChildren.boardX == whatWasClicked.pawnX - 2 && sceneChildren.boardY == whatWasClicked.pawnY - 2) {
                                sceneChildren.material.color.setHex(0x0000ff);
                                coloredSquares++;

                                break;
                            }
                        }
                    }
                }
            }
        }
        //prawa gora
        if (whatWasClicked.pawnY - 2 >= 0 && whatWasClicked.pawnX + 2 <= 7) {
            if (this.pawns[whatWasClicked.pawnY - 1][whatWasClicked.pawnX + 1] == 2) {
                if (this.pawns[whatWasClicked.pawnY - 2][whatWasClicked.pawnX + 2] == 0) {
                    for (let i = 0; i < this.scene.children.length; i++) {
                        let sceneChildren = <BoardSquare>this.scene.children[i];

                        if (this.scene.children[i] instanceof BoardSquare) {
                            if (sceneChildren.boardX == whatWasClicked.pawnX + 2 && sceneChildren.boardY == whatWasClicked.pawnY - 2) {
                                sceneChildren.material.color.setHex(0x0000ff);
                                coloredSquares++;

                                break;
                            }
                        }
                    }
                }
            }
        }
        //lewa dol
        if (whatWasClicked.pawnY + 2 <= 7 && whatWasClicked.pawnX - 2 >= 0) {
            if (this.pawns[whatWasClicked.pawnY + 1][whatWasClicked.pawnX - 1] == 2) {
                if (this.pawns[whatWasClicked.pawnY + 2][whatWasClicked.pawnX - 2] == 0) {
                    for (let i = 0; i < this.scene.children.length; i++) {
                        let sceneChildren = <BoardSquare>this.scene.children[i];

                        if (this.scene.children[i] instanceof BoardSquare) {
                            if (sceneChildren.boardX == whatWasClicked.pawnX - 2 && sceneChildren.boardY == whatWasClicked.pawnY + 2) {
                                sceneChildren.material.color.setHex(0x0000ff);
                                coloredSquares++;

                                break;
                            }
                        }
                    }
                }
            }
        }
        //prawa dol
        if (whatWasClicked.pawnY + 2 <= 7 && whatWasClicked.pawnX + 2 <= 7) {
            if (this.pawns[whatWasClicked.pawnY + 1][whatWasClicked.pawnX + 1] == 2) {
                if (this.pawns[whatWasClicked.pawnY + 2][whatWasClicked.pawnX + 2] == 0) {
                    for (let i = 0; i < this.scene.children.length; i++) {
                        let sceneChildren = <BoardSquare>this.scene.children[i];

                        if (this.scene.children[i] instanceof BoardSquare) {
                            if (sceneChildren.boardX == whatWasClicked.pawnX + 2 && sceneChildren.boardY == whatWasClicked.pawnY + 2) {
                                sceneChildren.material.color.setHex(0x0000ff);
                                coloredSquares++;

                                break;
                            }
                        }
                    }
                }
            }
        }

        for (let i = 0; i < this.scene.children.length; i++) {
            let sceneChildren = <BoardSquare>this.scene.children[i];

            if (this.scene.children[i] instanceof BoardSquare) {
                if (sceneChildren.boardX == whatWasClicked.pawnX - 1 && sceneChildren.boardY == whatWasClicked.pawnY - 1) {
                    if (this.pawns[sceneChildren.boardY][sceneChildren.boardX] == 0) {
                        sceneChildren.material.color.setHex(0x00ff00);
                    }
                }

                if (sceneChildren.boardX == whatWasClicked.pawnX + 1 && sceneChildren.boardY == whatWasClicked.pawnY - 1) {
                    if (this.pawns[sceneChildren.boardY][sceneChildren.boardX] == 0) {
                        sceneChildren.material.color.setHex(0x00ff00);
                    }
                }
            }
        }

        if (coloredSquares > 0) {
            return true;
        } else {
            return false;
        }
    }

    colorPossibleMovesForWhite = (whatWasClicked: Pawn) => {
        this.clearPossibleMoves();
        let coloredSquares = 0;
        //1 czarny
        //2 bialy
        //0 puste

        //lewa gora
        if (whatWasClicked.pawnY - 2 >= 0 && whatWasClicked.pawnX - 2 >= 0) {
            if (this.pawns[whatWasClicked.pawnY - 1][whatWasClicked.pawnX - 1] == 1) {
                if (this.pawns[whatWasClicked.pawnY - 2][whatWasClicked.pawnX - 2] == 0) {
                    for (let i = 0; i < this.scene.children.length; i++) {
                        let sceneChildren = <BoardSquare>this.scene.children[i];

                        if (this.scene.children[i] instanceof BoardSquare) {
                            if (sceneChildren.boardX == whatWasClicked.pawnX - 2 && sceneChildren.boardY == whatWasClicked.pawnY - 2) {
                                sceneChildren.material.color.setHex(0x0000ff);
                                coloredSquares++;

                                break;
                            }
                        }
                    }
                }
            }
        }
        //prawa gora
        if (whatWasClicked.pawnY - 2 >= 0 && whatWasClicked.pawnX + 2 <= 7) {
            if (this.pawns[whatWasClicked.pawnY - 1][whatWasClicked.pawnX + 1] == 1) {
                if (this.pawns[whatWasClicked.pawnY - 2][whatWasClicked.pawnX + 2] == 0) {
                    for (let i = 0; i < this.scene.children.length; i++) {
                        let sceneChildren = <BoardSquare>this.scene.children[i];

                        if (this.scene.children[i] instanceof BoardSquare) {
                            if (sceneChildren.boardX == whatWasClicked.pawnX + 2 && sceneChildren.boardY == whatWasClicked.pawnY - 2) {
                                sceneChildren.material.color.setHex(0x0000ff);
                                coloredSquares++;

                                break;
                            }
                        }
                    }
                }
            }
        }
        //lewa dol
        if (whatWasClicked.pawnY + 2 <= 7 && whatWasClicked.pawnX - 2 >= 0) {
            if (this.pawns[whatWasClicked.pawnY + 1][whatWasClicked.pawnX - 1] == 1) {
                if (this.pawns[whatWasClicked.pawnY + 2][whatWasClicked.pawnX - 2] == 0) {
                    for (let i = 0; i < this.scene.children.length; i++) {
                        let sceneChildren = <BoardSquare>this.scene.children[i];

                        if (this.scene.children[i] instanceof BoardSquare) {
                            if (sceneChildren.boardX == whatWasClicked.pawnX - 2 && sceneChildren.boardY == whatWasClicked.pawnY + 2) {
                                sceneChildren.material.color.setHex(0x0000ff);
                                coloredSquares++;

                                break;
                            }
                        }
                    }
                }
            }
        }
        //prawa dol
        if (whatWasClicked.pawnY + 2 <= 7 && whatWasClicked.pawnX + 2 <= 7) {
            if (this.pawns[whatWasClicked.pawnY + 1][whatWasClicked.pawnX + 1] == 1) {
                if (this.pawns[whatWasClicked.pawnY + 2][whatWasClicked.pawnX + 2] == 0) {
                    for (let i = 0; i < this.scene.children.length; i++) {
                        let sceneChildren = <BoardSquare>this.scene.children[i];

                        if (this.scene.children[i] instanceof BoardSquare) {
                            if (sceneChildren.boardX == whatWasClicked.pawnX + 2 && sceneChildren.boardY == whatWasClicked.pawnY + 2) {
                                sceneChildren.material.color.setHex(0x0000ff);
                                coloredSquares++;

                                break;
                            }
                        }
                    }
                }
            }
        }

        for (let i = 0; i < this.scene.children.length; i++) {
            let sceneChildren = <BoardSquare>this.scene.children[i];

            if (this.scene.children[i] instanceof BoardSquare) {
                if (sceneChildren.boardX == whatWasClicked.pawnX - 1 && sceneChildren.boardY == whatWasClicked.pawnY + 1) {
                    if (this.pawns[sceneChildren.boardY][sceneChildren.boardX] == 0) {
                        sceneChildren.material.color.setHex(0x00ff00);
                    }
                }

                if (sceneChildren.boardX == whatWasClicked.pawnX + 1 && sceneChildren.boardY == whatWasClicked.pawnY + 1) {
                    if (this.pawns[sceneChildren.boardY][sceneChildren.boardX] == 0) {
                        sceneChildren.material.color.setHex(0x00ff00);
                    }
                }
            }
        }

        if (coloredSquares > 0) {
            return true;
        } else {
            return false;
        }
    }

    colorPossibleMovesForBlackQueen = (whatWasClicked: Queen) => {
        this.clearPossibleMoves();
        let coloredSquares = 0;
        //1 czarny
        //2 bialy
        //0 puste

        let startX = whatWasClicked.queenX;
        let startY = whatWasClicked.queenY;

        // //prawy dol
        let capture = false
        let stopDrawing = false
        for (let i = startX, j = startY; i <= 7 && j <= 7; i++, j++) {
            if (i != startX && j != startY && stopDrawing == false) {

                for (let k = 0; k < this.scene.children.length; k++) {
                    if (this.scene.children[k] instanceof BoardSquare) {
                        let sceneChildren = <BoardSquare>this.scene.children[k];

                        if (sceneChildren.boardX == i && sceneChildren.boardY == j) {
                            if (this.pawns[j][i] == 0) {
                                if (capture) {
                                    sceneChildren.material.color.setHex(0x0000ff);
                                } else {
                                    sceneChildren.material.color.setHex(0x00ff00);
                                }

                                coloredSquares++;
                            } else if (this.pawns[j][i] == 1) {
                                stopDrawing = true
                            } else if (capture == false) {
                                capture = true;
                            } else if (capture == true) {
                                stopDrawing = true;
                            }
                        }
                    }
                }
            }

        }

        // //prawa gora
        capture = false
        stopDrawing = false

        for (let i = startX, j = startY; i <= 7 && j >= 0; i++, j--) {
            if (i != startX && j != startY && stopDrawing == false) {
                for (let k = 0; k < this.scene.children.length; k++) {
                    if (this.scene.children[k] instanceof BoardSquare) {
                        let sceneChildren = <BoardSquare>this.scene.children[k];

                        if (sceneChildren.boardX == i && sceneChildren.boardY == j) {
                            if (this.pawns[j][i] == 0) {
                                if (capture) {
                                    sceneChildren.material.color.setHex(0x0000ff);
                                } else {
                                    sceneChildren.material.color.setHex(0x00ff00);
                                }

                                coloredSquares++;
                            } else if (this.pawns[j][i] == 1) {
                                stopDrawing = true
                            } else if (capture == false) {
                                capture = true;
                            } else if (capture == true) {
                                stopDrawing = true;
                            }
                        }
                    }
                }
            }

        }

        // //lewy dol
        capture = false
        stopDrawing = false

        for (let i = startX, j = startY; i >= 0 && j <= 7; i--, j++) {
            if (i != startX && j != startY && stopDrawing == false) {
                for (let k = 0; k < this.scene.children.length; k++) {
                    if (this.scene.children[k] instanceof BoardSquare) {
                        let sceneChildren = <BoardSquare>this.scene.children[k];

                        if (sceneChildren.boardX == i && sceneChildren.boardY == j) {
                            if (this.pawns[j][i] == 0) {
                                if (capture) {
                                    sceneChildren.material.color.setHex(0x0000ff);
                                } else {
                                    sceneChildren.material.color.setHex(0x00ff00);
                                }

                                coloredSquares++;
                            } else if (this.pawns[j][i] == 1) {
                                stopDrawing = true
                            } else if (capture == false) {
                                capture = true;
                            } else if (capture == true) {
                                stopDrawing = true;
                            }
                        }
                    }
                }
            }
        }

        // //lewa gora
        capture = false
        stopDrawing = false

        for (let i = startX, j = startY; i >= 0 && j >= 0; i--, j--) {
            if (i != startX && j != startY && stopDrawing == false) {
                for (let k = 0; k < this.scene.children.length; k++) {
                    if (this.scene.children[k] instanceof BoardSquare) {
                        let sceneChildren = <BoardSquare>this.scene.children[k];

                        if (sceneChildren.boardX == i && sceneChildren.boardY == j) {
                            if (this.pawns[j][i] == 0) {
                                if (capture) {
                                    sceneChildren.material.color.setHex(0x0000ff);
                                } else {
                                    sceneChildren.material.color.setHex(0x00ff00);
                                }

                                coloredSquares++;
                            } else if (this.pawns[j][i] == 1) {
                                stopDrawing = true
                            } else if (capture == false) {
                                capture = true;
                            } else if (capture == true) {
                                stopDrawing = true;
                            }
                        }
                    }
                }
            }
        }
    }

    colorPossibleMovesForWhiteQueen = (whatWasClicked: Queen) => {
        this.clearPossibleMoves();
        let coloredSquares = 0;
        //1 czarny
        //2 bialy
        //0 puste

        let startX = whatWasClicked.queenX;
        let startY = whatWasClicked.queenY;

        // //prawy dol
        let capture = false
        let stopDrawing = false
        for (let i = startX, j = startY; i <= 7 && j <= 7; i++, j++) {
            if (i != startX && j != startY && stopDrawing == false) {

                for (let k = 0; k < this.scene.children.length; k++) {
                    if (this.scene.children[k] instanceof BoardSquare) {
                        let sceneChildren = <BoardSquare>this.scene.children[k];

                        if (sceneChildren.boardX == i && sceneChildren.boardY == j) {
                            if (this.pawns[j][i] == 0) {
                                if (capture) {
                                    sceneChildren.material.color.setHex(0x0000ff);
                                } else {
                                    sceneChildren.material.color.setHex(0x00ff00);
                                }

                                coloredSquares++;
                            } else if (this.pawns[j][i] == 2) {
                                stopDrawing = true
                            } else if (capture == false) {
                                capture = true;
                            } else if (capture == true) {
                                stopDrawing = true;
                            }
                        }
                    }
                }
            }

        }

        // //prawa gora
        capture = false
        stopDrawing = false

        for (let i = startX, j = startY; i <= 7 && j >= 0; i++, j--) {
            if (i != startX && j != startY && stopDrawing == false) {
                for (let k = 0; k < this.scene.children.length; k++) {
                    if (this.scene.children[k] instanceof BoardSquare) {
                        let sceneChildren = <BoardSquare>this.scene.children[k];

                        if (sceneChildren.boardX == i && sceneChildren.boardY == j) {
                            if (this.pawns[j][i] == 0) {
                                if (capture) {
                                    sceneChildren.material.color.setHex(0x0000ff);
                                } else {
                                    sceneChildren.material.color.setHex(0x00ff00);
                                }

                                coloredSquares++;
                            } else if (this.pawns[j][i] == 2) {
                                stopDrawing = true
                            } else if (capture == false) {
                                capture = true;
                            } else if (capture == true) {
                                stopDrawing = true;
                            }
                        }
                    }
                }
            }

        }

        // //lewy dol
        capture = false
        stopDrawing = false

        for (let i = startX, j = startY; i >= 0 && j <= 7; i--, j++) {
            if (i != startX && j != startY && stopDrawing == false) {
                for (let k = 0; k < this.scene.children.length; k++) {
                    if (this.scene.children[k] instanceof BoardSquare) {
                        let sceneChildren = <BoardSquare>this.scene.children[k];

                        if (sceneChildren.boardX == i && sceneChildren.boardY == j) {
                            if (this.pawns[j][i] == 0) {
                                if (capture) {
                                    sceneChildren.material.color.setHex(0x0000ff);
                                } else {
                                    sceneChildren.material.color.setHex(0x00ff00);
                                }

                                coloredSquares++;
                            } else if (this.pawns[j][i] == 2) {
                                stopDrawing = true
                            } else if (capture == false) {
                                capture = true;
                            } else if (capture == true) {
                                stopDrawing = true;
                            }
                        }
                    }
                }
            }
        }

        // //lewa gora
        capture = false
        stopDrawing = false

        for (let i = startX, j = startY; i >= 0 && j >= 0; i--, j--) {
            if (i != startX && j != startY && stopDrawing == false) {
                for (let k = 0; k < this.scene.children.length; k++) {
                    if (this.scene.children[k] instanceof BoardSquare) {
                        let sceneChildren = <BoardSquare>this.scene.children[k];

                        if (sceneChildren.boardX == i && sceneChildren.boardY == j) {
                            if (this.pawns[j][i] == 0) {
                                if (capture) {
                                    sceneChildren.material.color.setHex(0x0000ff);
                                } else {
                                    sceneChildren.material.color.setHex(0x00ff00);
                                }

                                coloredSquares++;
                            } else if (this.pawns[j][i] == 2) {
                                stopDrawing = true
                            } else if (capture == false) {
                                capture = true;
                            } else if (capture == true) {
                                stopDrawing = true;
                            }
                        }
                    }
                }
            }
        }
    }

    checkIfBlackPawnCanEat = (whatWasClicked: Pawn) => {
        this.clearPossibleMoves();
        let coloredSquares = 0;
        //1 czarny
        //2 bialy
        //0 puste

        //lewa gora
        if (whatWasClicked.pawnY - 2 >= 0 && whatWasClicked.pawnX - 2 >= 0) {
            if (this.pawns[whatWasClicked.pawnY - 1][whatWasClicked.pawnX - 1] == 2) {
                if (this.pawns[whatWasClicked.pawnY - 2][whatWasClicked.pawnX - 2] == 0) {
                    for (let i = 0; i < this.scene.children.length; i++) {
                        let sceneChildren = <BoardSquare>this.scene.children[i];

                        if (this.scene.children[i] instanceof BoardSquare) {
                            if (sceneChildren.boardX == whatWasClicked.pawnX - 2 && sceneChildren.boardY == whatWasClicked.pawnY - 2) {
                                sceneChildren.material.color.setHex(0x0000ff);
                                coloredSquares++;

                                break;
                            }
                        }
                    }
                }
            }
        }
        //prawa gora
        if (whatWasClicked.pawnY - 2 >= 0 && whatWasClicked.pawnX + 2 <= 7) {
            if (this.pawns[whatWasClicked.pawnY - 1][whatWasClicked.pawnX + 1] == 2) {
                if (this.pawns[whatWasClicked.pawnY - 2][whatWasClicked.pawnX + 2] == 0) {
                    for (let i = 0; i < this.scene.children.length; i++) {
                        let sceneChildren = <BoardSquare>this.scene.children[i];

                        if (this.scene.children[i] instanceof BoardSquare) {
                            if (sceneChildren.boardX == whatWasClicked.pawnX + 2 && sceneChildren.boardY == whatWasClicked.pawnY - 2) {
                                sceneChildren.material.color.setHex(0x0000ff);
                                coloredSquares++;

                                break;
                            }
                        }
                    }
                }
            }
        }
        //lewa dol
        if (whatWasClicked.pawnY + 2 <= 7 && whatWasClicked.pawnX - 2 >= 0) {
            if (this.pawns[whatWasClicked.pawnY + 1][whatWasClicked.pawnX - 1] == 2) {
                if (this.pawns[whatWasClicked.pawnY + 2][whatWasClicked.pawnX - 2] == 0) {
                    for (let i = 0; i < this.scene.children.length; i++) {
                        let sceneChildren = <BoardSquare>this.scene.children[i];

                        if (this.scene.children[i] instanceof BoardSquare) {
                            if (sceneChildren.boardX == whatWasClicked.pawnX - 2 && sceneChildren.boardY == whatWasClicked.pawnY + 2) {
                                sceneChildren.material.color.setHex(0x0000ff);
                                coloredSquares++;

                                break;
                            }
                        }
                    }
                }
            }
        }
        //prawa dol
        if (whatWasClicked.pawnY + 2 <= 7 && whatWasClicked.pawnX + 2 <= 7) {
            if (this.pawns[whatWasClicked.pawnY + 1][whatWasClicked.pawnX + 1] == 2) {
                if (this.pawns[whatWasClicked.pawnY + 2][whatWasClicked.pawnX + 2] == 0) {
                    for (let i = 0; i < this.scene.children.length; i++) {
                        let sceneChildren = <BoardSquare>this.scene.children[i];

                        if (this.scene.children[i] instanceof BoardSquare) {
                            if (sceneChildren.boardX == whatWasClicked.pawnX + 2 && sceneChildren.boardY == whatWasClicked.pawnY + 2) {
                                sceneChildren.material.color.setHex(0x0000ff);
                                coloredSquares++;

                                break;
                            }
                        }
                    }
                }
            }
        }

        if (coloredSquares > 0) {
            return true;
        } else {
            return false;
        }
    }

    checkIfWhitePawnCanEat = (whatWasClicked: Pawn) => {
        this.clearPossibleMoves();
        let coloredSquares = 0;
        //1 czarny
        //2 bialy
        //0 puste

        //lewa gora
        if (whatWasClicked.pawnY - 2 >= 0 && whatWasClicked.pawnX - 2 >= 0) {
            if (this.pawns[whatWasClicked.pawnY - 1][whatWasClicked.pawnX - 1] == 1) {
                if (this.pawns[whatWasClicked.pawnY - 2][whatWasClicked.pawnX - 2] == 0) {
                    for (let i = 0; i < this.scene.children.length; i++) {
                        let sceneChildren = <BoardSquare>this.scene.children[i];

                        if (this.scene.children[i] instanceof BoardSquare) {
                            if (sceneChildren.boardX == whatWasClicked.pawnX - 2 && sceneChildren.boardY == whatWasClicked.pawnY - 2) {
                                sceneChildren.material.color.setHex(0x0000ff);
                                coloredSquares++;

                                break;
                            }
                        }
                    }
                }
            }
        }
        //prawa gora
        if (whatWasClicked.pawnY - 2 >= 0 && whatWasClicked.pawnX + 2 <= 7) {
            if (this.pawns[whatWasClicked.pawnY - 1][whatWasClicked.pawnX + 1] == 1) {
                if (this.pawns[whatWasClicked.pawnY - 2][whatWasClicked.pawnX + 2] == 0) {
                    for (let i = 0; i < this.scene.children.length; i++) {
                        let sceneChildren = <BoardSquare>this.scene.children[i];

                        if (this.scene.children[i] instanceof BoardSquare) {
                            if (sceneChildren.boardX == whatWasClicked.pawnX + 2 && sceneChildren.boardY == whatWasClicked.pawnY - 2) {
                                sceneChildren.material.color.setHex(0x0000ff);
                                coloredSquares++;

                                break;
                            }
                        }
                    }
                }
            }
        }
        //lewa dol
        if (whatWasClicked.pawnY + 2 <= 7 && whatWasClicked.pawnX - 2 >= 0) {
            if (this.pawns[whatWasClicked.pawnY + 1][whatWasClicked.pawnX - 1] == 1) {
                if (this.pawns[whatWasClicked.pawnY + 2][whatWasClicked.pawnX - 2] == 0) {
                    for (let i = 0; i < this.scene.children.length; i++) {
                        let sceneChildren = <BoardSquare>this.scene.children[i];

                        if (this.scene.children[i] instanceof BoardSquare) {
                            if (sceneChildren.boardX == whatWasClicked.pawnX - 2 && sceneChildren.boardY == whatWasClicked.pawnY + 2) {
                                sceneChildren.material.color.setHex(0x0000ff);
                                coloredSquares++;

                                break;
                            }
                        }
                    }
                }
            }
        }
        //prawa dol
        if (whatWasClicked.pawnY + 2 <= 7 && whatWasClicked.pawnX + 2 <= 7) {
            if (this.pawns[whatWasClicked.pawnY + 1][whatWasClicked.pawnX + 1] == 1) {
                if (this.pawns[whatWasClicked.pawnY + 2][whatWasClicked.pawnX + 2] == 0) {
                    for (let i = 0; i < this.scene.children.length; i++) {
                        let sceneChildren = <BoardSquare>this.scene.children[i];

                        if (this.scene.children[i] instanceof BoardSquare) {
                            if (sceneChildren.boardX == whatWasClicked.pawnX + 2 && sceneChildren.boardY == whatWasClicked.pawnY + 2) {
                                sceneChildren.material.color.setHex(0x0000ff);
                                coloredSquares++;

                                break;
                            }
                        }
                    }
                }
            }
        }

        if (coloredSquares > 0) {
            return true;
        } else {
            return false;
        }
    }

    clearPossibleMoves = () => {
        for (let i = 0; i < this.scene.children.length; i++) {
            if (this.scene.children[i] instanceof BoardSquare) {
                let sceneChildren = <BoardSquare>this.scene.children[i];
                sceneChildren.material.color.setHex(0xffffff);
            }
        }
    }

    removePawn = (x: number, y: number) => {
        //console.log("removePawn");

        for (let i = 0; i < this.scene.children.length; i++) {
            if (this.scene.children[i] instanceof Pawn) {
                let sceneChildren = <Pawn>this.scene.children[i];

                if (sceneChildren.pawnX == x && sceneChildren.pawnY == y) {
                    this.pawns[y][x] = 0;
                    this.scene.remove(sceneChildren);

                    break;
                }
            } else if (this.scene.children[i] instanceof Queen) {
                let sceneChildren = <Queen>this.scene.children[i];

                if (sceneChildren.queenX == x && sceneChildren.queenY == y) {
                    this.pawns[y][x] = 0;
                    this.scene.remove(sceneChildren);

                    break;
                }
            }
        }
    }

    moveEnemyPawn = (pawnX: number, pawnY: number, boardX: number, boardY: number, pawns: number[][]) => {
        this.pawns = pawns;
        let pawnToMove: Pawn | Queen;
        let whereToMove: BoardSquare;

        for (let i = 0; i < this.scene.children.length; i++) {
            if (this.scene.children[i] instanceof Pawn) {
                let sceneChildren = <Pawn>this.scene.children[i];
                if (sceneChildren.pawnX == pawnX && sceneChildren.pawnY == pawnY) {
                    pawnToMove = sceneChildren;

                    break;
                }
            } else if (this.scene.children[i] instanceof Queen) {
                let sceneChildren = <Queen>this.scene.children[i];
                if (sceneChildren.queenX == pawnX && sceneChildren.queenY == pawnY) {
                    pawnToMove = sceneChildren;

                    break;
                }
            }
        }
        for (let i = 0; i < this.scene.children.length; i++) {
            if (this.scene.children[i] instanceof BoardSquare) {
                let sceneChildren = <BoardSquare>this.scene.children[i];
                if (sceneChildren.boardX == boardX && sceneChildren.boardY == boardY) {
                    whereToMove = sceneChildren;

                    break;
                }
            }
        }

        new Tween.Tween(pawnToMove!.position)
            .to({ x: whereToMove!.position.x, z: whereToMove!.position.z }, 500)
            .easing(Tween.Easing.Circular.Out)
            .start()

        if (pawnToMove! instanceof Pawn) {
            pawnToMove!.pawnX = whereToMove!.boardX;
            pawnToMove!.pawnY = whereToMove!.boardY;
        } else if (pawnToMove! instanceof Queen) {
            pawnToMove!.queenX = whereToMove!.boardX;
            pawnToMove!.queenY = whereToMove!.boardY;
        }
    }

    captureEnemyPawn = (pawnX: number, pawnY: number, boardX: number, boardY: number, pawns: number[][], removeX: number, removeY: number) => {
        this.pawns = pawns;
        let pawnToMove: Pawn | Queen;
        let whereToMove: BoardSquare;

        for (let i = 0; i < this.scene.children.length; i++) {
            if (this.scene.children[i] instanceof Pawn) {
                let sceneChildren = <Pawn>this.scene.children[i];
                if (sceneChildren.pawnX == pawnX && sceneChildren.pawnY == pawnY) {
                    pawnToMove = sceneChildren;

                    break;
                }
            } else if (this.scene.children[i] instanceof Queen) {
                let sceneChildren = <Queen>this.scene.children[i];
                if (sceneChildren.queenX == pawnX && sceneChildren.queenY == pawnY) {
                    pawnToMove = sceneChildren;

                    break;
                }
            }
        }
        for (let i = 0; i < this.scene.children.length; i++) {
            if (this.scene.children[i] instanceof BoardSquare) {
                let sceneChildren = <BoardSquare>this.scene.children[i];
                if (sceneChildren.boardX == boardX && sceneChildren.boardY == boardY) {
                    whereToMove = sceneChildren;

                    break;
                }
            }
        }
        //console.log("moveEnemyPawn");

        new Tween.Tween(pawnToMove!.position)
            .to({ x: whereToMove!.position.x, z: whereToMove!.position.z }, 500)
            .easing(Tween.Easing.Circular.Out)
            .start()

        if (pawnToMove! instanceof Pawn) {

            pawnToMove!.pawnX = whereToMove!.boardX;
            pawnToMove!.pawnY = whereToMove!.boardY;
        } else if (pawnToMove! instanceof Queen) {
            pawnToMove!.queenX = whereToMove!.boardX;
            pawnToMove!.queenY = whereToMove!.boardY;
        }

        this.removePawn(removeX, removeY);
    }

    changeTurn = (bool: boolean) => {
        console.log(this.pawns);
        console.log("changeTurn", this.yourTurn);

        this.checkForPromotion();
        this.yourTurn = bool;

        return;
    }
}