var ConnectionOrientedPdu = require("../connectionorientedpdu.js");

class Auth3Pdu extends ConnectionOrientedPdu {
  constructor(){
    this.AUTH3_TYPE = 0x10;
    setCallId(0);
  }

  get type(){
    return this.AUTH3_TYPE;
  }

  writeBody(ndr){
    ndr.writeUnsignedLong(0);
  }
}

module.exports = Auth3Pdu;
