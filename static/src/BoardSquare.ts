import * as THREE from 'three'

export default class BoardSquare extends THREE.Mesh {
    geometry: THREE.BoxGeometry
    material: THREE.MeshBasicMaterial
    squareColor: string
    what: string
    boardX: number
    boardY: number

    constructor(color: string, size: number, i: number, j: number) {
        super()
        const lightMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: new THREE.TextureLoader().load('mats/light.jpg') });
        const darkMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: new THREE.TextureLoader().load('mats/dark.jpg') });

        this.geometry = new THREE.BoxGeometry(size, 5, size);
        this.squareColor = color
        this.what = "BoardSquare"
        this.boardX = i
        this.boardY = j

        if (color == "light") {
            this.material = lightMaterial
        } else {
            this.material = darkMaterial
        }
    }
}