var UUID = require('../rpc/core/uuid.js');
var NdrObject = require('../ndr/ndrobject.js');

class RemoteSCMActivator extends NdrObject
{
  constructor(targetServer, clsid){
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

  isActivationSuccessful()
  {
    return this.isActivationSuccessful;
  }

  getDualStringArrayForOxid()
  {
    return this.dualStringArrayForOxid;
  }
}

module.exports = RemoteSCMActivator;
