export {PlaneDebugUI}
import {GUI} from "../threejs/examples/jsm/libs/dat.gui.module.js";


class PlaneDebugUI {
    constructor(planeController) {
        this.controller = planeController;

        this.planeInformations = {
            velocity: 0,
            velx: 0,
            vely: 0,
            velz: 0,
            velrelx: 0,
            velrely: 0,
            velrelz: 0,
        };

        this.gui = new GUI();
        let velocity = this.gui.addFolder('absolute velocity');
        velocity.add(this.planeInformations, 'velocity', 0, 300).name('speed').listen();
        velocity.add(this.planeInformations, 'velx', -300, 300).name('X').listen();
        velocity.add(this.planeInformations, 'vely', -300, 300).name('Y').listen();
        velocity.add(this.planeInformations, 'velz', -300, 300).name('Z').listen();
        velocity.open();
        let Relvelocity = this.gui.addFolder('relative velocity');
        Relvelocity.add(this.planeInformations, 'velrelx', -50, 300).name('X').listen();
        Relvelocity.add(this.planeInformations, 'velrely', -50, 300).name('Y').listen();
        Relvelocity.add(this.planeInformations, 'velrelz', -50, 300).name('Z').listen();
        Relvelocity.open();
        let inputs = this.gui.addFolder('Inputs');
        inputs.add(this.controller.plane, 'rollInput', -1.0, 1.0).name('Roll').listen();
        inputs.add(this.controller.plane, 'pitchInput', -1.0, 1.0).name('Pitch').listen();
        inputs.add(this.controller.plane, 'yawInput', -1.0, 1.0).name('Yaw').listen();
        inputs.add(this.controller.plane, 'engineInput', 0.0, 1.2).name('Throttle').listen();
        inputs.open();
        let flightState = this.gui.addFolder('Flight state');
        flightState.add(this.controller.plane, 'rightLift', -10.0, 10.0).name('Lift Y').listen();
        flightState.add(this.controller.plane, 'upLift', -50.0, 50.0).name('Lift Z').listen();
        flightState.open();

    }

    tick(deltaTime) {

        this.planeInformations.velocity = this.controller.plane.velocity.length();
        this.planeInformations.velx = this.controller.plane.velocity.x;
        this.planeInformations.vely = this.controller.plane.velocity.y;
        this.planeInformations.velz = this.controller.plane.velocity.z;
        this.planeInformations.velrelx = this.controller.plane.relativeVelocity.x;
        this.planeInformations.velrely = this.controller.plane.relativeVelocity.y;
        this.planeInformations.velrelz = this.controller.plane.relativeVelocity.z;
    }
}