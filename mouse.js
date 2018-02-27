const robot = require('robotjs');

class Mouse {
  constructor() {
    this.screenSize = this.getScreenSize();

    this.maxXdelta = 600;
    this.maxYdelta = 600;
    this.maxXspd = 1800;
    this.maxYspd = 1600;
    this.moveThreshold = 0.01;

    this.setCursorPosition(this.screenSize.width / 2 - 10, this.screenSize.height / 2 - 10);

    robot.setMouseDelay(2);
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
    
    robot.moveMouse(x, y);
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

    const goTo = [
      currPos.x - this.maxXspd * xRelative,
      currPos.y - this.maxYspd * yRelative,
    ];

    const diffStep = [
      (goTo[0] - currPos.x) / 5,
      (goTo[1] - currPos.y) / 5,
    ];

    for (let i = 0; i < 5; i++) {
      this.setCursorPosition(currPos.x + diffStep[0], currPos.y + diffStep[1]);
    }
  }

  processButtonPress(status, button = 'left') {
    if (!['left', 'right', 'middle'].includes(button)) {
      throw new Error(`Invalid button specified: ${button}`);
    }
    robot.mouseToggle(status, button);
  }

  processScroll(dir) {
    const dirMulti = dir === 'up' ? 1 : -1;
    robot.scrollMouse(dirMulti * 1, 0);
  }
}
module.exports = new Mouse();
