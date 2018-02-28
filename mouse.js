const os = require( 'os' );
const robot = require('robotjs');

class Mouse {
  constructor() {
    this.screenSize = this.getScreenSize();

    this.maxXdelta = 600;
    this.maxYdelta = 600;
    this.maxXspd = 600;
    this.maxYspd = 400;
    this.moveThreshold = 0.015;
    this.interpolationStep = 10;

    this.setCursorPosition(this.screenSize.width / 2 - 10, this.screenSize.height / 2 - 10);

    robot.setMouseDelay(1);
  }

  getScreenSize() {
    return robot.getScreenSize();
  }

  getCursorPosition() {
    return robot.getMousePos();
  }

  setCursorPosition(x, y) {
    x = x > this.screenSize.width ? this.screenSize.width : x;
    x = x < 0 ? 0 : x;
    y = y > this.screenSize.height ? this.screenSize.height : y;
    y = y < 0 ? 0 : y;

    const currPos = this.getCursorPosition();
    const movementStep = {
      x: (x - currPos.x) / this.interpolationStep,
      y: (y - currPos.y) / this.interpolationStep,
    };

    let nextPos = {
      x: currPos.x + movementStep.x, 
      y: currPos.y + movementStep.y,
    };
    for (let i = 0; i < this.interpolationStep; i++) {
      robot.moveMouse(nextPos.x, nextPos.y);
      nextPos = {
        x: nextPos.x + movementStep.x, 
        y: nextPos.y + movementStep.y,
      };
    }
  }

  processMove(data) {
    const currPos = this.getCursorPosition();
    const xAngle = data[2];
    const yAngle = data[0];
    
    let xRelative = xAngle / this.maxXdelta;
    xRelative = (xRelative > 1 ? 1 : xRelative);
    xRelative = Math.abs(xRelative) < this.moveThreshold ? 0 : xRelative;

    let yRelative = yAngle / this.maxYdelta;
    yRelative = (yRelative > 1 ? 1 : yRelative);
    yRelative = Math.abs(yRelative) < this.moveThreshold ? 0 : yRelative;

    this.setCursorPosition(
      currPos.x - this.maxXspd * xRelative,
      currPos.y - this.maxYspd * yRelative
    );
  }

  processButtonPress(status, button = 'left') {
    if (!['left', 'right', 'middle'].includes(button)) {
      throw new Error(`Invalid button specified: ${button}`);
    }
    robot.mouseToggle(status, button);
  }

  processScroll(dir) {
    const dirMulti = dir === 'up' ? 1 : -1;

    if (os.platform() === 'win32') {
      // Bug in robot.js library, the axes are flipped on Windows
      robot.scrollMouse(dirMulti * 1, 0);
    } else {
      robot.scrollMouse(0, dirMulti * 1);
    }
  }
}
module.exports = new Mouse();
