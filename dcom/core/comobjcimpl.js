// @ts-check
let initted = false;
let HashMap;
let Unreferenced;
let ErrorCodes;
let System;
let CallBuilder;
let Flags;
let ComArray;
let UUID;
let ComValue;
let types;

const events = require('events');

class ComObjectImpl extends events.EventEmitter
{
  constructor(session, ptr, isLocal)
  {
    super();
    this.IID = "00000000-0000-0000-c000-000000000046";
    this._init();
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
    if (this.session == null) {
      throw new Error(new ErrorCodes().SESSION_NOT_ATTACHED);
    }

    if (this.isLocalReference()) {
      throw new Error(new ErrorCodes().E_NOTIMPL);
    }
  }

  async queryInterface(iid)
  {
    this.checkLocal();
    return await this.session.getStub().getInterface(iid, this.ptr.getIPID());
  }

  async addRef()
  {
    this.checkLocal();
    let obj = new CallBuilder(true);
    obj.setParentIpid(this.ptr.getIPID());
    obj.setOpnum(1);

    obj.addInParamAsShort(1, Flags.FLAG_NULL);

    let array = new ComArray(new ComValue([new ComValue(new UUID(this.ptr.getIPID()), types.UUID)], types.UUID), true);
    //var array = new ComArray(new ComValue(tempArray,types.COMARRAY), true);
    obj.addInParamAsArray(array, Flags.FLAG_NULL);
    // TODO: build caching mechanism to exhausts 5 refs before asking for more
    obj.addInParamAsInt(5, Flags.FLAG_NULL);
    obj.addInParamAsInt(0, Flags.FLAG_NULL);

    obj.addOutParamAsType(types.SHORT, Flags.FLAG_NULL);
    obj.addOutParamAsType(types.INTEGER, Flags.FLAG_NULL);

    //this.session.debug_addIpids(this.ptr.getIPID(), 5);
    await this.session.addRef_ReleaseRef(this.ptr.getIPID(), obj, 5);
    
    if (obj.getResultAt(1).getValue() != 0) {
      throw new Error("Exception:" + String(obj.getResultAsIntAt(1)));
    }
  }

  async release()
  {
    this.checkLocal();
    var obj = new CallBuilder(true);
    obj.setParentIpid(this.ptr.getIPID());
    obj.setOpnum(2);

    obj.addInParamAsShort(1, Flags.FLAG_NULL);

    var array = new ComArray(new ComValue([new ComValue(new UUID(this.ptr.getIPID()), types.UUID)], types.UUID), true);
    obj.addInParamAsArray(array, Flags.FLAG_NULL);

    obj.addInParamAsInt(5,Flags.FLAG_NULL);
    obj.addInParamAsInt(0,Flags.FLAG_NULL);

    await this.session.addRef_ReleaseRef(this.ptr.getIPID(), obj, -5);
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

  async call(obj, socketTimetout)
  {
    this.checkLocal();
    obj.attachSession(this.session);
    obj.setParentIpid(this.ptr.getIPID());

    if (socketTimetout != 0) {
      return await this.session.getStub().call(obj, this.ptr.getIID(), socketTimetout);
    } else {
      return await this.session.getStub().call(obj, this.ptr.getIID());
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
	  return "ComObject[" + this.internal_getInterfacePointer() + " , session: "
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

  _init() {
    if (initted) return;
    HashMap = require('hashmap');
    Unreferenced = require('../common/unreferenced.js');
    ErrorCodes = require('../common/errorcodes.js');
    System = require('../common/system.js');
    CallBuilder = require('./callbuilder');
    Flags = require('./flags');
    ComArray = require('./comarray');
    UUID = require('../rpc/core/uuid');
    types = require('./types');
    ComArray = require('./comarray');
    ComValue = require('./comvalue');
    initted = true;
  }
}

module.exports = ComObjectImpl;
