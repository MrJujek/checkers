import * as THREE from 'three'
import Pawn from './Pawn'
import BoardSquare from './BoardSquare'

export default class Game {
    size: number
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    raycaster: THREE.Raycaster
    mouseVector: THREE.Vector2
    board: number[][]
    pawns: number[][]

    constructor() {
        this.size = 50
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, 4 / 3, 0.1, 10000);
        this.camera.position.set(this.size * 4, 500, 500)
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor(0x4a4a4a);
        (document.getElementById("root") as HTMLDivElement).append(this.renderer.domElement);
        this.camera.lookAt(this.size * 4, 0, this.size * 4);
        this.raycaster = new THREE.Raycaster();
        this.mouseVector = new THREE.Vector2();

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
        console.log(this.pawns[1][1]);


        //this.scene.add(new THREE.AxesHelper(100))

        this.createBoard()

        this.render()
    }

    render = () => {
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
        let pawnChecked = false;
        let oldPawn: any
        window.addEventListener("mousedown", (e) => {
            this.mouseVector.x = (e.clientX / (document.getElementById("root") as HTMLDivElement).offsetWidth) * 2 - 1;
            this.mouseVector.y = -((e.clientY - 100) / (document.getElementById("root") as HTMLDivElement).offsetHeight) * 2 + 1;
            this.raycaster.setFromCamera(this.mouseVector, this.camera);

            const intersects = this.raycaster.intersectObjects(this.scene.children);
            //console.log(intersects);
            if (intersects.length > 0) {
                let whatWasClicked = (<BoardSquare | Pawn>intersects[0].object);

                //console.log(intersects[0].object.what);
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

                                this.clearPossibleMoves();
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

                                this.clearPossibleMoves();
                                this.colorPossibleMovesForBlack(whatWasClicked);
                            }
                        }
                    }
                } else {
                    console.log("pawns:", this.pawns[whatWasClicked.boardY][whatWasClicked.boardX]);

                    if (whatWasClicked.squareColor == "dark") {
                        if (pawnChecked) {
                            if (whatWasClicked.material.color.getHex() == 0x00ff00) {
                                oldPawn.position.set(whatWasClicked.position.x, 10, whatWasClicked.position.z)
                                oldPawn.material.color.setHex(0xffffff);
                                pawnChecked = false;

                                console.log("oldPawnX:", oldPawn.pawnX, "oldPawnY:", oldPawn.pawnY);
                                console.log("pawns_oldpawn", this.pawns[oldPawn.pawnY][oldPawn.pawnX]);


                                if (player == 1) {
                                    this.pawns[whatWasClicked.boardY][whatWasClicked.boardX] = 2;
                                    this.pawns[oldPawn.pawnY][oldPawn.pawnX] = 0;
                                }
                                else {
                                    this.pawns[whatWasClicked.boardY][whatWasClicked.boardX] = 1;
                                    this.pawns[oldPawn.pawnY][oldPawn.pawnX] = 0;
                                }
                                console.log(this.pawns);

                                oldPawn.pawnX = whatWasClicked.boardX;
                                oldPawn.pawnY = whatWasClicked.boardY;
                                oldPawn = undefined;

                                this.clearPossibleMoves();
                            }
                        }
                    }
                }
            }
        });
    }

    setPlayer = (player: number) => {
        if (player == 1) {
            this.camera.position.set(this.size * 4, 500, -100)
        } else {
            this.camera.position.set(this.size * 4, 500, 500)
        }
        this.checkForMovePawn(player);
    }

    colorPossibleMovesForBlack = (whatWasClicked: Pawn) => {
        let coloredSquares = 0;
        for (let i = 0; i < this.scene.children.length; i++) {
            let sceneChildren = <BoardSquare>this.scene.children[i];

            if (this.scene.children[i] instanceof BoardSquare) {
                if (sceneChildren.boardX == whatWasClicked.pawnX - 1 && sceneChildren.boardY == whatWasClicked.pawnY - 1) {
                    if (this.pawns[sceneChildren.boardY][sceneChildren.boardX] == 0) {
                        sceneChildren.material.color.setHex(0x00ff00);
                    }

                    coloredSquares++;
                }

                if (sceneChildren.boardX == whatWasClicked.pawnX + 1 && sceneChildren.boardY == whatWasClicked.pawnY - 1) {
                    if (this.pawns[sceneChildren.boardY][sceneChildren.boardX] == 0) {
                        sceneChildren.material.color.setHex(0x00ff00);
                    }

                    coloredSquares++;
                }

                if (coloredSquares >= 2) {
                    break;
                }
            }
        }
    }

    colorPossibleMovesForWhite = (whatWasClicked: Pawn) => {
        let coloredSquares = 0;
        for (let i = 0; i < this.scene.children.length; i++) {
            let sceneChildren = <BoardSquare>this.scene.children[i];

            if (this.scene.children[i] instanceof BoardSquare) {
                // do przodu w lewo
                if (sceneChildren.boardX == whatWasClicked.pawnX - 1 && sceneChildren.boardY == whatWasClicked.pawnY + 1) {
                    // pole puste
                    if (this.pawns[sceneChildren.boardY][sceneChildren.boardX] == 0) {
                        sceneChildren.material.color.setHex(0x00ff00);
                        // pole zajęte
                    }

                    coloredSquares++;
                }

                // do przodu w prawo
                if (sceneChildren.boardX == whatWasClicked.pawnX + 1 && sceneChildren.boardY == whatWasClicked.pawnY + 1) {
                    // pole puste
                    if (this.pawns[sceneChildren.boardY][sceneChildren.boardX] == 0) {
                        sceneChildren.material.color.setHex(0x00ff00);
                    }

                    coloredSquares++;
                }

                if (coloredSquares >= 2) {
                    break;
                }
            }
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
}