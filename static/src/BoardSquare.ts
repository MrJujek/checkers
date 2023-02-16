import * as THREE from 'three'

export default class BoardSquare extends THREE.Mesh {
    geometry: THREE.BoxGeometry
    material: THREE.MeshBasicMaterial
    squareColor: string
    what: string
    boardX: number
    boardY: number

    constructor(color: string, size: number, i: number, j: number, lightMaterial: THREE.MeshBasicMaterial, darkMaterial: THREE.MeshBasicMaterial) {
        super()
        
        this.geometry = new THREE.BoxGeometry(size, 5, size);
        this.squareColor = color
        this.what = "BoardSquare"
        this.boardX = j
        this.boardY = i

        if (color == "light") {
            this.material = lightMaterial
        } else {
            this.material = darkMaterial
        }
    }
}