var ConnectionOrientedPdu = require("../connectionorientedpdu.js");

class CancelCoPdu extends ConnectionOrientedPdu{
  constructor(){
    super();
    this.CANCEL_TYPE = 0x12;
  }

  getType(){
    return this.CANCEL_TYPE;
  }
}

module.exports = CancelCoPdu;
