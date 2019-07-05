var HashMap = require("hashmap");
var RequestCoPdu = require('./pdu/requestcopdu.js');
var NdrBuffer = require('../ndr/ndrbuffer.js');
var NetworkDataRepresentation = require('../ndr/networkdatarepresentation.js');
var ConnectionOrientedPdu = require('./connectionorientedpdu.js');
var ResponseCoPdu = require('./pdu/responsecopdu.js');
var FaultCoPdu = require('./pdu/faultCoPdu.js');
var ShutdownPdu = require('./pdu/shutdownpdu.js');
var PresentationSyntax = require('./core/presentationsyntax.js');
var PresentationContext = require('./core/presentationcontext.js');
var BindAcknowledgePdu = require('./pdu/bindacknowledgepdu.js');
var AlterContextResponsePdu = require('./pdu/altercontextresponsepdu.js');
var BasicConnectionContext = require('./basicconnectioncontext.js');
var NTLMConnectionContext = require('./security/ntlmconnectioncontext.js');

class ConnectionOrientedEndpoint{
  constructor(transport, syntax){
    this.MAYBE = 0x01;
    this.IDEMPOTENT = 0x02;
    this.BROADCAST = 0x04;

    this.CONNECTION_CONTEXT = "rpc.connectionContext";
    try{
      this.transport = transport;
      this.syntax = syntax;
    }catch(e){
      console.log(e);
    }
    this.bound;
    this.callId;
    this.contextIdCounter = 0;
    this.contextIdToUse = this.contextIdCounter;
    this.context;
    this.uuidsVsContextIds = new HashMap();
    this.currentIID = null;
  }

  getTransport(){
    return this.transport;
  }

  getSyntax(){
    return this.syntax;
  }

  call(semantics, object, opnum, ndrobj, info){
    this.bind(info);
    var request = new RequestCoPdu();
    request.setContextid(this.contextIdToUse);

    var b = [1024];
    var buffer = new NdrBuffer(b, 0);
    var ndr = new NetworkDataRepresentation();

    ndrobj.encode(ndr, buffer);
    var stub = [buffer.getLength()];
    var aux = buffer.buf.slice(0, stub.length);
    var aux_i = 0;
    while (aux.length > 0)
      stub.splice(aux_i++, 0, aux.shift());

    request.setStub(stub);
    request.setAllocationHint(buffer.getLength());
    request.setOpnum(opnum);
    requkest.setObject(object);

    if ((semantis & this.MAYBE) != 0){
      request.setFlag(ConnectionOrientedPdu.PFC_MAYBE, true);
    }

    this.send(request);

    if (request.getFlag(ConnectionOrientedPdu.PFC_MAYBE)) return;
    var rply = this.receive();
    if (rply instanceof ResponseCoPdu){
      ndr.setFormat(rply.getFormat());

      buffer = new NdrBuffer(rply.getStub(), 0);
      ndrobj.decode(ndr, buffer);
    } else if (rply instanceof FaultCoPdu){
      var fault = rply;
      throw new Error("Received fault.",fault.getStatus(), fault.getStub());
    }  else if (rply instanceof ShutdownPdu){
      throw new Error("Received shuktdown request from server.");
    } else{
      throw new Error("Received unexpected PDU from server.");
    }
  }

  rebind(info){
    this.bound = false;
    this.bind(info)
  }

  bind(info){
    console.log("bind");
    if (this.bound) return;
    if (this.context != null){
      this.bound = true;

      var cid = Number.parseInt(this.uidsVsContextIds.get(getSyntax()));
      var pdu = this.context.alter(new PresentationSyntax(cid == null? ++this.contextIdCounter : cid,
        getSyntax()));
      var sendAlter = false;

      if (cid == null){
        this.uuidsVsContextIds.put(getSyntax(), Number.parseInt(this.contextIdCounter));
        this.contextIdToUse = this.contextIdCounter;
        sendAlter = true;
      } else{
        this.contextIdToUse = cid;
      }

      if (sendAlter){
        if (pdu != null)this.send(pdu, info);
        while (!this.context.isEstablished()){
          var recieved = this.receive();

          if ((pdu = this.context.accept(received)) != null){
            switch (pdu.getType()){
              case BindAcknowledgePdu.BIND_ACKNOWLEDGE_TYPE:
                if (pdu.getResultList()[0].reason != PresentationResult.PROVIDER_REJECTION){
                  this.currentIID = String(recieved.getContextList()[0].abstractSyntax.getUuid());
                }
                break;
              case AlterContextResponsePdu.ALTER_CONTEXT_RESPONSE_TYPE:
                if (pdu.getResultList()[0].reason != PresentationResult.PROVIDER_REJECTION){
                  this.currentIID = String(recieved.getContextList()[0].abstractSyntax.getUuid());
                }
                break;
              default:
            }
            this.send(pdu, info);
          }
        }
      }
    }else{
      this.connect(info);
    }
  }

  send(request, info){
    console.log("send");
    this.bind(info);
    this.context.getConnection().transmit(request, this.getTransport(), info);
  }

  receive(){
    return this.context.getConnection().receive(this.getTransport());
  }

  detach(){
    this.bound = false;
    this.context = null;
    this.getTransport().close();
  }

  connect(info){
    console.log("connect");
    this.bound = true;
    this.contextIdCounter = 0;
    this.currentIID = null;

    this.uuidsVsContextIds.set(String(this.getSyntax()), Number.parseInt(this.contextIdCounter));
    this.context = this.createContext();

    var pdu = this.context.init(new PresentationContext(this.contextIdCounter, this.getSyntax(),
      this.properties));

    this.contextIdToUse = this.contextIdCounter;

    if (pdu != null) this.send(pdu, info);
    while (!this.context.isEstablished()){
      var recieved = this.receive();

      if ((pdu = this.context.accept(received)) != null){
        switch (pdu.getType()){
          case BindAcknowledgePdu.BIND_ACKNOWLEDGE_TYPE:
            if (pdu.getResultList()[0].reason != PresentationResult.PROVIDER_REJECTION){
              this.currentIID = String(recieved.getContextList()[0].abstractSyntax.getUuid());
            }
            break;
          case AlterContextResponsePdu.ALTER_CONTEXT_RESPONSE_TYPE:
            if (pdu.getResultList()[0].reason != PresentationResult.PROVIDER_REJECTION){
              this.currentIID = String(recieved.getContextList()[0].abstractSyntax.getUuid());
            }
            break;
          default:
        }
        this.send(pdu);
      }
    }
  }

  createContext(){
    var properties = this.properties;
    if (!properties) return this.properties = new NTLMConnectionContext();
    conso
    var context = String(properties.CONNECTION_CONTEXT);
    if(!context)return new NTLMConnectionContext();
  }
}

module.exports = ConnectionOrientedEndpoint;
