const ConnectionOrientedPdu = require("../connectionorientedpdu.js");

class OrphanedPdu extends ConnectionOrientedPdu {
  constructor(){
    super();
  }

  /**
   * @returns {Number}
   */
  getType(){
    return this.ORPHANED_TYPE;
  }
}

OrphanedPdu.ORPHANED_TYPE = 0x13;
module.exports = OrphanedPdu;
