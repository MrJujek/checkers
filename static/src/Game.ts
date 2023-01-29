import * as THREE from 'three'

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
        this.pawns = [
            [0, 2, 0, 2, 0, 2, 0, 2],
            [2, 0, 2, 0, 2, 0, 2, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 0]
        ];

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
                        }
                    }
                } else {
                    if (whatWasClicked.squareColor == "dark") {
                        if (pawnChecked) {
                            oldPawn.position.set(whatWasClicked.position.x, 10, whatWasClicked.position.z)
                            oldPawn.material.color.setHex(0xffffff);
                            pawnChecked = false;
                            if (player == 1) {
                                this.pawns[whatWasClicked.boardX][whatWasClicked.boardY] = 0;
                                this.pawns[oldPawn.pawnY][oldPawn.pawnX] = 2;
                            }
                            else {
                                this.pawns[whatWasClicked.boardX][whatWasClicked.boardY] = 0;
                                this.pawns[oldPawn.pawnY][oldPawn.pawnX] = 1;
                            }
                        }

                        console.log(this.pawns);
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
}

class BoardSquare extends THREE.Mesh {
    geometry: THREE.BoxGeometry
    material: THREE.MeshBasicMaterial
    squareColor: string
    what: string
    boardX: number
    boardY: number

    constructor(color: string, size: number, i: number, j: number) {
        super()
        const jasne = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: new THREE.TextureLoader().load('mats/light.jpg') });
        const ciemne = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: new THREE.TextureLoader().load('mats/dark.jfif') });

        this.geometry = new THREE.BoxGeometry(size, 5, size);
        this.squareColor = color
        this.what = "BoardSquare"
        this.boardX = j
        this.boardY = i

        if (color == "light") {
            this.material = jasne
        } else {
            this.material = ciemne
        }
    }
}

class Pawn extends THREE.Mesh {
    geometry: THREE.CylinderGeometry
    material: THREE.MeshBasicMaterial
    player: string
    what: string
    pawnX: number
    pawnY: number

    constructor(color: string, size: number, i: number, j: number) {
        super()
        const white = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: new THREE.TextureLoader().load('mats/bialy.jpg') });
        const black = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: new THREE.TextureLoader().load('mats/czarny.jpg') });

        this.geometry = new THREE.CylinderGeometry(size / 2, size / 2, 10, 20);
        this.player = color
        this.what = "Pawn"
        this.pawnX = j
        this.pawnY = i

        if (color == "white") {
            this.material = white
        } else {
            this.material = black
        }
    }
}