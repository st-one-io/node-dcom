var HashMap = require('hashmap');
var Unreferenced = require('../common/unreferenced.js');
var ErroCodes = require('../common/errorcodes.js');
var System = require('../common/system.js');
var ComObject = require('./comobject.js');

class ComObjectImpl extends ComObject
{
  constructor(session, ptr, isLocal)
  {
    this.serialVersionUID =  "-1661750453596032089L";

    this.isDual = false;
    this.dualInfo = false;
    this.session = session;
    this.ptr = ptr;
    this.connectionPointInfo = null;
    this.timeout = 0;
    this.isLocal = (isLocal == undefined) ? false : isLocal;;

    this.customObject = null;
  }

  replaceMember(comObject)
  {
    this.session = comObject.getAssociatedSession();
    this.ptr = comObject.internal_getInterfacePointer();
  }

  checkLocal()
  {
    if (session == null) {
      throw new Error(ErroCodes.SESSION_NOT_ATTACHED);
    }

    if (this.isLocalReference()) {
      throw new Error(ErroCodes.E_NOTIMPL);
    }
  }

  queryInterface(iid)
  {
    this.checkLocal();
    return session.getStub()getInterface(iid, this.ptr.getIPID());
  }

  addRef()
  {
    this.checkLocal();
    var obj = new CallBuilder(true);
    obj.setParentIpid(this.ptr.getIPID());
    obj.setOpnum(1);

    obj.addInParamAsShort(1, Flags.FLAG_NULL);

    var array = new IArray([UUID(this.ptr.getIPID())], true);
    obj.addInParamAsArray(array, Flags.FLAG_NULL);
    // TODO: build caching mechanism to exhausts 5 refs before asking for more
    obj.addInParamAsInt(5, Flags.FLAG_NULL);
    obj.addInParamAsInt(0, Flags.FLAG_NULL);

    obj.addOutParamAsType(Number, Flags.FLAG_NULL);
    obj.addOutParamAsType(Number, Flags.FLAG_NULL);

    session.debug_addIpids(this.ptr.getIPID(), 5);
    session.addRef_ReleaseRef(this.ptr.getIPID(), obj, 5);

    if (obj.getResultAsIntAt(1) != 0) {
      throw new Error("Exception:" + String(obj.getResultAsIntAt(1)));
    }
  }

  release()
  {
    this.checkLocal();
    var obj = new CallBuilder(true);
    obj.setParentIpid(this.ptr.getIPID());
    obj.setOpnum(2);

    obj.addInParamAsShort(1, Flags.FLAG_NULL);

    var array = new IArray([new UUID(this.ptr.getIPID())], true);
    obj.addInParamAsArray(array, Flags.FLAG_NULL);

    obj.addInParamAsInt(5,Flags.FLAG_NULL);
    obj.addInParamAsInt(0,Flags.FLAG_NULL);

    this.session.addRef_ReleaseRef(this.ptr.getIPID, obj, -5);
  }

  call(obj)
  {
    this.checkLocal();
    return call(obj, this.timeout);
  }

  internal_getInterfacePointer(){
    return (this.ptr == null) ? this.session.getStub().getServerInterfacePointer() : this.ptr;
  }

  getIpid()
  {
    return this.ptr.getIPID();
  }

  equals(obj)
  {
    if (!(obj instanceof ComObjectImpl)) {
      return false;
    }

    return (this.ptr.getIPID().equalsIgnoreCase(obj.getIpid()));
  }

  hashCode()
  {
    return this.ptr.getIPID().hashCode();
  }

  getAssociatedSession()
  {
    return this.session;
  }

  getInterfaceIdentifier()
  {
    return this.ptr.getIID();
  }

  isDispatchSupported()
  {
    this.checkLocal();
    if (!this.dualInfo) {
      try {
        var comObject = this.queryInterface("00020400-0000-0000-c000-000000000046");
        comObject.release();
        this.setIsDual(true);
      } catch (e) {
        this.setIsDual(false);
      }
    }

    return this.isDual;
  }

  internal_setConnectionInfo(connectionPoint, cookie)
  {
    this.checkLocal();
    if (this.connectionPointInfo == null) {
      this.connectionPointInfo = new HashMap();
    }

    var uniqueId = UUID.randomUUID().toString();
    this.connectionPointInfo.put(uniqueId, [connectionPoint, cookie]);
    return uniqueId;
  }

  internal_getConnectionInfo(identifier)
  {
    this.checkLocal();
    return this.connectionPointInfo.get(identifier);
  }

  internal_removeConnectionInfo(identifier)
  {
    this.checkLocal();
    return this.connectionPointInfo.delete(identifier);
  }

  getUnreferencedHandler()
  {
    this.checkLocal();
    return this.session.getUnreferencedHandler(this.getIpid());
  }

  registerUnreferencedHandler()
  {
    this.checkLocal();
    this.session.registerUnreferencedHandler(this.getIpid(), unreferenced);
  }

  unregisterUnreferencedHandler()
  {
    this.checkLocal();
    this.session.unregisterUnreferencedHandler(this.getIpid());
  }

  call(obj, socketTimetout)
  {
    this.checkLocal();
    obj.attachSession(this.session);
    obj.setParentIpid(this.ptr.getIPID());

    if (socketTimetout != 0) {
      return this.session.getStub().call(obj, this.ptr.getIID(), socketTimetout);
    } else {
      return this.session.getStub().call(obj, this.ptr.getIID());
    }
  }

  getInstanceLevelSocketTimetout()
  {
    this.checkLocal();
    return this.timeout;
  }

  setInstanceLevelSocketTimeout(timeout)
  {
    this.checkLocal();
    this.timeout = timeout;
  }

  internal_setDeferred(deferred)
  {
    this.ptr.setDeferred(deferred);
  }

  isLocalReference()
  {
    return this.isLocal;
  }

  setIsDual(isDual)
  {
    this.dualInfo = true;
    this.isDual = isDual;
  }

  toString()
  {
	  return "IJIComObject[" + this.internal_getInterfacePointer() + " , session: "
      + this.getAssociatedSession().getSessionIdentifier() + ", isLocal: "
      + this.isLocalReference() + "]";
  }

  getCustomObject()
  {
    return this.customObject;
  }

  setCustomObject(customObject)
  {
    this.customObject = customObject;
  }

  getLengthOfInterfacePointer()
  {
    return this.ptr.getLength();
  }
}

module.exports = ComObjectImpl;
