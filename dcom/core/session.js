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
class Session
{
  constructor(){
    this._init();
    this.oxidResolverPort = -1;
    this.localhost = [127, 0, 0, 1];
    this.localhostStr = "127.0.0.1";
    this.localhostStr2 = "LOCALHOST";
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
    this.listOfSessions = new Array();
    this.listOfDeferencedIpids = new Array();
    this.releaseRefsTimer;
    this.mapOfUnreferencedHandlers = new HashMap();
    this.timeout = 0;
    this.useSessionSecurity = false;
    this.useNTLMv2 = false;
    this.isSSO = false;
    this.links = new Array();
    this.pingResolver;
    this.mapOfOxidsVsSessions = new HashMap();
    this.mapOfCustomCLSIDs = new HashMap();
    this.sessionInDestroy = false;
    this.mapOfIPIDsVsRefcounts = new HashMap();
    this.mapOfIPIDsvsWeakReferences = new HashMap();
    this.mapOfSessionvsIPIDPingHolders = new HashMap();
    this.referenceQueueOfCOMObjects; // wait and see if is necessary
  }

  _init(){
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

  // TODO: how to do a constant running function in nodejs
  async cleanUp()
  {
    try {
      while (true) {
        var r = this.referenceQueueOfCOMObjects.remove();

        if (r != null) {
          var holder = null;
          holder = this.mapOfObjects.delete(r);
          if (holder == null) {
            continue;
          }

          var session = null;
          session = this.mapofSessionIdsVsSessions.get(holder.sessionID);
          if (holder.isOnlySessionIDPresent) {
              await this.destroySession(session);
          } else {
            if (session == null) {
              continue;
            }
            var IPID = holder.IPID;
          }

          var weakRefsRemaining = session.removeWeakReference(IPID);
          ComOxidRuntime.dellIPIDReference(IPID, new ObjectId(holder.oid, false), session);

          if (weakRefsRemaining > 0) continue;

          session.addDeferencedIpids(IPID);
          holder = null;
          var unreferenced = session.getUnreferencedHandler(IPID);
          if (unreferenced != null) {
            unreferenced.unReferenced();
          }
          session.unregisterUnreferencedHandler(IPID);
        }
      }
    } catch (e) {

    }
  }

  getLocalHost(destination)
  {
    var sock;
    var intendedDestination;

    try {
      sock = Net.createServer((c) => {
        debug("client connected");
        c.on('end', () => {
          debug("client disconnected");
        })
      });
      DNS.lookup(destination, function(err, address, family){
        intendedDestination = address;
      })
    } catch (e) {
      return "127.0.0.1";
    }

  }

  notSure(){
    this.localhost = ip.address();
    this.localhostStr = String(ip.address());
    this.localhostStr2 = String(os.hostname());

    this.cleanUp();

    ComOxidRuntime.startResolver();
    ComOxidRuntime.startResolverTimer();
   this. oxidResolverPort = ComOxidRuntime.getOxidResolverPort();

    // TODO: see how to do a timer
    this.releaseRefsTimer;
  }

  async addShutdownHook()
  {
    var i = 0;
    while (i < this.listOfSessions.size()) {
      var session = this.listOfSessions.get(i);
      try {
        await this.destroySession(session);
      } catch (e) {
        throw new Erro("Session - addShutdownHook" + String(e));
      }
      i++;
    }
    this.internal_writeProgIdsToFile();
    ComOxidRuntime.stopResolver();
    this.releaseRefsTimer.cancel();
    this.mapofSessionIdsVsSessions.clear();
    this.mapOfObjects.clear();
    this.listOfSessions.clear();
  }

  setReleaseRefTimerFrequency(){};

  releaseReferencesTimerTask()
  {
    try {
      var listOfSessionsClone = this.listOfSessions.slice(0, this.listOfSessions.length);

      var i = 0;
      while (i < listOfSessionsClone.length) {
        var session = listOfSessionsClone[i];

        var listToKIll = new Array();
        var deferencedIpids = null;

        deferencedIpdIds = session.listOfDeferencedIpids.slice(0, this.listOfDeferencedIpids.length);

        for (var j = 0; j < deferencedIpids.length; j++) {
          try {
            var ipid = deferencedIpids[j];
            listToKIll.push(session.prepareForReleaseRef(ipid));
          } catch(e){
            debug("Release_References_TimerTask:[RUN] Exception preparing for release " + String(e));
          }
        }

        var index = 0
        while (deferencedIpids.length > 0) {
          index = this.listOfDeferencedIpids.indexOf(deferencedIpids.pop());
          this.listOfDeferencedIpids.splice(index, 1);
        }

        if (listToKill.length > 0) {
          var array = new IArray(listToKIll, true);
        }
        try {
          session.releaseRefs(array, false);
        } catch(e){
          debug("Session - Release_References_TimerTask:run() - Exception in internal GC " + String(e));
        }
        i++;
      }
    } catch (e){
      debug("Session - Release_References_TimerTask:run() - Exception in internal GC " + String(e));
    }
  }

  setTargetServer(targetServer)
  {
    if (targetServer == "127.0.0.1") {
      this.targetServer = String(Ip.address());
    } else {
      this.targetServer = targetServer;

      if (this.localhostStr == "127.0.0.1" || this.localhostStr == "0.0.0.0") {
        this.localhostStr = this.getLocalHost(targetServer);
      }
    }
  }

  getLocalHostAddressAsIp()
  {
    return this.localhost;
  }

  getLocalHostAsIpString()
  {
    return this.localhostStr;
  }

  getLocalHostCanonicalAddressAsString()
  {
    return this.localhostStr2;
  }

  getTargetServer()
  {
    return this.targetServer;
  }

  getOxidResolverPort()
  {
    return oxidResolverPort;
  }

  getAuthInfo()
  {
    return this.authInfo;
  }

  createSession(){
    if (arguments.length == 0) {
      var session = new Session();
      session.sessionIdentifier = ObjHash(new Object()) ^ Math.random();
      session.isSSO = true;

      this.mapofSessionIdsVsSessions.put(new Number(session.sessionIdentifier), session);
      this.listOfSessions.push(session);

      return session;
    } else if (arguments.length == 1) {
      var newSession = this.createSession(session.getDomain(), session.getUserName(), sesson.getPassword());
      newSession.authInfo = session.authInfo;
      return newSession;
    } else if (arguments.length == 3) {
      if (arguments[0] == null || arguments[1] == null || arguments[2] == null) {
        throw new Error(new ErrorCodes().AUTH_NOT_SUPPLIED);
      }

      var session = new Session();
      session.username = arguments[1];
      session.password = arguments[2];
      session.domain = arguments[0];
      session.sessionIdentifier = ObjHash(session.username) ^ ObjHash(session.password) ^ ObjHash(session.domain) ^ ObjHash(new Object()) ^ Math.random();

      this.mapofSessionIdsVsSessions.set(new Number(session.sessionIdentifier), session);
      this.listOfSessions.push(session);
      return session;
    }
  }

  isSSOEnalbed()
  {
    return this.isSSO;
  }

  async destroySession(session)
  {
    if (session == null) {
      return;
    }

    if (session.stub == null) {
      this.mapofSessionIdsVsSessions.delete(Number(session.getSessionIdentifier()));
      this.removeSession(session);

      await this.postDestroy(session);
      return;
    }

    
    var list = new Array();
    var listOfFreeIPIDs = new Array();

    if (session.sessionInDestroy) {
      return;
    }

    for (var j = 0; j < session.listOfDeferencedIpids.length; i++){
      list.push(session.prepareForReleaseRef(
        String(session.listOfDeferencedIpids[session.listOfDeferencedIpids.indexOf(j)])
      ));
    }

    for (var i = 0; i < session.listOfDeferencedIpids.length; i++) {
      listOfFreeIPIDs.push(session.listOfDeferencedIpids[i]);
    }
    session.listOfDeferencedIpids = new Array();

    var entries = this.mapOfObjects.entries();
    for (var i = 0; i < entries.length; i++) {
      var holder = entries[i][1];
      if (session.getSessionIdentifier() != Number(holder.sessionID)) {
        continue;
      }
      var ipid = holder.IPID;
      if (ipid == null) {
        continue;
      }

      list.push(session.prepareForReleaseRef(ipid));
      listOfFreeIPIDs.push(ipid);
    }

    if (session.stub.getServerInterfacePointer() != null) {
      if (!listOfFreeIPIDs.includes(session.stub.getServerInterfacePointer().getIPID())) {
        list.push(session.prepareForReleaseRef(session.stub.getServerInterfacePointer().getIPID()));
        listOfFreeIPIDs.push(session.stub.getServerInterfacePointer().getIPID());
      }
    }

    listOfFreeIPIDs = [];

    if (list.length > 0) {
      let temporary = new Array();
      for (let i = 0; i < list.length; i++) {
        temporary.push(new ComValue(list[i], types.STRUCT));
      }
      let temp = new ComValue(temporary, types.STRUCT);
      var array = new ComArray(temp, true);
      
      // im not sure if this stub should be closed if we still have refs to release
      //await session.stub.closeStub();
      let self = this;
      await session.releaseRefs(array, true).then(async function(data){
        self.mapofSessionIdsVsSessions.delete(new Number(session.getSessionIdentifier()));
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
      .catch(function(reject){
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

  async postDestroy(session)
  {
    for (var i = 0; i < session.links.length; i++) {
      await this.destroySession(session.links.get(i));
    }

    session.links = [];
    await this.pingResolver.destroySessionOIDs(this);
  }

  setStub(stub)
  {
    this.stub = stub;
    this.mapOfOxidsVsSessions.set(new Oxid(stub.getServerInterfacePointer().getOXID()), this);
  }

  setStub2(stub)
  {
    this.stub2 = stub;
  }

  getStub()
  {
    return this.stub;
  }

  getStub2()
  {
    return this.stub2;
  }

  addToSession(comObject, oid)
  {
    if (this.sessionInDestroy) {
      return;
    }

    this.addWeakReference(comObject, oid);
    this.addToSessionIPID(comObject.getIpid(), oid, comObject.internal_getInterfacePointer().getObjectReference(InterfacePointer.OBJREF_STANDARD).getFlags() == 0x00001000);

    var refCount =  comObject.internal_getInterfacePointer().getObjectReference(InterfacePointer.OBJREF_STANDARD).getPublicRefs();
    this.updateReferenceForIPID(comObject.getIpid(), refCount);
  }

  async addRef_ReleaseRef(IPID, obj, refcount)
  {
    this.updateReferenceForIPID(IPID, refcount);
    await this.getStub2().addRef_ReleaseRef(obj);
  }

  updateReferenceForIPID(ipid, refcount)
  {
    var value = this.mapOfIPIDsVsRefcounts.get(ipid);
    if (value == null) {
      if (refcount < 0) {
        debug("[updateReferenceForIPID] Released IPID not found: " + ipid);
        return;
      } else {
        value = new Number(0);
      }
    }

    var newCount = value + refcount;
    if (newCount > 0) {
      this.mapOfIPIDsVsRefcounts.set(ipid, newCount);
    } else {
      this.mapOfIPIDsVsRefcounts.delete(ipid);
    }
  }

  addWeakReference(comObject, oid)
  {
    var holder = new IPID_SessionID_Holder(comObject.getIpid(), this.getSessionIdentifier(), false, oid);
    this.mapOfObjects.set([comObject, this.referenceQueueOfCOMObjects], holder);

    var count = this.mapOfIPIDsvsWeakReferences.get(comObject.getIpid());
    if (count = null) {
      count = new Number(0);
    }
    this.mapOfIPIDsvsWeakReferences.set(comObject.getIpid(), new Number(count + 1));
  }

  removeWeakReference(ipid)
  {
    var weakRefsRemaining = 0;
    var count = this.mapOfIPIDsvsWeakReferences.get(ipid);
    if (count = 0) {
      weakRefsRemaining = 0;
    } else {
      weakRefsRemaining = count - 1;
      if (weakRefsRemaining > 0) {
        this.mapOfIPIDsvsWeakReferences.set(ipid, new Number(weakRefsRemaining));
      } else {
        this.mapOfIPIDsvsWeakReferences.delete(ipid);
      }
    }
  }

  addToSessionIPID(IPID, oid, dontping)
  {
    if (dontping) {
      if (this.sessionInDestroy) return;

      this.addWeakReference(IPID, oid);

      //this.addToSession(IPID.getIpid(), oid,
      // IPID.internal_getInterfacePointer().getObjectReference(new InterfacePointer().OBJREF_STANDARD)).getFlags() == 0x00001000);
      let refcount = IPID.internal_getInterfacePointer().getObjectReference(new InterfacePointer().OBJREF_STANDARD).getPublicRefs();
      this.updateReferenceForIPID(IPID.getIpid(), refcount);
    } else {
      let joid = new ObjectId([...oid], dontping);
      this.addPingObject(this, IPID, joid);
      //ComOxidRuntime.addUpdateOXIDs(this, IPID, joid);
      debug("addToSession: Adding IPID: " + IPID + " to session: " + this.getSessionIdentifier());
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

  async releaseRefs(IPID, numinstances){
    numinstances = (numinstances == undefined) ? 5 : numinstances;

    debug("releaseRef: Reclaiming from Session: " + this.getSessionIdentifier()
      + " , the IPID: " + IPID + ", numinstances is " + numinstances);

    var obj = new CallBuilder(true);
    obj.setParentIpid(IPID);
    obj.setOpnum(2);
    obj.addInParamAsShort(1, Flags.FLAG_NULL);

    var array = new ComArray([new UUID(IPID)], true);
    obj.addInParamAsArray(array, Flags.FLAG_NULL);
    obj.addInParamAsInt(numinstances, Flags.FLAG_NULL);
    obj.addInParamAsInt(0, Flags.FLAG_NULL);
    debug("releaseRef: Releasing numinstances " + numinstances + " references of IPID: " + IPID + " session: " + thisgetSessionIdentifier())
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

  addDeferencedIpids(IPID)
  {
    debug("addDereferencedIpids for session : " + getSessionIdentifier() + " , IPID is: " + IPID);
    if (!this.listOfDeferencedIpids.includes(IPID)) {
      this.listOfDeferencedIpids.push(IPID);
    }
  }

  async releaseRefs(arrayOfStructs, fromDestroy)
  {
    	debug("In releaseRefs for session : " + this.getSessionIdentifier()
        + " , array length is: " + Number(arrayOfStructs.getArrayInstance().length));

      var obj = new CallBuilder(true);
      obj.setOpnum(2);

      obj.addInParamAsShort(arrayOfStructs.getArrayInstance().length, Flags.FLAG_NULL);
      obj.addInParamAsArray(arrayOfStructs, Flags.FLAG_NULL);
      obj.fromDestroySession = fromDestroy;
      await this.stub.addRef_ReleaseRef(obj);
  }

  prepareForReleaseRef(IPID, refcount)
  {
    if (refcount == undefined) {
      var refCount = this.mapOfIPIDsVsRefcounts.get(IPID);
      var releaseCount = 5 + 5;
      if (refCount != null) {
        refcount = refCount;
      }
    }

    var remInterface = new Struct();
    remInterface.addMember(new ComValue(new UUID(IPID), types.UUID));
    remInterface.addMember(refcount);
    remInterface.addMember(0);
    debug("prepareForReleaseRef: Releasing " + refcount + " references of IPID: "
      + IPID + " session: " + this.getSessionIdentifier());
    this.updateReferenceForIPID(IPID, -1 * refcount);

    return remInterface;
  }

  getUserName()
  {
    return this.authInfo == null ? this.username : this.authInfo.getUserName();
  }

  getPassword()
  {
    return this.authInfo == null ? this.password : this.authInfo.getPassword();
  }

  getDomain()
  {
    return this.authInfo == null ? this.domain : this.authInfo.getDomain();
  }

  getSessionIdentifier()
  {
    return this.sessionIdentifier;
  }

  equals(obj)
  {
    if (obj == null || !(obj instanceof Session)) {
      return false;
    }
    var temp = obj;
    return temp.sessionIdentifier == this.sessionIdentifier;
  }

  hashCode()
  {
    return this.sessionIdentifier;
  }

  async finalize()
  {
    try {
      await destroySession(this);
    } catch (e) {
      debug("Exception in finalize when destroying session " + e.getMessage());
    }
  }

  getUnreferencedHandler(ipid)
  {
    return this.mapOfUnreferencedHandlers.get(ipid);
  }

  registerUnreferencedHandler(ipid, unreferenced)
  {
    this.mapOfUnreferencedHandlers.set(ipid, unreferenced);
  }

  unregisterUnreferencedHandler(ipid)
  {
    this.mapOfUnreferencedHandlers.delete(ipid);
  }

  setGlobalSocketTimeout(timeout)
  {
    this.timeout = timeout;
  }

  getGlobalSocketTimeout()
  {
    return this.timeout;
  }

  useSessionSecurity(enable)
  {
    this.useSessionSecurity = enable;
  }

  useNTLMv2(enable)
  {
    this.useNTLMv2 = enable;
  }

  isSessionSecurityEnabled()
  {
    return !this.isSSO & this.useSessionSecurity;
  }

  isNTLMv2Enabled()
  {
    return !this.isSSO & this.useNTLMv2;
  }

  linkTwoSessions(src, target)
  {
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

  unlinkSession(src, tobeunlinked)
  {
    if (src.sessionInDestroy)
			return;

		if (src.equals(tobeunlinked))
			return;

		src.links.remove(tobeunlinked);
  }

  resolveSessionForOxid(oxid)
  {
    return this.mapOfOxidsVsSessions.get(oxid);
  }

  isSessionInDestroy()
  {
    return this.sessionInDestroy;
  }

  registerCustomMarshallerUnMarshalerTemplate(CLSID, customClass)
  {
    this.mapOfCustomCLSIDs.put(CLSID.toLowerCase(), customClass);
  }

  getCustomMarshallerUnMarshallerTemplate(CLSID)
  {
    return this.mapOfCustomCLSIDs(CLSID.toLowerCase());
  }
}

class IPID_SessionID_Holder {
  constructor(IPID, sessionID, isOnlySessionId, oid)
  {
    this.IPID = IPID;
    this.sessionID = new Number(sessionID);
    this.isOnlySessionId = isOnlySessionId;
  }
}

class IPID_PingHolder {
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

//emulate static members
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
