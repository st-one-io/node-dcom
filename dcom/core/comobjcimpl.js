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

/**
 * This class represents a COM Object
 */
class ComObjectImpl extends events.EventEmitter {
  /**
   *
   * @param {Session} session
   * @param {*} ptr
   * @param {Boolean} isLocal
   */
  constructor(session, ptr, isLocal) {
    super();
    this.IID = '00000000-0000-0000-c000-000000000046';
    this._init();
    this.serialVersionUID = '-1661750453596032089L';

    this.isDual = false;
    this.dualInfo = false;
    this.session = session;
    this.ptr = ptr;
    this.connectionPointInfo = null;
    this.timeout = 0;
    this.isLocal = (isLocal == undefined) ? false : isLocal;;

    this.customObject = null;
  }

  /**
   *
   * @param {ComObjectImpl} comObject
   */
  replaceMember(comObject) {
    this.session = comObject.getAssociatedSession();
    this.ptr = comObject.internal_getInterfacePointer();
  }

  /**
   * Checks the local flag
   */
  checkLocal() {
    if (this.session == null) {
      throw new Error(new ErrorCodes().SESSION_NOT_ATTACHED);
    }

    if (this.isLocalReference()) {
      throw new Error(new ErrorCodes().E_NOTIMPL);
    }
  }

  /**
   * Queries an interface on the given iid
   * @param {String} iid
   */
  async queryInterface(iid) {
    this.checkLocal();
    return await this.session.getStub().getInterface(iid, this.ptr.getIPID());
  }

  /**
   * Adds a reference for the current object.
   */
  async addRef() {
    this.checkLocal();
    let obj = new CallBuilder(true);
    obj.setParentIpid(this.ptr.getIPID());
    obj.setOpnum(1);

    obj.addInParamAsShort(1, Flags.FLAG_NULL);

    let array = new ComArray(new ComValue([new ComValue(new UUID(this.ptr.getIPID()), types.UUID)], types.UUID), true);
    obj.addInParamAsArray(array, Flags.FLAG_NULL);
    obj.addInParamAsInt(5, Flags.FLAG_NULL);
    obj.addInParamAsInt(0, Flags.FLAG_NULL);

    obj.addOutParamAsType(types.SHORT, Flags.FLAG_NULL);
    obj.addOutParamAsType(types.INTEGER, Flags.FLAG_NULL);

    await this.session.addRef_ReleaseRef(this.ptr.getIPID(), obj, 5);

    if (obj.getResultAt(1).getValue() != 0) {
      throw new Error('Exception:' + String(obj.getResultAsIntAt(1)));
    }
  }

  /**
   * Release all references for this object.
   */
  async release() {
    this.checkLocal();
    let obj = new CallBuilder(true);
    obj.setParentIpid(this.ptr.getIPID());
    obj.setOpnum(2);

    obj.addInParamAsShort(1, Flags.FLAG_NULL);

    let array = new ComArray(new ComValue([new ComValue(new UUID(this.ptr.getIPID()), types.UUID)], types.UUID), true);
    obj.addInParamAsArray(array, Flags.FLAG_NULL);

    obj.addInParamAsInt(5, Flags.FLAG_NULL);
    obj.addInParamAsInt(0, Flags.FLAG_NULL);

    await this.session.addRef_ReleaseRef(this.ptr.getIPID(), obj, -5);
  }

  /**
   * @return {InterfacePointer}
   */
  internal_getInterfacePointer(){
    return (this.ptr == null) ? this.session.getStub().getServerInterfacePointer() : this.ptr;
  }

  /**
   * @return {String}
   */
  getIpid() {
    return this.ptr.getIPID();
  }

  /**
   *
   * @param {Object} obj
   * @return {Boolean}
   */
  equals(obj) {
    if (!(obj instanceof ComObjectImpl)) {
      return false;
    }

    return (this.ptr.getIPID().equalsIgnoreCase(obj.getIpid()));
  }

  /**
   * @return {String}
   */
  hashCode() {
    return this.ptr.getIPID().hashCode();
  }

  /**
   * @return {Session}
   */
  getAssociatedSession() {
    return this.session;
  }

  /**
   * @return {String}
   */
  getInterfaceIdentifier() {
    return this.ptr.getIID();
  }

  /**
   * @return {Boolean}
   */
  isDispatchSupported() {
    this.checkLocal();
    if (!this.dualInfo) {
      try {
        var comObject = this.queryInterface('00020400-0000-0000-c000-000000000046');
        comObject.release();
        this.setIsDual(true);
      } catch (e) {
        this.setIsDual(false);
      }
    }

    return this.isDual;
  }

  /**
   *
   * @param {HashMap} connectionPoint
   * @param {String} cookie
   * @return {Number}
   */
  internal_setConnectionInfo(connectionPoint, cookie) {
    this.checkLocal();
    if (this.connectionPointInfo == null) {
      this.connectionPointInfo = new HashMap();
    }

    let uniqueId = UUID.randomUUID().toString();
    this.connectionPointInfo.put(uniqueId, [connectionPoint, cookie]);
    return uniqueId;
  }

  /**
   * @param {Number} identifier
   * @return {Number}
   */
  internal_getConnectionInfo(identifier) {
    this.checkLocal();
    return this.connectionPointInfo.get(identifier);
  }

  /**
   * @param {Number} identifier
   * @return {Number}
   */
  internal_removeConnectionInfo(identifier) {
    this.checkLocal();
    return this.connectionPointInfo.delete(identifier);
  }

  /**
   * @return {Number}
   */
  getUnreferencedHandler() {
    this.checkLocal();
    return this.session.getUnreferencedHandler(this.getIpid());
  }

  /**
   * Register the unreferenced handler.
   * @param {Object} unreferenced
   */
  registerUnreferencedHandler(unreferenced) {
    this.checkLocal();
    this.session.registerUnreferencedHandler(this.getIpid(), unreferenced);
  }

  /**
   * Unregister the unreferenced handler.
   */
  unregisterUnreferencedHandler() {
    this.checkLocal();
    this.session.unregisterUnreferencedHandler(this.getIpid());
  }

  /**
   *
   * @param {Object} obj
   * @param {Number} socketTimetout
   */
  async call(obj, socketTimetout) {
    this.checkLocal();
    obj.attachSession(this.session);
    obj.setParentIpid(this.ptr.getIPID());

    if (socketTimetout != 0) {
      return await this.session.getStub().call(obj, this.ptr.getIID(), socketTimetout);
    } else {
      return await this.session.getStub().call(obj, this.ptr.getIID());
    }
  }

  /**
   * @return {Number}
   */
  getInstanceLevelSocketTimetout() {
    this.checkLocal();
    return this.timeout;
  }

  /**
   *
   * @param {Number} timeout
   */
  setInstanceLevelSocketTimeout(timeout) {
    this.checkLocal();
    this.timeout = timeout;
  }

  /**
   * @param {Number} deferred
   */
  internal_setDeferred(deferred) {
    this.ptr.setDeferred(deferred);
  }

  /**
   * @return {Boolean}
   */
  isLocalReference() {
    return this.isLocal;
  }

  /**
   *
   * @param {Boolean} isDual
   */
  setIsDual(isDual) {
    this.dualInfo = true;
    this.isDual = isDual;
  }

  /**
   * @return {String}
   */
  toString() {
    return 'IJIComObject[' + this.internal_getInterfacePointer() +
      ' , session: ' + this.getAssociatedSession().getSessionIdentifier() +
      ', isLocal: '+ this.isLocalReference() + ']';
  }

  /**
   * @return {Object}
   */
  getCustomObject() {
    return this.customObject;
  }

  /**
   *
   * @param {Object} customObject
   */
  setCustomObject(customObject) {
    this.customObject = customObject;
  }

  /**
   * @return {Number}
   */
  getLengthOfInterfacePointer() {
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
