/* eslint-disable indent */
/* eslint-disable no-tabs */
/* eslint-disable no-mixed-spaces-and-tabs */
// @ts-check
let HashMap;
let ObjHash;
let AuthInfo;
let DNS;
let Net;
let Ip;
let Os;
let Oxid;
let ObjectId;
let InterfacePointer;
let CallBuilder;
let Flags;
let ComArray;
let ComValue
let ErrorCodes;
let Struct;
let UUID;
let types;
let inited = false;
let util;
let debug;

/**
 * This class defines a basic session
 */
class Session {
  /**
   * Initializes all session letiables and objects.
   */
  constructor() {
    this._init();
    this.oxidResolverPort = -1;
    this.localhost = [127, 0, 0, 1];
    this.localhostStr = '127.0.0.1';
    this.localhostStr2 = 'LOCALHOST';
    this.sessionIdentifier = -1;
    this.username = null;
    this.password = null;
    this.domain = null;
    this.targetServer = null;
    this.mapOfObjects = new HashMap();
    this.mutex = new Object();
    this.authInfo = null;
    this.stub = null;
    this.stub2 = null;
    this.mapofSessionIdsVsSessions = new HashMap();
    this.listOfSessions = [];
    this.listOfDeferencedIpids = [];
    this.releaseRefsTimer;
    this.mapOfUnreferencedHandlers = new HashMap();
    this.timeout = 0;
    this.useSessionSecurity = false;
    this.useNTLMv2 = false;
    this.isSSO = false;
    this.links = [];
    this.pingResolver;
    this.mapOfOxidsVsSessions = new HashMap();
    this.mapOfCustomCLSIDs = new HashMap();
    this.sessionInDestroy = false;
    this.mapOfIPIDsVsRefcounts = new HashMap();
    this.mapOfIPIDsvsWeakReferences = new HashMap();
    this.mapOfSessionvsIPIDPingHolders = new HashMap();
    this.referenceQueueOfCOMObjects; // wait and see if is necessary
  }

  _init() {
    if (inited) return;
    UUID = require('../rpc/core/uuid');
    ComValue = require('./comvalue');
    ComArray = require('./comarray');
    Flags = require('./flags');
    HashMap = require('hashmap');
    ObjHash = require('object-hash');
    AuthInfo = require('../common/authinfo.js');
    DNS = require('dns');
    Net = require('net');
    Ip = require('ip');
    Os = require('os');;
    Oxid = require('./oxid.js');
    ObjectId = require('./objectid');
    InterfacePointer = require('./interfacepointer');
    CallBuilder = require('./callbuilder');
    types = require('./types');
    Struct = require('./struct');
    util = require('util');
    debug = util.debuglog('dcom');
    ErrorCodes = require('../common/errorcodes');
    inited = true;
  }

  /**
   * Clean everything that was previously instantiated.
   */
  async cleanUp() {
    try {
      while (true) {
        let r = this.referenceQueueOfCOMObjects.remove();

        if (r != null) {
          let holder = null;
          holder = this.mapOfObjects.delete(r);
          if (holder == null) {
            continue;
          }

          let session = null;
          session = this.mapofSessionIdsVsSessions.get(holder.sessionID);
          if (holder.isOnlySessionIDPresent) {
            await this.destroySession(session);
          } else {
            if (session == null) {
              continue;
            }
            let IPID = holder.IPID;
          }

          let weakRefsRemaining = session.removeWeakReference(IPID);
          ComOxidRuntime.dellIPIDReference(IPID,
              new ObjectId(holder.oid, false), session);

          if (weakRefsRemaining > 0) continue;

          session.addDeferencedIpids(IPID);
          holder = null;
          let unreferenced = session.getUnreferencedHandler(IPID);
          if (unreferenced != null) {
            unreferenced.unReferenced();
          }
          session.unregisterUnreferencedHandler(IPID);
        }
      }
    } catch (e) {

    }
  }

  /**
   *
   * @param {String} destination
   * @return {String}
   */
  getLocalHost(destination) {
    let sock;
    let intendedDestination;

    try {
      sock = Net.createServer((c) => {
        debug('client connected');
        c.on('end', () => {
          debug('client disconnected');
        });
      });
      DNS.lookup(destination, function(err, address, family) {
        intendedDestination = address;
      });
    } catch (e) {
      return '127.0.0.1';
    }
  }

  /**
   * Stops all timers.
   */
  releaseReferencesTimerTask() {
    try {
      let listOfSessionsClone = this.listOfSessions.slice(0,
          this.listOfSessions.length);

      let i = 0;
      while (i < listOfSessionsClone.length) {
        let session = listOfSessionsClone[i];

        let listToKIll = [];
        let deferencedIpids = null;

        deferencedIpdIds = session.listOfDeferencedIpids.slice(0,
            this.listOfDeferencedIpids.length);

        for (let j = 0; j < deferencedIpids.length; j++) {
          try {
            let ipid = deferencedIpids[j];
            listToKIll.push(session.prepareForReleaseRef(ipid));
          } catch (e) {
            debug('Release_References_TimerTask:[RUN] Exception preparing for release ' + String(e));
          }
        }

        let index = 0;
        while (deferencedIpids.length > 0) {
          index = this.listOfDeferencedIpids.indexOf(deferencedIpids.pop());
          this.listOfDeferencedIpids.splice(index, 1);
        }

        if (listToKill.length > 0) {
          let array = new IArray(listToKIll, true);
        }
        try {
          session.releaseRefs(array, false);
        } catch (e) {
          debug('Session - Release_References_TimerTask:run() - Exception in internal GC ' + String(e));
        }
        i++;
      }
    } catch (e) {
      debug('Session - Release_References_TimerTask:run() - Exception in internal GC ' + String(e));
    }
  }

  setTargetServer(targetServer)
  {
    if (targetServer == "127.0.0.1") {
      this.targetServer = String(Ip.address());
    } else {
      this.targetServer = targetServer;

      if (this.localhostStr == '127.0.0.1' || this.localhostStr == '0.0.0.0') {
        this.localhostStr = this.getLocalHost(targetServer);
      }
    }
  }

  /**
   * @return {Array}
   */
  getLocalHostAddressAsIp() {
    return this.localhost;
  }

  /**
   * @return {String}
   */
  getLocalHostAsIpString() {
    return this.localhostStr;
  }

  /**
   * @return {String}
   */
  getLocalHostCanonicalAddressAsString() {
    return this.localhostStr2;
  }

  /**
   * @return {String}
   */
  getTargetServer() {
    return this.targetServer;
  }

  /**
   * @return {Number}
   */
  getOxidResolverPort() {
    return this.oxidResolverPort;
  }

  /**
   * @return {Object}
   */
  getAuthInfo() {
    return this.authInfo;
  }

  /**
   * Creates a session
   * @return {Session}
   */
  createSession() {
    if (arguments.length == 0) {
      let session = new Session();
      session.sessionIdentifier = ObjHash(new Object()) ^ Math.random();
      session.isSSO = true;

      this.mapofSessionIdsVsSessions.put(
          new Number(session.sessionIdentifier), session);
      this.listOfSessions.push(session);

      return session;
    } else if (arguments.length == 1) {
      let newSession = this.createSession(
          session.getDomain(), session.getUserName(), sesson.getPassword());
      newSession.authInfo = session.authInfo;
      return newSession;
    } else if (arguments.length == 3) {
      if (arguments[0] == null || arguments[1] == null ||
          arguments[2] == null) {
        throw new Error(new ErrorCodes().AUTH_NOT_SUPPLIED);
      }

      let session = new Session();
      session.username = arguments[1];
      session.password = arguments[2];
      session.domain = arguments[0];
      session.sessionIdentifier = ObjHash(session.username) ^
        ObjHash(session.password) ^
        ObjHash(session.domain) ^ ObjHash(new Object()) ^ Math.random();

      this.mapofSessionIdsVsSessions.set(
          new Number(session.sessionIdentifier), session);
      this.listOfSessions.push(session);
      return session;
    }
  }

  /**
   * @return {Boolean}
   */
  isSSOEnalbed() {
    return this.isSSO;
  }

  /**
   * Given a session object, releases all references and closes all connections
   * associated with it.
   * @param {Session} session
   * @return {null}
   */
  async destroySession(session) {
    if (session == null) {
      return;
    }

    if (session.stub == null) {
      this.mapofSessionIdsVsSessions.delete(
          Number(session.getSessionIdentifier()));
      this.listOfSessions.remove(session);

      await this.postDestroy(session);
      return;
    }


    let list = [];
    let listOfFreeIPIDs = [];

    if (session.sessionInDestroy) {
      return;
    }

    for (let j = 0; j < session.listOfDeferencedIpids.length; i++) {
      list.push(session.prepareForReleaseRef(
          String(session.listOfDeferencedIpids[
              session.listOfDeferencedIpids.indexOf(j)])
      ));
    }

    for (let i = 0; i < session.listOfDeferencedIpids.length; i++) {
      listOfFreeIPIDs.push(session.listOfDeferencedIpids[i]);
    }
    session.listOfDeferencedIpids = [];

    let entries = this.mapOfObjects.entries();
    for (let i = 0; i < entries.length; i++) {
      let holder = entries[i][1];
      if (session.getSessionIdentifier() != Number(holder.sessionID)) {
        continue;
      }
      let ipid = holder.IPID;
      if (ipid == null) {
        continue;
      }

      list.push(session.prepareForReleaseRef(ipid));
      listOfFreeIPIDs.push(ipid);
    }

    if (session.stub.getServerInterfacePointer() != null) {
      if (!listOfFreeIPIDs.includes(
          session.stub.getServerInterfacePointer().getIPID())) {
        list.push(session.prepareForReleaseRef(
            session.stub.getServerInterfacePointer().getIPID()));
        listOfFreeIPIDs.push(
            session.stub.getServerInterfacePointer().getIPID());
      }
    }

    listOfFreeIPIDs = [];

    if (list.length > 0) {
      let temporary = new Array();
      for (let i = 0; i < list.length; i++) {
        temporary.push(new ComValue(list[i], types.STRUCT));
      }
      let temp = new ComValue(temporary, types.STRUCT);
      let array = new ComArray(temp, true);

      // im not sure if this stub should be closed if we still have refs to release
      // await session.stub.closeStub();
      let self = this;
      await session.releaseRefs(array, true).then(async function(data) {
        self.mapofSessionIdsVsSessions.delete(
            new Number(session.getSessionIdentifier()));
        self.removeSession(session);

        if (session.stub.getServerInterfacePointer() != null) {
          self.mapOfOxidsVsSessions.delete(new Oxid(session.stub.getServerInterfacePointer().getOXID()));
        }
        // pushing the stubs to be close here guarantee that nothing else will remain on this session before
        // actually closing the connection
        await session.stub.closeStub();
        await session.stub2.closeStub();

        await self.postDestroy(session);
        session.stub = null;
        session.stub2 = null;
      })
          .catch(function(reject) {
            debug(reject);
          });
    }
  }

  /**
   *
   * @param {Session} session
   */
  removeSession(session) {
    let delId = session.getSessionIdentifier();
    for (let i = 0; i < this.listOfSessions.length; i++) {
      if(this.listOfSessions[i].getSessionIdentifier() == delId) {
        this.listOfSessions.splice(i, 1);
      }
    }
  }

  /**
   * Procedure to guarantee that the given session was really ended.
   * @param {Session} session
   */
  async postDestroy(session) {
    for (let i = 0; i < session.links.length; i++) {
      await this.destroySession(session.links.get(i));
    }

    session.links = [];
    await this.pingResolver.destroySessionOIDs(this);
  }

  /**
   *
   * @param {Array} stub
   */
  setStub(stub) {
    this.stub = stub;
    this.mapOfOxidsVsSessions.set(
        new Oxid(stub.getServerInterfacePointer().getOXID()), this);
  }

  /**
   *
   * @param {Array} stub
   */
  setStub2(stub) {
    this.stub2 = stub;
  }

  /**
   * @return {Array}
   */
  getStub() {
    return this.stub;
  }

  /**
   * @return {Array}
   */
  getStub2() {
    return this.stub2;
  }

  /**
   *
   * @param {ComObject} comObject
   * @param {Object} oid
   */
  addToSession(comObject, oid) {
    if (this.sessionInDestroy) {
      return;
    }

    this.addWeakReference(comObject, oid);
    this.addToSessionIPID(comObject.getIpid(), oid,
        comObject.internal_getInterfacePointer().getObjectReference(
            InterfacePointer.OBJREF_STANDARD).getFlags() == 0x00001000);

    let refCount =  comObject.internal_getInterfacePointer().getObjectReference(
        InterfacePointer.OBJREF_STANDARD).getPublicRefs();
    this.updateReferenceForIPID(comObject.getIpid(), refCount);
  }

  /**
   *
   * @param {String} IPID
   * @param {Object} obj
   * @param {Number} refcount
   */
  async addRef_ReleaseRef(IPID, obj, refcount) {
    this.updateReferenceForIPID(IPID, refcount);
    await this.getStub2().addRef_ReleaseRef(obj);
  }

  /**
   *
   * @param {String} ipid
   * @param {Number} refcount
   */
  updateReferenceForIPID(ipid, refcount) {
    let value = this.mapOfIPIDsVsRefcounts.get(ipid);
    if (value == null) {
      if (refcount < 0) {
        debug('[updateReferenceForIPID] Released IPID not found: ' + ipid);
        return;
      } else {
        value = new Number(0);
      }
    }

    let newCount = value + refcount;
    if (newCount > 0) {
      this.mapOfIPIDsVsRefcounts.set(ipid, newCount);
    } else {
      this.mapOfIPIDsVsRefcounts.delete(ipid);
    }
  }

  /**
   *
   * @param {ComObject} comObject
   * @param {Object} oid
   */
  addWeakReference(comObject, oid) {
    let holder = new IPID_SessionID_Holder(comObject.getIpid(),
        this.getSessionIdentifier(), false, oid);
    this.mapOfObjects.set([comObject, this.referenceQueueOfCOMObjects], holder);

    let count = this.mapOfIPIDsvsWeakReferences.get(comObject.getIpid());
    if (count = null) {
      count = new Number(0);
    }
    this.mapOfIPIDsvsWeakReferences.set(
        comObject.getIpid(), new Number(count + 1));
  }

  /**
   *
   * @param {String} ipid
   */
  removeWeakReference(ipid) {
    let weakRefsRemaining = 0;
    let count = this.mapOfIPIDsvsWeakReferences.get(ipid);
    if (count = 0) {
      weakRefsRemaining = 0;
    } else {
      weakRefsRemaining = count - 1;
      if (weakRefsRemaining > 0) {
        this.mapOfIPIDsvsWeakReferences.set(ipid,
            new Number(weakRefsRemaining));
      } else {
        this.mapOfIPIDsvsWeakReferences.delete(ipid);
      }
    }
  }

  /**
   *
   * @param {String} IPID
   * @param {Object} oid
   * @param {Boolean} dontping
   */
  addToSessionIPID(IPID, oid, dontping) {
    if (dontping) {
      if (this.sessionInDestroy) return;

      this.addWeakReference(IPID, oid);

      // this.addToSession(IPID.getIpid(), oid,
      // IPID.internal_getInterfacePointer().getObjectReference(new InterfacePointer().OBJREF_STANDARD)).getFlags() == 0x00001000);
      let refcount = IPID.internal_getInterfacePointer().getObjectReference(
          new InterfacePointer().OBJREF_STANDARD).getPublicRefs();
      this.updateReferenceForIPID(IPID.getIpid(), refcount);
    } else {
      let joid = new ObjectId([...oid], dontping);
      this.addPingObject(this, IPID, joid);
      // ComOxidRuntime.addUpdateOXIDs(this, IPID, joid);
      debug('addToSession: Adding IPID: ' + IPID + ' to session: ' +
        this.getSessionIdentifier());
    }
  }

  /**
   *
   * @param {Session} session
   * @param {ComObjImpl} IPID
   * @param {ObjectId} oid
   */
  addPingObject(session, IPID, oid) {
    let holder = this.mapOfSessionvsIPIDPingHolders.get(session);
    if (holder == null) {
      holder = new IPID_PingHolder;
      holder.username = session.getUserName();
      holder.password = session.getPassword();
      holder.domain = session.getDomain();
      // we are using the static part to add it to the hash since using
      // the whole object was problematic since a single change caused it
      // to add the same IPID more than once because of lastpingtime
      holder.currentSetOIDs.set(oid.oid, oid);
      holder.seqNum = 0;
      this.mapOfSessionvsIPIDPingHolders.set(session, holder);
    } else {
      let oid2 = holder.currentSetOIDs.get(oid.oid);
      if (oid2 != null) {
        oid = oid2;
      } else {
        holder.currentSetOIDs.set(oid.oid, oid);
        holder.modified = true;
      }
    }
    oid.incrementIPIDRefCountBy1();
  }

  /**
   *
   * @param {String} IPID
   * @param {Number} numinstances
   */
  async releaseRefs(IPID, numinstances) {
    numinstances = (numinstances == undefined) ? 5 : numinstances;

    debug('releaseRef: Reclaiming from Session: ' +
      this.getSessionIdentifier() + ' , the IPID: ' +
      IPID + ', numinstances is ' + numinstances);

    let obj = new CallBuilder(true);
    obj.setParentIpid(IPID);
    obj.setOpnum(2);
    obj.addInParamAsShort(1, Flags.FLAG_NULL);

    let array = new ComArray([new UUID(IPID)], true);
    obj.addInParamAsArray(array, Flags.FLAG_NULL);
    obj.addInParamAsInt(numinstances, Flags.FLAG_NULL);
    obj.addInParamAsInt(0, Flags.FLAG_NULL);
    debug('releaseRef: Releasing numinstances ' + numinstances +
     ' references of IPID: ' + IPID + ' session: ' +
     this.getSessionIdentifier());
    await this.addRef_ReleaseRef(IPID, obj, -5);
  }

  /**
   *
   * @param {String} IPID
   * @param {Number} numinstances
   */
  async releaseRef(IPID, numinstances) {
    let obj = new CallBuilder(true);

    obj.setParentIpid(IPID);
    obj.setOpnum(2);

    obj.addInParamAsShort(1, Flags.FLAG_NULL);

    let array = new ComArray(new ComValue([new UUID(IPID)], types.UUID), true);
    obj.addInParamAsArray(array, Flags.FLAG_NULL);

    obj.addInParamAsInt(numinstances, Flags.FLAG_NULL);
    obj.addInParamAsInt(0, Flags.FLAG_NULL);

    await this.addRef_ReleaseRef(IPID, obj, -5);
  }

  /**
   *
   * @param {String} IPID
   */
  addDeferencedIpids(IPID) {
    debug('addDereferencedIpids for session : ' +
      getSessionIdentifier() + ' , IPID is: ' + IPID);
    if (!this.listOfDeferencedIpids.includes(IPID)) {
      this.listOfDeferencedIpids.push(IPID);
    }
  }

  /**
   *
   * @param {Array} arrayOfStructs
   * @param {Boolean} fromDestroy
   */
  async releaseRefs(arrayOfStructs, fromDestroy) {
    debug('In releaseRefs for session : ' + this.getSessionIdentifier() +
      ' , array length is: ' +
      Number(arrayOfStructs.getArrayInstance().length));

    let obj = new CallBuilder(true);
    obj.setOpnum(2);

    obj.addInParamAsShort(
        arrayOfStructs.getArrayInstance().length, Flags.FLAG_NULL);
    obj.addInParamAsArray(arrayOfStructs, Flags.FLAG_NULL);
    obj.fromDestroySession = fromDestroy;
    await this.stub.addRef_ReleaseRef(obj);
  }

  /**
   *
   * @param {String} IPID
   * @param {Number} refcount
   * @return {Struct}
   */
  prepareForReleaseRef(IPID, refcount) {
    if (refcount == undefined) {
      let refCount = this.mapOfIPIDsVsRefcounts.get(IPID);
      let releaseCount = 5 + 5;
      if (refCount != null) {
        refcount = refCount;
      }
    }

    let remInterface = new Struct();
    remInterface.addMember(new ComValue(new UUID(IPID), types.UUID));
    remInterface.addMember(refcount);
    remInterface.addMember(0);
    debug('prepareForReleaseRef: Releasing ' +
      refcount + ' references of IPID: ' +
      IPID + ' session: ' + this.getSessionIdentifier());
    this.updateReferenceForIPID(IPID, -1 * refcount);

    return remInterface;
  }

  /**
   * @return {String}
   */
  getUserName() {
    return this.authInfo == null ? this.username : this.authInfo.getUserName();
  }

  /**
   * @return {String}
   */
  getPassword() {
    return this.authInfo == null ? this.password : this.authInfo.getPassword();
  }

  /**
   * @return {String}
   */
  getDomain() {
    return this.authInfo == null ? this.domain : this.authInfo.getDomain();
  }

  /**
   * @return {Number}
   */
  getSessionIdentifier() {
    return this.sessionIdentifier;
  }

  /**
   *
   * @param {Object} obj
   * @return {Boolean}
   */
  equals(obj) {
    if (obj == null || !(obj instanceof Session)) {
      return false;
    }
    let temp = obj;
    return temp.sessionIdentifier == this.sessionIdentifier;
  }

  /**
   * @return {Number}
   */
  hashCode() {
    return this.sessionIdentifier;
  }

  /**
   * Alias to destroySession
   */
  async finalize() {
    try {
      await destroySession(this);
    } catch (e) {
      debug('Exception in finalize when destroying session ' + e.getMessage());
    }
  }

  /**
   *
   * @param {String} ipid
   * @return {String}
   */
  getUnreferencedHandler(ipid) {
    return this.mapOfUnreferencedHandlers.get(ipid);
  }

  /**
   *
   * @param {String} ipid
   * @param {Number} unreferenced
   */
  registerUnreferencedHandler(ipid, unreferenced) {
    this.mapOfUnreferencedHandlers.set(ipid, unreferenced);
  }

  /**
   *
   * @param {String} ipid
   */
  unregisterUnreferencedHandler(ipid) {
    this.mapOfUnreferencedHandlers.delete(ipid);
  }

  /**
   *
   * @param {Number} timeout
   */
  setGlobalSocketTimeout(timeout) {
    this.timeout = timeout;
  }

  /**
   * @return {Number}
   */
  getGlobalSocketTimeout() {
    return this.timeout;
  }

  /**
   *
   * @param {Boolean} enable
   */
  useSessionSecurity(enable) {
    this.useSessionSecurity = enable;
  }

  /**
   *
   * @param {Boolean} enable
   */
  useNTLMv2(enable) {
    this.useNTLMv2 = enable;
  }

  /**
   * @return {Number}
   */
  isSessionSecurityEnabled() {
    return !this.isSSO & this.useSessionSecurity;
  }

  /**
   * @return {Number}
   */
  isNTLMv2Enabled() {
    return !this.isSSO & this.useNTLMv2;
  }

  /**
   *
   * @param {Session} src
   * @param {Session} target
   */
  linkTwoSessions(src, target) {
    if (src.sessionInDestroy || target.sessionInDestroy) {
      return;
    }

    if (src.equals(target)) {
      return;
    }

    if (!src.links.includes(target)) {
      src.links.push(target);
    }
  }

  /**
   *
   * @param {Session} src
   * @param {Session} tobeunlinked
   */
  unlinkSession(src, tobeunlinked) {
    if (src.sessionInDestroy) {
		  return;
    }

		if (src.equals(tobeunlinked)) {
			return;
    }
		src.links.remove(tobeunlinked);
  }

  /**
   *
   * @param {Object} oxid
   * @return {Object}
   */
  resolveSessionForOxid(oxid) {
    return this.mapOfOxidsVsSessions.get(oxid);
  }

  /**
   * @return {Boolean}
   */
  isSessionInDestroy() {
    return this.sessionInDestroy;
  }

  /**
   *
   * @param {Clsid} CLSID
   * @param {Object} customClass
   */
  registerCustomMarshallerUnMarshalerTemplate(CLSID, customClass) {
    this.mapOfCustomCLSIDs.put(CLSID.toLowerCase(), customClass);
  }

  /**
   * @param {Clsid} CLSID
   * @return {Clsid}
   */
  getCustomMarshallerUnMarshallerTemplate(CLSID) {
    return this.mapOfCustomCLSIDs(CLSID.toLowerCase());
  }
}

/**
 * This class represents a sessionID holder
 * and stores information about a session and
 * it's IPIDs
 */
class IPID_SessionID_Holder {
  /**
   *
   * @param {String} IPID
   * @param {Number} sessionID
   * @param {Boolean} isOnlySessionId
   * @param {Object} oid
   */
  constructor(IPID, sessionID, isOnlySessionId, oid) {
    this.IPID = IPID;
    this.sessionID = new Number(sessionID);
    this.isOnlySessionId = isOnlySessionId;
  }
}

/**
 * This class represents a group of objects
 * which reference is meant to be kept "alive" .
 */
class IPID_PingHolder {
  /**
   * Initializes a few variables. Takes no input parameters.
   */
  constructor() {
    this.username;
    this.password;
    this.domain;
    this.setId = null;
    this.modified = false;
    this.closed = false;
    this.seqNum = 1;
    this.currentSetOIDs = new HashMap();
    this.pingedOnce = new HashMap();
  }
}

// emulate static members
Session.resolveSessionForOxid = Session.prototype.resolveSessionForOxid;
Session.unlinkSession = Session.prototype.unlinkSession;
Session.linkTwoSessions = Session.prototype.linkTwoSessions;
Session.destroySession = Session.prototype.destroySession;
Session.createSession = Session.prototype.createSession;
Session.getOxidResolverPort = Session.prototype.getOxidResolverPort;
Session.setReleaseRefTimerFrequency = Session.prototype.setReleaseRefTimerFrequency;
Session.getLocalHostAddressAsIp = Session.prototype.getLocalHostAddressAsIp;
Session.getLocalHostAsIpString = Session.prototype.getLocalHostAsIpString;
Session.getLocalHostCanonicalAddressAsString = Session.prototype.getLocalHostCanonicalAddressAsString;

module.exports = Session;
