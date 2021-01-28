export { Plane }


class Plane {

    constructor(inScene, inMesh) {
        this.scene = inScene;
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(100, 0, 0);
        this.rotation = new THREE.Quaternion();

        this.mesh = inMesh;

        this.update(0);
    }



    update(deltaTime) {
        this.position += this.velocity.multiply(deltaTime);

        this.mesh.setPosition(this.position);
        this.mesh.rotation.set(this.rotation);
    }




}