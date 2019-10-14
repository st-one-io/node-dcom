const UUID = require('../rpc/core/uuid.js');
const NdrObject = require('../ndr/ndrobject.js');

/**
 * Alternative method of activating a server interface.
 */
class RemoteSCMActivator extends NdrObject {
  /**
   *
   * @param {ComServer} targetServer
   * @param {Clsid} clsid
   */
  constructor(targetServer, clsid) {
    super();
    this.targetClsid = clsid;
    this.targetServer = targetServer;
    this.oxid = null;
    this.dualStringArrayForOxid = null;
    this.ipid = null;
    this.authenticationHint = -1;
    this.comVersion = null;
    this.mInterfacePointer = null;
    this.isDual = false;
    this.dispIpid = null;
    this.dispRefs = 5;
    this.dispOid = null;
    this.isActivationSuccessful = false;
  }

  /**
   * @return {Boolean}
   */
  isActivationSuccessful() {
    return this.isActivationSuccessful;
  }

  /**
   * @return {DualStringArrayForOxid}
   */
  getDualStringArrayForOxid() {
    return this.dualStringArrayForOxid;
  }
}

module.exports = RemoteSCMActivator;
