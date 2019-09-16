// @ts-check

/**
 * Oxid class
 */
class Oxid {
  /**
   *
   * @param {String} oxid
   */
  constructor(oxid) {
    this.serialVersionUID ='3456725801334190150L';
    this.oxid = (oxid == undefined) ? null : oxid;
  }

  /**
   * @return {String}
   */
  getOXID() {
    return this.oxid;
  }

  /**
   * @return {Number}
   */
  hashCode() {
    let result = 1;
    for (let i = 0; i < this.oxid.length; i++) {
      result = 31 * result + this.oxid[i];
    }
    return result;
  }

  /**
   * @param {Object} obj
   * @return {Object}
   */
  equals(obj) {
    if (!obj instanceof Oxid) {
      return false;
    }
    let tmp = obj.getOXID();
    for (let i = 0; i < this.oxid.length; i++) {
      if (this.oxid[i] != tmp[i]) {
        return false;
      }
    }
    return true;
  }
}

module.exports = Oxid;
