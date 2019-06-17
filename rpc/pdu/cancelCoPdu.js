var ConnectionOrientedPdu = require("../connectionorientedpdu.js");

class CancelCoPdu extends ConnectionOrientedPdu{
  constructor(){
    this.CANCEL_TYPE = 0x12;
  }

  get type(){
    return this.CANCEL_TYPE;
  }
}

module.exports = CancelCoPdu;
