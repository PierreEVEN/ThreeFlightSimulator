export {SaveGame}

const saveGames = [];

class SaveGame {
    constructor(targetController) {
        saveGames.push(this);

        this.plane = targetController.plane;
        this.controller = targetController;

        this.load();
    }

    save() {
        let flags = ";Secure";
        document.cookie = "planePositionX=" + this.plane.position.x + flags;
        document.cookie = "planePositionY=" + this.plane.position.y + flags;
        document.cookie = "planePositionZ=" + this.plane.position.z + flags;
        document.cookie = "planeRotationX=" + this.plane.rotation.x + flags;
        document.cookie = "planeRotationY=" + this.plane.rotation.y + flags;
        document.cookie = "planeRotationZ=" + this.plane.rotation.z + flags;
        document.cookie = "planeRotationW=" + this.plane.rotation.w + flags;
        document.cookie = "planeVelocityX=" + this.plane.velocity.x + flags;
        document.cookie = "planeVelocityY=" + this.plane.velocity.y + flags;
        document.cookie = "planeVelocityZ=" + this.plane.velocity.z + flags;
        document.cookie = "isPaused=" + this.plane.pause + flags;
        document.cookie = "cameraPitch=" + this.controller.pitch + flags;
        document.cookie = "cameraYaw=" + this.controller.yaw + flags;
        document.cookie = "isFps=" + this.controller.isFPS + flags;
    }

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    load() {
        if (this.getCookie('planePositionX')) this.plane.position.x = parseFloat(this.getCookie('planePositionX'));
        if (this.getCookie('planePositionY')) this.plane.position.y = parseFloat(this.getCookie('planePositionY'));
        if (this.getCookie('planePositionZ')) this.plane.position.z = parseFloat(this.getCookie('planePositionZ'));
        if (this.getCookie('planeRotationX')) this.plane.rotation.x = parseFloat(this.getCookie('planeRotationX'));
        if (this.getCookie('planeRotationY')) this.plane.rotation.y = parseFloat(this.getCookie('planeRotationY'));
        if (this.getCookie('planeRotationZ')) this.plane.rotation.z = parseFloat(this.getCookie('planeRotationZ'));
        if (this.getCookie('planeRotationW')) this.plane.rotation.w = parseFloat(this.getCookie('planeRotationW'));
        if (this.getCookie('planeVelocityX')) this.plane.velocity.x = parseFloat(this.getCookie('planeVelocityX'));
        if (this.getCookie('planeVelocityY')) this.plane.velocity.y = parseFloat(this.getCookie('planeVelocityY'));
        if (this.getCookie('planeVelocityZ')) this.plane.velocity.z = parseFloat(this.getCookie('planeVelocityZ'));
        if (this.getCookie('cameraPitch')) this.controller.pitch = parseFloat(this.getCookie('cameraPitch'));
        if (this.getCookie('cameraYaw')) this.controller.yaw = parseFloat(this.getCookie('cameraYaw'));
        if (this.getCookie('isFps')) this.controller.isFPS = this.getCookie('isFps') === 'true';
        if (this.getCookie('isPaused')) this.plane.pause = this.getCookie('isPaused') === 'true';
    }
}

window.onbeforeunload = function (event) {
    for (let item of saveGames) {
        item.save();
    }
}