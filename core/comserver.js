// @ts-check
const Stub = require('../rpc/stub.js');
const Session = require('./session.js');
const ErrorCodes = require('../common/errorcodes.js');
const Endpoint = require('../rpc/connectionorientedendpoint.js');
const Clsid = require('./clsid.js');
const Dns = require('dns');
const Oxid = require('./oxid.js');
const RemoteSCMActivator = require('./remotescmactivator.js');
const ComTransportFactory = require('../transport/comtransportfactory.js');
const UUID = require('../rpc/core/uuid.js');
const CallBuilder = require('./callbuilder.js');
const System = require('../common/system.js');
const RemActivation = require('./RemActivation.js');
const RemUnknown = require('./remunknown');
const RemUnknownServer = require('./remunknownserver');
const ComObject = require('./comobject');
const ComObjetImpl = require('./comobjcimpl');
const FrameworkHelper = require('./frameworkhelper');
const Flags = require('./flags');
const types = require('./types');

/**
 * This class represents the basic server object
 */
class ComServer extends Stub {
  constructor(){
    super();
    this.serverActivation = null;
    this.oxidResolver = null;
    this.clsid = null;
    this.syntax = null;
    this.session = null;
    this.serverInstantiated = false;
    this.remunknownIPID = null;
    this.timeoutModifiedfrom0 = false;
    this.interfacePtrCtor = null;
    this.listOfIps = new Array();
    this.info;
    this.stub;
    this.interfacePointer;
    this.address;
    this.args = arguments;
    this.callType = 0;
    
    // we can create a server with different types of arguments
    if (arguments.length == 3) {
      if (arguments[0] instanceof Session){
        this.callType = 0;
      } else if (arguments[0] instanceof Stub) {
        // TODO: inti values for progid calls
      } else if (arguments[0] instanceof Clsid) {
        this.callType = 2;
      }
    }
  }

  /**
   * starts the ComServer
   */
  async init(){
    if (this.callType == 0){
      this.session = this.args[0];
      this.interfacePointer = this.args[1];
      this.address = this.args[2];
      this.comServerSession(this.session, this.interfacePointer, this.address);
      return;
    } 
    else if (this.clsid = undefined && this.session == undefined) {
      this.comServerProgId(this.args[0], this.args[1], this.args[2]);
    } 
    else if (this.callType == 2) {
      this.clsid = this.args[0];
      this.address = this.args[1];
      this.session = this.args[2];
      
      let created = await this.comServerClsid(this.clsid, this.address, this.session);
    }
  }

  comServerSession(session, interfacePointer, ipAddress)
  {
    if (interfacePointer == null || session == null) {
      throw new Error(ErrorCodes.COMSTUB_ILLEGAL_ARGUMENTS);
    }

    if (sesson.getStub() != null) {
      throw new Error(ErroCodes.SESSION_ALREADY_ESTABLISHED);
    }

    if (ipAddress != null && !ipAddress.trim() == "") {
      if (!this.listOfIps.includes(ipAddress)) {
        this.listOfIps.push(ipAddress.toLowerCase());
      }
    }


    super.setTransportFactory(new ComTransportFactory.getSingleTon());
    // check if any authentication mode is enabled
    if (session.isNTLMv2Enabled()) {
      // TODO: properties
    }
    if (session.isSSOEnalbed()) {
      // TODO: properties
    }
    this.info = {domain: session.domain, username: session.username, password: session.password};
    var addressBindings = interfacePointer.getStringBindings().getStringBindings();
    var i = 0;
    var binding = null;
    var nameBinding = null;
    var targetAddress = ipAddress == null ? "" : ipAddress.trim();

    while (i < addressBindings.length) {
      binding = addressBindings[i];
      if (binding.getTowerId() != 0x07) {
        i++;
        continue;
      }

      var index = binding.getNetworkAddress().indexOf(".");
      if (index != -1) {
        try {
          if (this.listOfIps.includes(binding.getNetworkAddress().toLowerCase())) {
            nameBinding = null;
            break;
          }
          index = binding.getNetworkAddress().indexOf("[");
          if (index != -1 && this.listOfIps.includes(binding.getNetworkAddress().substring(0,index).toLowerCase())) {
            nameBinding = null;
            break;
          }
        } catch (e) {}
      } else {
        nameBinding = binding;
      }
      i++;
    }
    binding = nameBinding == null ? binding : nameBinding;

    var address = binding.getNetworkAddress();
    if (address.indexOf("[") == -1) {
      var ipAddr = System.getIPForHostName(address);
      if (ipAddr != null) {
        address = ipAddr;
      }
      address = address + "[135]";
    } else {
      var index = address.indexOf("[");
      var hostname = binding.getNetworkAddress().substring(0, index);
      var ipAddr = System.getIPForHostName(hostname);
      if (!ipAddr != null) {
        address = ipAddr + address.subtring(index);
      }
    }
    super.setAddress("ncacn_ip_tcp:" + address);
    this.session = session;
    this.session.setTargetServer(this.getAddress().substring(this.getAddress().indexOf(":") + 1,this.getAddress().indexOf("[")));
    this.oxidResolver = new oxidResolver(interfacePointer.getObjectReference(JIInterfacePointer.OBJREF_STANDARD)).getOxid();

    try {
      this.syntax = "99fcfec4-5260-101b-bbcb-00aa0021347a:0.0";
      this.attach();
      this.getEndPoint().getSyntax().setUUID(new UUID("99fcfec4-5260-101b-bbcb-00aa0021347a"));
      this.getEndpoint().getSyntax().setVersion(0,0);
      this.getEndPoint().rebindEndpoint();

      this.call(Endpoint.IDEMPOTENT, oxidResolver);
    } catch(e){};

    this.syntax = interfacePointer.getIID() + ":0.0";

    var bindings = oxidResolver.getOxidBindings().getStringBindings();
    binding = null;
    nameBinding = null;
    i = 0;
    while (i < bindings.length ) {
      binding = bindings[i];
      if (binding.getTowerId() != 0x07) {
        i++;
        continue;
      }

      var index = binding.getNetworkAddress().indexOf(".");
      if (index != -1) {
        try {
          if (this.listOfIps.includes(binding.getNetworkAddress().toLowerCase())) {
            nameBinding = null;
            break;
          }

          index = binding.getNetworkAddress().indexOf("[");
          if (index != -1 && this.listOfIps.includes(binding.getNetworkAddress().substring(0,index).toLowerCase())) {
            nameBinding = null;
            break;
          }
        } catch(e){}

      } else {
        nameBinding = binding;
      }
      i++;
    }
    binding = nameBinding == null ? binding : nameBinding;

    // TODO:  ntlmv2 session security

    address = binding.getNetworkAddress();
    var index = addres.indexOf("[");
    var hostname = binding.getNetworkAddress().substring(0,index);
    var ipAddr = System.getIPForHostName(hostname);
    if (ipAddr != null) {
      address = ipAddr + address.substring(index);
    }

    this.setAddress("ncacn_ip_tcp:" + address);
		this.remunknownIPID = oxidResolver.getIPID();
		this.interfacePtrCtor = interfacePointer;
		this.session.setStub(this);
    this.session.setStub2(new RemUnknownServer(session, this.remunknownIPID, this.getAddress()));
    return 1;
  }

  /**
   *
   * @param {Clsid} clsid
   * @param {String} address
   * @param {Session} session
   */
  async comServerClsid(clsid, address, session)
  {
    if (clsid == null || address == null || session == null) {
      throw new Error(ErrorCodes.COMSTUB_ILLEGAL_ARGUMENTS);
    }

    if (session.getStub() != null) {
      throw new Error(ErrorCodes.SESSION_ALREADY_ESTABLISHED);
    }

    if (session.isSSOEnalbed()) {
      throw new Erro(ErrorCodes.COMSTUB_ILLEGAL_ARGUMENTS2);
    }

    address = address.trim();
    Dns.lookup(this.address, function(err, addr, family){
      address = addr;
    });
    this.info = {domain: session.domain, username: session.username, password: session.password};
    address = "ncacn_ip_tcp:"+ address + "[135]";
    await this.initialize(clsid, address, session);
    return 1;
  }

  async initialize(clsid, address, session)
  {
    this.transportFactory = (new ComTransportFactory().getSingleTon());
    this.address = address;

    if (session.isNTLMv2Enabled()) {
      // TODO:
    }

    if (session.isSSOEnalbed()) {
      // TODO:
    }else {
      // TODO:
    }

    this.clsid = clsid.getClsid().toUpperCase();
    this.session = session;
    this.session.setTargetServer(address.substring(address.indexOf(":") + 1, address.indexOf("[")));
    try {
      await this.start();
    } catch (e) {
      console.log(e);
      // TODO: HUGE TO-DO, related to winReg and for the firs time well defined Exceptions were needed
    }
    if (this.serverActivation != null) {
      this.session.setStub(this);
      this.session.setStub2(new RemUnknownServer(session, this.remunknownIPID, this.getAddress(), this.info));
    }
  }

  async start(){
    if (this.serverActivation != null && this.serverActivation.isActivationSuccessful()) {
      return;
    }
    console.log("start");
    var attachcomplete = false;
    try {
      /*this.syntax = "99fcfec4-5260-101b-bbcb-00aa0021347a:0.0";
      await this.attach(this.getSyntax());
      console.log("after first attach");
      attachcomplete = true;

      this.getEndpoint().getSyntax().setUUID(new UUID("99fcfec4-5260-101b-bbcb-00aa0021347a"));
      this.getEndpoint().getSyntax().setVersion(0,0);
      console.log("before rebind");

      await this.getEndpoint().rebind(this.info);
      console.log("after rebind");
      let serverAlive = new CallBuilder(true);
      serverAlive.attachSession(this.session);
      serverAlive.setOpnum(2);
      serverAlive.internal_COMVersion();
      console.log("init inside try");
      try {
        this.call(new Endpoint().IDEMPOTENT, serverAlive, this.info);
        new System().setComVersion(serverAlive.internal_getComVersion());
      } catch(e) {
        console.log(e);
      }

      console.log("before activate");
      if (new System().getComVersion() != null && new System().getComVersion().getMinorVersion() > 1) {
        this.syntax = "000001A0-0000-0000-C000-000000000046:0.0";
        this.getEndpoint().getSyntax().setUUID(new UUID("000001A0-0000-0000-C000-000000000046"));
        this.getEndpoint().getSyntax().setVersion(0,0);
        await this.getEndpoint().rebindEndpoint(this.info);
        this.serverActivation = new RemoteSCMActivator(session.getTargetServer(), clsid);
        this.call(new Endpoint().IDEMPOTENT, serverActivation);
      } else {*/
        this.syntax = "4d9f4ab8-7d1c-11cf-861e-0020af6e7c57:0.0";
        await this.attach(this.getSyntax());
        attachcomplete = true;

        this.getEndpoint().getSyntax().setUUID(new UUID("4d9f4ab8-7d1c-11cf-861e-0020af6e7c57"));
        this.getEndpoint().getSyntax().setVersion(0,0);
        await this.getEndpoint().rebindEndpoint(this.info);
        this.serverActivation = new RemActivation(this.clsid,["39c13a4d-011e-11d0-9675-0020afd8adb3"]);
        await super.call(this.endpoint.IDEMPOTENT, this.serverActivation, this.info);
      //}
    } catch(e) {

    } finally {
      if (attachcomplete && this.serverActivation == null) {
        try {
          this.detach();
        } catch (e) {
          throw new Error("Unable to detach during init: " + e);
        }
      }
    }

    this.syntax = "00000131-0000-0000-c000-000000000046:0.0";
    if(this.serverActivation != null){
      let bindings = this.serverActivation.getDualStringArrayForOxid().getStringBindings();
      let i = 0;
      let binding = null;
      let nameBinding = null;
      let targetAddress = this.getAddress();
      targetAddress = targetAddress.substring(targetAddress.indexOf(':') +1, targetAddress.indexOf('['));

      while (i < bindings.length) {
        binding = bindings[i];
        if (binding.getTowerId() != 0x07) {
          i++;
          continue;
        }

        let index = binding.getNetworkAddress().indexOf('.');
        if (index != -1) {
          try {
            index = binding.getNetworkAddress().indexOf('[');
            if (index != -1 && binding.getNetworkAddress().substring(0, index).toUpperCase() == targetAddress) {
              break;
            }
          } catch (e) {
            
          }
        } else {
          nameBinding = binding;
          index = binding.getNetworkAddress().indexOf('[');
          if (binding.getNetworkAddress().substring(0, index).toUpperCase() == targetAddress) {
            break;
          }
        }
        i++;
      }

      if (binding == null) {
        binding = nameBinding;
      }

      let address = binding.getNetworkAddress();
      let index = address.indexOf('[');
      let hostname = binding.getNetworkAddress().substring(0, index);
      let ipAddr = new System().getIPForHostName(hostname);
      if (ipAddr != null) {
        address = String(ipAddr) + address.substring(index);
      }

      this.setAddress("ncacn_ip_tcp:" + address);
      this.remunknownIPID = this.serverActivation.getIPID();

    } else {
      console.error("Not able to create server");
    }
  }

  /**
   * @returns {ComObject} represents the ComServer, To be user only with <code>ComServer(Session, InterfacePointer, String)</code> constructor
   */
  getInstance() {
    if (!this.interfacePtrCtor) {
      throw new Error(new System().getLocalizedMessage(new ErrorCodes()._COMSTUB_WRONGCALLGETINSTANCE));
    }

    let comObject;
    
    if (this.serverInstantiated) {
      throw new Error(ErrorCodes.JI_OBJECT_ALREADY_INSTANTIATED);
    }

    comObject = FrameworkHelper.instantiateComObject(session, interfacePtrCtor);
    //increasing the reference count.
    comObject.addRef();
    this.serverInstantiated = true;

    return comObject;
  }

  getServerInterfacePointer()
  {
    return ((this.serverActivation == null) ? this.interfacePtrCtor : this.serverActivation.getMInterfacePointer());
  }

  getSyntax(){
    return this.syntax;
  }

  /**
   * Creates a new object isntance
   */
  async createInstance() {
    if (this.interfacePtrCtor != null) {
      throw new Error(String(new ErroCodes().JI_COMSTUB_WRONGCALLGETINSTANCE));
    }
    let comObject = null;

    if (this.serverInstantiated) {
      throw new Error(new ErroCodes().JI_OBJECT_ALREADY_INSTANTIATED, null);
    }

    comObject = FrameworkHelper.instantiateComObject(this.session,
        this.serverActivation.getMInterfacePointer());
    if (this.serverActivation.isDual){
      await this.session.releaseRef(this.serverActivation.getDispIpid(),
          this.serverActivation.getDispRefs());
      this.serverActivation.setDispIpid(null);
      comObject.setIsDual(true);
    } else {
      comObject.setIsDual(false);
    }

    await comObject.addRef();
    this.serverInstantiated = true;

    return comObject;
  }

  /**
   *
   * @param {String} iid
   * @param {String} ipidOfTheTargetUnknown
   */
  async getInterface(iid, ipidOfTheTargetUnknown) {
    let retVal = null;

    this.setObject(this.remunknownIPID);

    let reqUnknown = new RemUnknown(ipidOfTheTargetUnknown, iid, 5);

    try {
      await this.session.getStub2().call(new Endpoint().IDEMPOTENT, reqUnknown, this.info, 5);
    } catch (e) {
      throw new Error(e);
    }

    retVal = FrameworkHelper.instantiateComObject(this.session, reqUnknown.getInterfacePointer());

    await retVal.addRef();

    if (!iid.toLowerCase() == "00020400-0000-0000-c000-000000000046") {
      let success = true;

      let dispatch = new RemUnknown(retval.getIpid(), "00020400-0000-0000-c000-000000000046");

      try {
        await this.session.getStub2().call(new Endpoint().IDEMPOTENT, dispatch, this.info);
      } catch (e) {
        console.log(e);
        success = false;
        retVal.setIsDual(false);
      }

      if (success) {
        await this.session.releaseRef(dispatch.getInterfacePointer().getIPID(),(dispatch.getInterfacePointer().getObjectReference(new InterfacePointer().OBJREF_STANDARD)).getPublicRefs());
      }
    }
    return retVal;
  }

  /**
   *
   * @param {CallBuilder} obj
   * @param {String} targetIID
   * @param {Number} socketTimeout
   */
  async call(obj, targetIID, socketTimeout) {
    if (this.session.isSessionInDestroy() && !obj.fromDestroySession) {
      throw new Error("Sessions destroyed");
    }

    if (socketTimeout != 0) {
      this.setSocketTimeout(socketTimeout);
    } else {
      if (this.timeoutModifiedfrom0) {
        this.setSocketTimeout(socketTimeout);
      }
    }

    try {
      await this.attach(this.getSyntax());
      if (!(this.getEndpoint().getSyntax().getUUID().toString().toUpperCase() == targetIID.toUpperCase())) {
        this.getEndpoint().getSyntax().setUUID(new UUID(targetIID));
        this.getEndpoint().getSyntax().setVersion(0, 0);
        await this.getEndpoint().rebindEndpoint(this.info);
      }
      this.setObject(obj.getParentIpid());
      await super.call(new Endpoint().IDEMPOTENT, obj, this.info);
    } catch(e) {
      console.log(e);
    }

    return obj.getResults();
  }

  /**
   * 
   * @param {CallBuilder} obj 
   */
  async addRef_ReleaseRef(obj) {
    if (this.remunknownIPID == null) {
      return;
    }

    obj.setParentIpid(this.remunknownIPID);
    obj.attachSession(this.session);
    try {
      await this.call(obj, new RemUnknown().IID_Unknown);
    } catch (e) {
      throw new Error(e);
    }
  }

  /**
   * Close the current active connection
   */
  async closeStub(){
    console.log("Closing stub...");
    try {
      await this.detach();
    } catch (e) {
      throw new Error(e);
    }
  }

  /**
   *
   * @param {Number} timeout
   */
  setSocketTimeout(timeout) {
    if (timeout == 0) {
      this.timeoutModifiedfrom0 = false;
    } else {
      this.timeoutModifiedfrom0 = true;
    }
  }
}

module.exports = ComServer;
