import * as THREE from 'three'

export default class Queen extends THREE.Mesh {
    geometry: THREE.CylinderGeometry
    material: THREE.MeshBasicMaterial
    player: string
    what: string
    queenX: number
    queenY: number

    constructor(color: string, size: number, i: number, j: number) {
        super()
        const white = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: new THREE.TextureLoader().load('mats/q-bialy.jpg') });
        const black = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: new THREE.TextureLoader().load('mats/q-czarny.jpg') });

        this.geometry = new THREE.CylinderGeometry(size / 2, size / 2, 20, 20);
        this.player = color
        this.what = "Queen"
        this.queenX = j
        this.queenY = i

        if (color == "white") {
            this.material = white
        } else {
            this.material = black
        }
    }
}