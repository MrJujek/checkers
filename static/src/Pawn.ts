import * as THREE from 'three'

export default class Pawn extends THREE.Mesh {
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