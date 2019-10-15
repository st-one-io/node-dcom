// @ts-check
const UUID = require('../rpc/core/uuid.js');

/**
 * Represents a Class ID object. Class IDS are unique identifier used on Windows
 * environements to identify each application.
 */
class Clsid {
  /**
   *
   * @param {String} uuid
   */
  constructor(uuid) {
    if (!this.checkSyntax(uuid)) throw new Error('Invalid Clsid Syntax');
    this.nestedUUID = new UUID(uuid);
    this.autoRegister = false;
  }

  /**
   *
   * @param {Boolean} autoRegister
   */
  setAutoRegistration(autoRegister) {
    this.autoRegister = autoRegister;
  }

  /**
   * @return {Boolean}
   */
  isAutoRegistrationSet() {
    return this.autoRegister;
  }

  /**
   * @param {String} uuid
   * @return {Clsid}
   */
  valueOf(uuid) {
    if (uuid == null) {
      return null;
    }
    return new Clsid(uuid);
  }

  /**
   * @return {String}
   */
  getClsid() {
    return this.nestedUUID.toString();
  }

  /**
   * Verifies if the current CLSID (string) has the appropriate syntax
   * @param {Clsid} clsid
   * @return {Boolean}
   */
  checkSyntax(clsid) {
    const exp = new RegExp('[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}');
    return clsid.match(exp);
  }
}

module.exports = Clsid;
