var Stub = require('../rpc/stub.js');
var Session = require('./session.js');
var ErrorCodes = require('../common/errorcodes.js');
var Endpoint = require('../rpc/connectionorientedendpoint.js');
var Clsid = require('./clsid.js');
var Dns = require('dns');
var Oxid = require('./oxid.js');
var RemoteSCMActivator = require('./remotescmactivator.js');
var ComTransportFactory = require('../transport/comtransportfactory.js');
var UUID = require('../rpc/core/uuid.js');

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


    if (arguments.length == 3) {
      if (arguments[0] instanceof Session)
        this.comServerSession(arguments[0], arguments[1], arguments[2]);
      else if (arguments[0] instanceof Stub)
        this.comServerProgId(arguments[0], arguments[1], arguments[2]);
      else if (arguments[0] instanceof Clsid)
        this.comServerClsid(arguments[0], arguments[1], arguments[2]);
    }else if (arguments.length == 2) {

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
    if (session.isNNTLMv2Enabled()) {
      // TODO: properties
    }
    if (session.isSSOEnalbed()) {
      // TODO: properties
    }

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
  }

  comServerClsid(progId, address, session)
  {
    if (progId == null || address == null || session == null) {
      throw new Error(ErrorCodes.COMSTUB_ILLEGAL_ARGUMENTS);
    }

    if (session.getStub() != null) {
      throw new Error(ErrorCodes.SESSION_ALREADY_ESTABLISHED);
    }

    if (session.isSSOEnalbed()) {
      throw new Erro(ErrorCodes.COMSTUB_ILLEGAL_ARGUMENTS2);
    }

    this.address = address.trim();
    Dns.lookup(this.address, function(err, addr, family){
      this.address = addr;
    });

    this.address = "ncacn_ip_tcp:"+ address + "[135]";
    this.initialize(progId, this.address, session);
  }

  initialize(clsid, address, session)
  {
    super.setTransportFactory(new ComTransportFactory().getSingleTon());
    super.setAddress(address);
    if (session.isNNTLMv2Enabled()) {
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
      this.start();
    } catch (e) {
      console.log(e);
      // TODO: HUGE TO-DO, related to winReg and for the firs time well defined Exceptions were needed
    }
    this.session.setStub(this);
    this.session.setStub2(new RemUnknownServer(session, this.remunknownIPID, this.getAddress()));
  }

  start(){
    if (this.serverActivation != null && this.serverActivation.isActivationSuccessful()) {
      return;
    }

    var attachcomplete = false;
    try {
      this.syntax = "99fcfec4-5260-101b-bbcb-00aa0021347a:0.0";
      this.attach(this.getSyntax());

      attachcomplete = true;

      this.getEndpoint().getSyntax().setUUID(new UUID("99fcfec4-5260-101b-bbcb-00aa0021347a"));
      this.getEndpoint().getSyntax().setVersion(0,0);
      this.getEndpoint().rebind();
      console.log("ddbug");
      var serverAlive = new CallBuilder(true);
      serverAlive.attachSession(session);
      serverAlive.setOpnum(2);
      serverAlive.internal_COMVersion();
      console.log("init inside try");
      try {
        this.call(Endpoint.IDEMPOTENT, serverAlive);
        System.setCOMVersion(serverAlive.internal_getComVersion());
      } catch(e) {
        console.log(e);
      }

      console.log("before activate");
      if (System.getCOMVersion() != null && System.getCOMVersion().getMintorVersion() > 1) {
        this.syntax = "000001A0-0000-0000-C000-000000000046:0.0";
        this.getEndPoint().getSyntax().setUUID(new UUID("000001A0-0000-0000-C000-000000000046"));
        this.getEndpoint().getSyntax().setVersion(0,0);
        this.getEndPoint().rebindEndpoint();
        this.serverActivation = new RemoteSCMActivator(session.getTargetServer(), clsid);
        this.call(Endpoint.IDEMPOTENT, serverActivation);
      } else {
        this.syntax = "4d9f4ab8-7d1c-11cf-861e-0020af6e7c57:0.0";
        this.getEndpoint().getSyntax().setUUID(new UUID("4d9f4ab8-7d1c-11cf-861e-0020af6e7c57"));
        this.getEndpoint().getSyntax().setVersion(0,0);
        this.getEndpoint().rebindEndpoint();
        this.serverActivation = new RemActivation(clsid);
        this.call(Endpoint.IDEMPOTENT, this.serverActivation);
      }
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

    this.syntax = "00000143-0000-0000-c000-000000000046:0.0";

    var bindings = this.serverActivation.getDualStringArrayForOxid().getStringBindings();
    var i = 0;

  }

  getServerInterfacePointer()
  {
    return ((this.serverActivation == null) ? this.interfacePtrCtor : this.serverActivation.getMInterfacePointer());
  }

  getSyntax(){
    return this.syntax;
  }
}

module.exports = ComServer;
