var ConnectionOrientedPdu = require("../connectionorientedpdu.js");

class OrphanedPdu extends ConnectionOrientedPdu {
  constructor(){
    super();
    this.ORPHANED_TYPE = 0x13;
  }

  getType(){
    return this.ORPHANED_TYPE;
  }
}

module.exports = OrphanedPdu;
