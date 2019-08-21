const ConnectionOrientedPdu = require("../connectionorientedpdu.js");

class OrphanedPdu extends ConnectionOrientedPdu {
  constructor(){
    super();
    this.ORPHANED_TYPE = 0x13;
  }

  /**
   * @returns {Number}
   */
  getType(){
    return this.ORPHANED_TYPE;
  }
}

module.exports = OrphanedPdu;
