const HashMap = require("hashmap");
const RequestCoPdu = require('./pdu/requestcopdu.js');
const NdrBuffer = require('../ndr/ndrbuffer.js');
const NetworkDataRepresentation = require('../ndr/networkdatarepresentation.js');
const ConnectionOrientedPdu = require('./connectionorientedpdu.js');
const ResponseCoPdu = require('./pdu/responsecopdu.js');
const FaultCoPdu = require('./pdu/faultCoPdu.js');
const ShutdownPdu = require('./pdu/shutdownpdu.js');
const PresentationSyntax = require('./core/presentationsyntax.js');
const PresentationContext = require('./core/presentationcontext.js');
const BindAcknowledgePdu = require('./pdu/bindacknowledgepdu.js');
const AlterContextResponsePdu = require('./pdu/altercontextresponsepdu.js');
const BasicConnectionContext = require('./basicconnectioncontext.js');
const NTLMConnectionContext = require('./security/ntlmconnectioncontext.js');
const Events = require('events');

/**
 * This class is responsible for connection oriented communications
 * in general (TCP based)
 */
class ConnectionOrientedEndpoint extends Events.EventEmitter{
  /**
   *
   * @param {ComTransport} transport
   * @param {PresentationSyntax} syntax
   */
  constructor(transport, syntax) {
    super();
    this.MAYBE = 0x01;
    this.IDEMPOTENT = 0x02;
    this.BROADCAST = 0x04;

    this.CONNECTION_CONTEXT = "rpc.connectionContext";
    try {
      this.transport = transport;

      // now we create event listeners to listen for transport events
      let self = this;
      this.transport.on('disconnected', function() {
        self.emit('disconnected');
      });
      this.syntax = syntax;
    } catch (e) {
      debug(e);
    }
    this.bound;
    this.callId;
    this.contextIdCounter = 0;
    this.contextIdToUse = this.contextIdCounter;
    this.context;
    this.uuidsVsContextIds = new HashMap();
    this.currentIID = null;
    this.locked = false;
    this.ee = new Events.EventEmitter();
    this.ee.setMaxListeners(30);
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
    //while (aux.length > 0)
      //stub.splice(aux_i++, 1, aux.shift());

    request.setStub(aux);
    request.setAllocationHint(buffer.getLength());
    request.setOpnum(opnum);
    request.setObject(object);

    if ((semantics & this.MAYBE) != 0){
      request.setFlag(new ConnectionOrientedPdu().PFC_MAYBE, true);
    }
    
    await this.send(request, info);
    
    if (request.getFlag(new ConnectionOrientedPdu().PFC_MAYBE)) return;
    var rply = await this.receive()
    .catch(function(error){
      console.log(error);
    });
    //console.log(rply);
    if (rply instanceof ResponseCoPdu){
      ndr.setFormat(rply.getFormat());
      buffer = new NdrBuffer(rply.getStub(), 0);
      await ndrobj.decode(ndr, buffer);
    } else if (rply instanceof FaultCoPdu){
      var fault = rply;
      throw fault.getStatus();
    }  else if (rply instanceof ShutdownPdu){
      throw new Error("Received shutdown request from server.");
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
    if (this.bound) return;
    if (this.context != null) {
      this.bound = true;
      
      let vsctxt = this.uuidsVsContextIds.get(this.getSyntax().toHexString().toUpperCase());
      let cid = vsctxt == undefined? vsctxt : Number.parseInt(vsctxt);
      let pdu = this.context.alter(new PresentationContext(cid == null? ++this.contextIdCounter : cid,
        this.getSyntax()));
      let sendAlter = false;

      if (cid == null){
        this.uuidsVsContextIds.set(this.getSyntax().toHexString().toUpperCase(), Number.parseInt(this.contextIdCounter));
        this.contextIdToUse = this.contextIdCounter;
        sendAlter = true;
      } else{
        this.contextIdToUse = cid;
      }

      if (sendAlter){
        if (pdu != null)await this.send(pdu, info);
        while (!this.context.isEstablished()){
          let recieved = await this.receive()
            .catch(function(rej) {
              throw new Error('ConnectionOrientedEndpoint: Bind - ' + rej);
            });;
          if ((pdu = this.context.accept(recieved)) != null){
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
            await this.send(pdu, info);
          }
        }
      }
    }else{
      await this.connect(info);
    }
  }

  async send(request, info){
    await this.bind(this.info);
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
    this.bound = true;
    this.contextIdCounter = 0;
    this.currentIID = null;

    this.uuidsVsContextIds.set(this.getSyntax().toHexString().toUpperCase(), Number.parseInt(this.contextIdCounter));
    this.context = this.createContext();

    var pdu = this.context.init(new PresentationContext(this.contextIdCounter, this.getSyntax()),
      info);
    this.contextIdToUse = this.contextIdCounter;

    if (pdu != null) await this.send(pdu, info);
    
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
        await this.send(pdu, info);
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

  acquire() {
    let self = this;
    //console.log(this.ee.listenerCount('release'));
    return new Promise(function(resolve, reject){
      if (!self.locked){
        self.locked = true;
        return resolve();
      }

      const tryAcquire = () => {
        if (!self.locked) {
          self.locked = true;
          self.ee.removeListener('release', tryAcquire);
          return resolve();
        }
      };
      self.ee.on('release', tryAcquire);
    });
  }

  release() {
    this.locked = false;
    setImmediate(() => this.ee.emit('release'));
  }
}
ConnectionOrientedEndpoint.IDEMPOTENT = ConnectionOrientedEndpoint.prototype.IDEMPOTENT;
module.exports = ConnectionOrientedEndpoint;
