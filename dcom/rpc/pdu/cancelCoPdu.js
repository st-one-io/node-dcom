// @ts-check
const ConnectionOrientedPdu = require('../connectionorientedpdu.js');

/**
 * This class represents a Cancell dcerpc packet
 */
class CancelCoPdu extends ConnectionOrientedPdu {
  /**
   * Initializes the type variable but receive no input parameter
   */
  constructor() {
    super();
    this.type = 0x12;
  }

  /**
   * @return {Number}
   */
  getType() {
    return this.type;
  }
}

CancelCoPdu.CANCEL_TYPE = 0x12;
module.exports = CancelCoPdu;
