// @ts-check
const ConnectionOrientedPdu = require('../connectionorientedpdu.js');

/**
 * This class represents a basic dcerpc authentication packet
 */
class Auth3Pdu extends ConnectionOrientedPdu {
  /**
   * This constructor only sets the type variable and the callid
   */
  constructor() {
    super();
    this.type = 0x10;
    this.setCallId(0);
  }

  /**
   * @return {Number}
   */
  getType() {
    return this.type;
  }

  /**
   *
   * @param {NetworkDataRepresentation} ndr
   */
  writeBody(ndr) {
    ndr.writeUnsignedLong(0);
  }
}

Auth3Pdu.AUTH3_TYPE = 0x10;
module.exports = Auth3Pdu;
