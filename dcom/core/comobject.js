
// TODO: documentation
class ComObject {
  constructor()
  {
      this.IID = "00000000-0000-0000-c000-000000000046";
  }

  queryInterface(iid){};

  addRef(){};

  release(){};

  getIPid(){};

  call(obj, int, timeout){};

  setInstanceLevelSocketTimeout(timeout){};

  getInstanceLevelSocketTimeout(timeout){};

  internal_getInterfacePointer(){};

  getAssociatedSession(){};

  getInterfaceIdentifier(){};

  isDispatchSupported(){};

  internal_setConnectionInfo(connectionPointer, cookie){};

  internal_getConnectionInfo(identifier){};

  internal_removeConnectionInfo(identifier){};

  registerUnreferencedHandler(unreferenced){};

  getUnreferencedHandler(){};

  unregisterUnreferencedHandler(){};

  internal_setDeffered(deffered){};

  islocalReference(){};

  getCustomObject(){};

  getLengthOfInterfacePointer(){};
}

module.exports = ComObject;
