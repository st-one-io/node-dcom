const ConnectionOrientedPdu = require("../connectionorientedpdu.js");

class ShutdownPdu extends ConnectionOrientedPdu {
  constructor(){
    super();
  }

  /**
   * @returns {Number}
   */
  getType(){
    return this.SHUTDOWN_TYPE;
  }
}

ShutdownPdu.SHUTDOWN_TYPE = 0x11;
module.exports = ShutdownPdu;
