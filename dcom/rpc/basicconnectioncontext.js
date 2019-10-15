var PresentationContext = require("./core/presentationcontext.js");
var PresentationResult = require("./core/presentationresult.js");
var AlterContextPdu = require("./pdu/altercontextpdu.js");
var AlterContextResponsePdu = require("./pdu/altercontextresponsepdu.js");
var BindAcknowledgePdu = require("./pdu/bindacknowledgepdu.js");
var BindNoAcknowledgePdu = require('./pdu/bindnoacknowledgepdu.js');
var BindPdu = require('./pdu/bindPdu.js');
var FaultCoPdu = require('./pdu/faultCoPdu.js');
var ShutdownPdu = require('./pdu/shutdownpdu.js');
var DefaultConnection = require('./defaultconnection.js');

class BasicConnectionContext {
  constructor(){
    this.DEFAULT_MAX_TRANSMIT_FRAGMENT = 4280;
    this.DEFAULT_MAX_RECEIVE_FRAGMENT = 4280;

    this.maxTransmitFragment = this.DEFAULT_MAX_TRANSMIT_FRAGMENT;
    this.maxReceiveFragment = this.DEFAULT_MAX_RECEIVE_FRAGMENT;

    this.MAX_TRANSMIT_FRAGMENT = this.maxTransmitFragment;
    this.MAX_RECEIVE_FRAGMENT = this.maxReceiveFragment;

    this.connection;
    this.established;
    this.transmitLength;
    this.receiveLength;
  }

  init(context){
    this.established = false;
    this.connection = new DefaultConnection()
    //if (properties != null){
    var maxTransmit = this.MAX_TRANSMIT_FRAGMENT;
    if (maxTransmit != null){
      this.maxTransmitFragment = Number.parseInt(maxTransmit);
    }
    var maxReceive = this.MAX_RECEIVE_FRAGMENT;
    if (maxReceive != null){
      this.maxReceiveFragment = Number.parseInt(maxReceive);
    }
    //}
    var pdu = new BindPdu();
    pdu.setContextList([context]);
    pdu.setMaxTransmitFragment(this.maxTransmitFragment);
    pdu.setMaxReceiveFragment(this.maxReceiveFragment);
    return pdu;
  }

  alter(context){
    this.established = false;
    var pdu = new AlterContextPdu();
    pdu.setContextList([context]);
    return pdu;
  }

  accept(pdu){
    var results = null;
    switch (pdu.getType()){
      case BindAcknowledgePdu.BIND_ACKNOWLEDGE_TYPE:
        var bindAck = pdu;
        results = bindAck.getResultList();
        if (results == null){
          throw new Error("No presentation context results.");
        }
        for (var i = results.length - 1; i >= 0; i--){
          if (results[i].result != PresentationResult.ACCEPTANCE){
            throw new Error("Context rejected.", results[i]);
          }
        }
        this.transmitLength = bindAck.getMaxReceiveFragment();
        this.receiveLength = bindAck.getMaxTransmitFragmetn();
        this.established = true;
        this.connection = new DefaultConnection(transmitLength, receiveLength);
        return null;
      case AlterContextResponsePdu.ALTER_CONTEXT_RESPONSE_TYPE:
        var alterContextResponse = pdu;
        results = alterContextResponse.getResultList();
        if (results == null){
          throw new Error("No prsentation context results.");
        }
        for (var i = reults.length - 1; i >= 0; i--){
          if (results[i].result != PresentationResult.ACCEPTANCE){
            throw new Error("Context rejected.", results[i]);
          }
        }
        this.established = true;
        return null;
      case BindNoAcknowledgePdu.BIND_NO_ACKNOWLEDGE_TYPE:
        throw new Error("Unable to bind.", pdu.getRejectReason());
      case FaultCoPdu.FAULT_TYPE:
        throw new Error("Fault ocurred.", pdu.getStatus());
      case ShutdownPdu.SHUTDOWN_TYPE:
        throw new Error("Server shutdown connection.");
      case BindPdu.BIND_TYPE:
      case AlterContextPdu.ALTER_CONTEXT_TYPE:
        throw new Error("Server-side currently unsupported.");
      default:
        throw new Error("Unkonwn/unnacceptable PDU type.");
    }
  }

  getConnection(){
    return this.connection;
  }

  isEstablished(){
    return this.restablished;
  }
}

module.exports = BasicConnectionContext;
