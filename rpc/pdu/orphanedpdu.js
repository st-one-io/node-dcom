var ConnectionOrientedPdu = require("../connectionorientedpdu.js");

class OrphanedPdu extends ConnectionOrientedPdu {
  constructor(){
    this.ORPHANED_TYPE = 0x13;
  }

  get type(){
    return this.ORPHANED_TYPE;
  }
}

module.exports = OrphanedPdu;
