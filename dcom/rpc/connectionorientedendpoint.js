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

/**
 * This class is responsible for connection oriented communications
 * in general (TCP based)
 */
class ConnectionOrientedEndpoint {
  /**
   *
   * @param {ComTransport} transport
   * @param {PresentationSyntax} syntax
   */
  constructor(transport, syntax) {
    this.MAYBE = 0x01;
    this.IDEMPOTENT = 0x02;
    this.BROADCAST = 0x04;

    this.CONNECTION_CONTEXT = "rpc.connectionContext";
    try {
      this.transport = transport;
      this.syntax = syntax;
    } catch (e) {
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

  async call(semantics, object, opnum, ndrobj, info){
    await this.bind(info);
    let request = new RequestCoPdu();
    request.setContextId(this.contextIdToUse);

    let b = new Array(1024);
    let buffer = new NdrBuffer(b, 0);
    let ndr = new NetworkDataRepresentation();

    ndrobj.encode(ndr, buffer);
    let stub = new Array(buffer.getLength());
    let aux = buffer.buf.slice(0, stub.length);
    let aux_i = 0;
    while (aux.length > 0)
      stub.splice(aux_i++, 1, aux.shift());

    request.setStub(stub);
    request.setAllocationHint(buffer.getLength());
    request.setOpnum(opnum);
    request.setObject(object);

    if ((semantics & this.MAYBE) != 0){
      request.setFlag(new ConnectionOrientedPdu().PFC_MAYBE, true);
    }

    this.send(request, info);

    if (request.getFlag(new ConnectionOrientedPdu().PFC_MAYBE)) return;
    var rply = await this.receive();
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

  async rebind(info){
    this.info = info;
    this.bound = false;
    await this.bind(this.info)
  }

  /**
   *
   * @param {Object} info
   */
  async bind(info) {
    console.log("bind");
    if (this.bound) return;
    if (this.context != null) {
      this.bound = true;
      
      let vsctxt = this.uuidsVsContextIds.get(this.getSyntax().toHexString().toUpperCase());
      let cid = vsctxt == undefined? vsctxt : Number.parseInt(vsctxt);
      let pdu = this.context.alter(new PresentationContext(cid == null? ++this.contextIdCounter : cid,
        this.getSyntax()));
        let sendAlter = false;

      if (cid == null){
        this.uuidsVsContextIds.set(this.getSyntax(), Number.parseInt(this.contextIdCounter));
        this.contextIdToUse = this.contextIdCounter;
        sendAlter = true;
      } else{
        this.contextIdToUse = cid;
      }

      if (sendAlter){
        if (pdu != null)this.send(pdu, info);
        while (!this.context.isEstablished()){
          let recieved = this.receive();

          if ((pdu = this.context.accept(received)) != null){
            switch (pdu.getType()){
              case new BindAcknowledgePdu().BIND_ACKNOWLEDGE_TYPE:
                if (pdu.getResultList()[0].reason != PresentationResult.PROVIDER_REJECTION){
                  this.currentIID = String(recieved.getContextList()[0].abstractSyntax.getUuid());
                }
                break;
              case new AlterContextResponsePdu().ALTER_CONTEXT_RESPONSE_TYPE:
                if (pdu.getResultList()[0].reason != PresentationResult.PROVIDER_REJECTION){
                  this.currentIID = String(recieved.getContextList()[0].abstractSyntax.getUuid());
                }
                break;
              default:
            }
            console.log("SENDING");
            this.send(pdu, info);
          }
        }
      }
    }else{
      await this.connect(info);
    }
  }

  send(request, info){
    console.log("send");
    this.bind(this.info);
    this.context.getConnection().transmit(request, this.getTransport(), info);
  }

  async receive(){
    return await this.context.getConnection().receive(this.getTransport());
  }

  async detach(){
    this.bound = false;
    this.context = null;
    await this.getTransport().close();
  }

  async connect(info){
    console.log("connect");
    this.bound = true;
    this.contextIdCounter = 0;
    this.currentIID = null;

    this.uuidsVsContextIds.set(String(this.getSyntax()), Number.parseInt(this.contextIdCounter));
    this.context = this.createContext();

    var pdu = this.context.init(new PresentationContext(this.contextIdCounter, this.getSyntax()),
      info);
    this.contextIdToUse = this.contextIdCounter;

    if (pdu != null) this.send(pdu, info);
    
    while (!this.context.isEstablished()){
      var received = await this.receive();
      
      pdu = this.context.accept(received);

      if (pdu != null){
        switch (pdu.getType()){
          case new BindAcknowledgePdu().BIND_ACKNOWLEDGE_TYPE:
            if (pdu.getResultList()[0].reason != new PresentationResult().PROVIDER_REJECTION){
              this.currentIID = String(received.getContextList()[0].abstractSyntax.getUuid());
            }
            break;
          case new AlterContextResponsePdu().ALTER_CONTEXT_RESPONSE_TYPE:
            if (pdu.getResultList()[0].reason != new PresentationResult().PROVIDER_REJECTION){
              this.currentIID = String(received.getContextList()[0].abstractSyntax.getUuid());
            }
            break;
          default:
        }
        this.send(pdu, info);
      }
    }
  }

  createContext(info){
    var properties = this.properties;
    if (!properties) return this.properties = new NTLMConnectionContext();
    conso
    var context = String(properties.CONNECTION_CONTEXT);
    if(!context)return new NTLMConnectionContext();
  }
}

module.exports = ConnectionOrientedEndpoint;
