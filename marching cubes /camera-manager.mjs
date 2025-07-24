// /scripts/camera-manager.mjs
import { Script } from "playcanvas";
import { CameraService } from "../@viverse/create-sdk.mjs";

export class CameraManager extends Script {
  initialize() {
    this.cameraService = new CameraService();
    // Primera persona = índice 0
    this.cameraService.switchPov(0);
    // Opcional: bloquear cambios de POV
    this.cameraService.canSwitchPov = false;
    // Opcional: bloquear giro/zoom si no los quieres
    // this.cameraService.canRotate = false;
    // this.cameraService.canZoom = false;
  }
}
