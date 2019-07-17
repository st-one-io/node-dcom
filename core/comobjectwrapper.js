var Unreferenced = require('../common/unreferenced.js');
var ComObject = require('./comobject.js');

class ComObjectWrapper extends ComObject
{
  constructor(comObject)
  {
    this.serialVersionUID = "6142976024482507753L";
    this.comObject = comObject;
  }

  queryInterface(iid)
  {
    return this.comObject.queryInterface(iid);
  }

  addRef()
  {
    this.comObject.addRef();
  }

  release(){
    this.comObject.release();
  }

  getIpid()
  {
    this.comObject.getIPid();
  }

  call(obj)
  {
    return this.comObject.call(obj):
  }

  internal_getInterfacePointer()
  {
    return this.comObject.internal_getInterfacePointer();
  }

  get associatedSession()
  {
    return this.comObject.associatedSession();
  }

  get interfaceIdentifier()
  {
    return this.comObject.getInterfaceIdentifier();
  }

  isDispatchSupported()
  {
    return this.comObject.isDispatchSupported();
  }

  internal_setConnectionInfo(connectionPoint, cookie)
  {
    return this.comObject.internal_setConnectionInfo(connectionPoint, cookie);
  }

  internal_getConnectionInfo(identifier)
  {
    return this.comObject.internal_getConnectionInfo(identifier);
  }

  internal_removeConnectionInfo(identifier)
  {
    return this.comObject.internal_removeConnectionInfo(identifier);
  }

  get unreferencedHandler()
  {
    return this.comObject.unreferencedHandler();
  }

  registerUnreferencedHandler(unreferenced)
  {
    this.comObject.registerUnreferencedHandler(unreferenced);
  }

  unregisterUnreferencedHandler()
  {
    this.comObject.unregisterUnreferencedHandler();
  }

  call(obj, timeout)
  {
    return this.comObject.call(obj, timeout);
  }

  get instanceLevelSocketTimeout()
  {
    return this.comObject.instanceLevelSocketTimeout();
  }

  set instanceLevelSocketTimeout(timeout)
  {
    this.comObject.instanceLevelSocketTimeout(timeout);
  }

  internal_setDeffered(deffered)
  {
    this.comObject.internal_setDeffered(deffered);
  }

  islocalReference()
  {
    return this.comObject.islocalReference();
  }

  toString()
  {
    return this.comObject.toString();
  }

  get customObject()
  {
    return this.comObject.customObject();
  }

  get lengthOfInterfacePointer()
  {
    return this.comObject.lengthOfInterfacePointer();
  }
}

module.exports = ComObjectWrapper;
