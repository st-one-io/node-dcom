const PresentationContext = require('../core/presentationcontext.js');
const PresentationResult = require('../core/presentationresult.js');
const AlterContextPdu = require('../pdu/altercontextpdu.js');
const AlterContextResponsePdu = require('../pdu/altercontextresponsepdu.js');
const BindAcknowledgePdu = require('../pdu/bindacknowledgepdu.js');
const BindNoAcknowledgePdu = require('../pdu/bindnoacknowledgepdu.js');
const BindPdu = require('../pdu/bindPdu.js');
const FaultCoPdu = require('../pdu/faultCoPdu.js');
const ShutdownPdu = require('../pdu/shutdownpdu.js');
const DefaultConnection = require('../defaultconnection.js');
const NTLMConnection = require('./ntlmconnection.js');
const Auth3Pdu = require('../pdu/auth3pdu.js');

/**
 * Specific context for NTLM authentication
 */
class NTLMConnectionContext {
  /**
   * Initializes a few constants. Takes no input parameter.
   */
  constructor() {
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

  /**
   *
   * @param {*} context
   * @param {Object} info
   * @return {BindPdu}
   */
  init2(context, info) {
    this.established = false;
    let maxTransmit = this.DEFAULT_MAX_TRANSMIT_FRAGMENT;
    if (maxTransmit != null) {
      this.maxTransmitFragment = maxTransmit;
    }
    let maxReceive = this.DEFAULT_MAX_RECEIVE_FRAGMENT;
    if (maxReceive != null) {
      this.maxReceiveFragment = maxReceive;
    }
    let pdu = new BindPdu();
    pdu.setContextList([context]);
    pdu.setMaxTransmitFragment(this.maxTransmitFragment);
    pdu.setMaxReceiveFragment(this.maxReceiveFragment);
    this.connection = new NTLMConnection(info);
    this.assocGroupId = 0;
    return pdu;
  }

  /**
   *
   * @param {*} context
   * @param {Object} info
   * @return {*}
   */
  init(context, info) {
    let pdu = this.init2(context, info);
    pdu.resetCallIdCounter();
    return pdu;
  }

  /**
   *
   * @param {*} context
   * @return {AlterContextPdu}
   */
  alter(context) {
    this.established = false;
    let pdu = new AlterContextPdu();
    pdu.setContextList([context]);
    pdu.setAssociationGroupId(this.assocGroupId);
    return pdu;
  }

  /**
   * 
   * @param {*} pdu 
   * @return {*}
   */
  accept(pdu) {
    let results = null;

    switch (pdu.getType()) {
      case BindAcknowledgePdu.BIND_ACKNOWLEDGE_TYPE:
        let bindAck = pdu;

        results = bindAck.getResultList();
        if (results == null) {
          throw new Error('No presentation context results.');
        }
        for (let i = results.length - 1; i >= 0; i--) {
          if (results[i].result != new PresentationResult().ACCEPTANCE) {
            throw new Error('Context rejected.', results[i]);
          }
        }
        this.transmitLength = bindAck.getMaxReceiveFragment();
        this.receiveLength = bindAck.getMaxTransmitFragment();
        this.established = true;
        this.connection.setTransmitLength(this.transmitLength);
        this.connection.setReceiveLength(this.receiveLength);
        this.assocGroupId = bindAck.getAssociationGroupId();

        return new Auth3Pdu();
      case AlterContextResponsePdu.ALTER_CONTEXT_RESPONSE_TYPE:
        let alterContextResponse = pdu;
        results = alterContextResponse.getResultList();
        if (results == null) {
          throw new Error('No prsentation context results.');
        }
        for (let i = results.length - 1; i >= 0; i--) {
          if (results[i].result != new PresentationResult().ACCEPTANCE) {
            throw new Error('Context rejected.', results[i]);
          }
        }
        this.established = true;
        return null;
      case BindNoAcknowledgePdu.BIND_NO_ACKNOWLEDGE_TYPE:
        throw new Error('Unable to bind.', pdu.getRejectReason());
      case FaultCoPdu.FAULT_TYPE:
        throw new Error('Fault ocurred.', pdu.getStatus());
      case ShutdownPdu.SHUTDOWN_TYPE:
        throw new Error('Server shutdown connection.');
      case BindPdu.BIND_TYPE:
        this.established = false;
      case AlterContextPdu.ALTER_CONTEXT_TYPE:
        this.established = false;
        throw new Error('Server-side currently unsupported.');
      case Auth3Pdu.AUTH3_TYPE:
        this.established = true;
        return null;
      default:
        throw new Error('Unkonwn/unnacceptable PDU type.');
    }
  }

  /**
   * @return {NTLMConnection}
   */
  getConnection() {
    return this.connection;
  }

  /**
   * @return {Boolean}
   */
  isEstablished() {
    return this.established;
  }
}

module.exports = NTLMConnectionContext;
