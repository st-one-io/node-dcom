
// TODO: documentation
class ComObject {
  constructor()
  {
      this.IID = "00000000-0000-0000-c000-000000000046";
  }

  queryInterface(iid);

  addRef();

  release();

  getIPid();

  call(obj, int, timeout);

  set instanceLevelSocketTimeout(timeout);

  get instanceLevelSocketTimeout(timeout);

  internal_getInterfacePointer();

  get associatedSession();

  get interfaceIdentifier();

  isDispatchSupported();

  internal_setConnectionInfo(connectionPointer, cookie);

  internal_getConnectionInfo(identifier);

  internal_removeConnectionInfo(identifier);

  registerUnreferencedHandler(unreferenced);

  get unreferencedHandler();

  unregisterUnreferencedHandler();

  internal_setDeffered(deffered);

  islocalReference();

  get customObject();

  get lengthOfInterfacePointer();
}

module.exports = ComObject;
