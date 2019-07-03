var ConnectionOrientedPdu = require("../connectionorientedpdu.js");

class Auth3Pdu extends ConnectionOrientedPdu {
  constructor(){
    super();
    this.AUTH3_TYPE = 0x10;
    this.setCallId(0);
  }

  get type(){
    return this.AUTH3_TYPE;
  }

  writeBody(ndr){
    ndr.writeUnsignedLong(0);
  }
}

module.exports = Auth3Pdu;
