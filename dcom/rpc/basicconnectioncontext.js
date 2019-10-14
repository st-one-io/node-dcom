// @ts-check
const PresentationResult = require('./core/presentationresult.js');
const AlterContextPdu = require('./pdu/altercontextpdu.js');
const AlterContextResponsePdu = require('./pdu/altercontextresponsepdu.js');
const BindAcknowledgePdu = require('./pdu/bindacknowledgepdu.js');
const BindNoAcknowledgePdu = require('./pdu/bindnoacknowledgepdu.js');
const BindPdu = require('./pdu/bindPdu.js');
const FaultCoPdu = require('./pdu/faultCoPdu.js');
const ShutdownPdu = require('./pdu/shutdownpdu.js');
const DefaultConnection = require('./defaultconnection.js');

/**
 * This class represents a basic connectio context. So far this lib supports
 * only one type of context but if more are to be implemented, this class 
 * should be used as a a base.
 */
class BasicConnectionContext {
  /**
   * Constructor class. Defines a couple of global values but receives no
   * parameters.
   */
  constructor() {
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

  /**
   *
   * @param {PresentationContext} context
   * @return {BindPdu}
   */
  init(context) {
    this.established = false;
    this.connection = new DefaultConnection();

    const maxTransmit = this.MAX_TRANSMIT_FRAGMENT;
    if (maxTransmit != null) {
      this.maxTransmitFragment = Number.parseInt(maxTransmit);
    }
    const maxReceive = this.MAX_RECEIVE_FRAGMENT;
    if (maxReceive != null) {
      this.maxReceiveFragment = Number.parseInt(maxReceive);
    }
    let pdu = new BindPdu();
    pdu.setContextList([context]);
    pdu.setMaxTransmitFragment(this.maxTransmitFragment);
    pdu.setMaxReceiveFragment(this.maxReceiveFragment);
    return pdu;
  }

  /**
   *
   * @param {PresentationContext} context
   * @return {AlterContextPdu}
   */
  alter(context) {
    this.established = false;
    let pdu = new AlterContextPdu();
    pdu.setContextList([context]);
    return pdu;
  }

  /**
   *
   * @param {*} pdu
   * @return {null} 
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
          if (results[i].result != PresentationResult.ACCEPTANCE) {
            throw new Error('Context rejected.', results[i]);
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
        if (results == null) {
          throw new Error('No prsentation context results.');
        }
        for (var i = reults.length - 1; i >= 0; i--) {
          if (results[i].result != PresentationResult.ACCEPTANCE) {
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
      case AlterContextPdu.ALTER_CONTEXT_TYPE:
        throw new Error('Server-side currently unsupported.');
      default:
        throw new Error('Unkonwn/unnacceptable PDU type.');
    }
  }

  /**
   * @returns {*Connection}
   */
  getConnection() {
    return this.connection;
  }

  /**
   * @returns {Boolean}
   */
  isEstablished() {
    return this.restablished;
  }
}

module.exports = BasicConnectionContext;
