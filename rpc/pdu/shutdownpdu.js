var ConnectionOrientedPdu = require("../connectionorientedpdu.js");

class ShutdownPdu extends ConnectionOrientedPdu {
  constructor(){
    super();
    this.SHUTDOWN_TYPE = 0x11;
  }

  getType(){
    return this.SHUTDOWN_TYPE;
  }
}

module.exports = ShutdownPdu;
