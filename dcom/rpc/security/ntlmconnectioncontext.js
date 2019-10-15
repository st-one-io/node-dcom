var PresentationContext = require("../core/presentationcontext.js");
var PresentationResult = require("../core/presentationresult.js");
var AlterContextPdu = require("../pdu/altercontextpdu.js");
var AlterContextResponsePdu = require("../pdu/altercontextresponsepdu.js");
var BindAcknowledgePdu = require("../pdu/bindacknowledgepdu.js");
var BindNoAcknowledgePdu = require('../pdu/bindnoacknowledgepdu.js');
var BindPdu = require('../pdu/bindPdu.js');
var FaultCoPdu = require('../pdu/faultCoPdu.js');
var ShutdownPdu = require('../pdu/shutdownpdu.js');
var DefaultConnection = require('../defaultconnection.js');
var NTLMConnection = require('./ntlmconnection.js');
var Auth3Pdu = require('../pdu/auth3pdu.js');

class NTLMConnectionContext
{
  constructor()
  {
    this.DEFAULT_MAX_TRANSMIT_FRAGMENT = 4280;
    this.DEFAULT_MAX_RECEIVE_FRAGMENT = 4280;
    this.maxTransmitFragment;
    this.maxReceiveFragment;

    this.connection;
    this.established;
    this.transmitLength;
    this.receiveLength;
    this.assocGroupId;
  }

  init2(context, info)
  {
    this.established = false;
    var maxTransmit = this.DEFAULT_MAX_TRANSMIT_FRAGMENT;
    if (maxTransmit != null) {
      this.maxTransmitFragment = maxTransmit;
    }
    var maxReceive = this.DEFAULT_MAX_RECEIVE_FRAGMENT;
    if (maxReceive != null) {
      this.maxReceiveFragment = maxReceive;
    }
    var pdu = new BindPdu();
    pdu.setContextList([context]);
    pdu.setMaxTransmitFragment(this.maxTransmitFragment);
    pdu.setMaxReceiveFragment(this.maxReceiveFragment);
    this.connection = new NTLMConnection(info);
    this.assocGroupId = 0;
    return pdu;
  }

  init(context, info)
  {
    var pdu = this.init2(context, info);
    pdu.resetCallIdCounter();
    return pdu;
  }

  alter(context)
  {
    this.established = false;
    var pdu = new AlterContextPdu();
    pdu.setContextList([context]);
    pdu.setAssociationGroupId(this.assocGroupId);
    return pdu;
  }

  accept(pdu){
    var results = null;

    switch (pdu.getType()){
      case new BindAcknowledgePdu().BIND_ACKNOWLEDGE_TYPE:
        var bindAck = pdu;

        results = bindAck.getResultList();
        if (results == null){
          throw new Error("No presentation context results.");
        }
        for (var i = results.length - 1; i >= 0; i--){
          if (results[i].result != new PresentationResult().ACCEPTANCE){
            throw new Error("Context rejected.", results[i]);
          }
        }
        this.transmitLength = bindAck.getMaxReceiveFragment();
        this.receiveLength = bindAck.getMaxTransmitFragment();
        this.established = true;
        this.connection.setTransmitLength(this.transmitLength);
        this.connection.setReceiveLength(this.receiveLength);
        this.assocGroupId = bindAck.getAssociationGroupId();
        
        return new Auth3Pdu();
      case new AlterContextResponsePdu().ALTER_CONTEXT_RESPONSE_TYPE:
        var alterContextResponse = pdu;
        results = alterContextResponse.getResultList();
        if (results == null){
          throw new Error("No prsentation context results.");
        }
        for (var i = results.length - 1; i >= 0; i--){
          if (results[i].result != new PresentationResult().ACCEPTANCE){
            throw new Error("Context rejected.", results[i]);
          }
        }
        this.established = true;
        return null;
      case new BindNoAcknowledgePdu().BIND_NO_ACKNOWLEDGE_TYPE:
        throw new Error("Unable to bind.", pdu.getRejectReason());
      case new FaultCoPdu().FAULT_TYPE:
        throw new Error("Fault ocurred.", pdu.getStatus());
      case new ShutdownPdu().SHUTDOWN_TYPE:
        throw new Error("Server shutdown connection.");
      case new BindPdu().BIND_TYPE:
        this.established = false;
      case new AlterContextPdu().ALTER_CONTEXT_TYPE:
        this.established = false;
        throw new Error("Server-side currently unsupported.");
      case new Auth3Pdu().AUTH3_TYPE:
        this.established = true;
        return null;
      default:
        throw new Error("Unkonwn/unnacceptable PDU type.");
    }
  }

  getConnection()
  {
    return this.connection;
  }

  isEstablished()
  {
    return this.established;
  }
}

module.exports = NTLMConnectionContext;
