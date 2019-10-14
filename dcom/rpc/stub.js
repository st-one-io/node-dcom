// @ts-check
const NdrObject = require('../ndr/ndrobject.js');
const PresentationSyntax = require('./core/presentationsyntax.js');
const UUID = require('./core/uuid.js');
const Endpoint = require('./connectionorientedendpoint.js');
const Events = require('events');
const util = require('util');
const debug = util.debuglog('dcom');

/**
 * This represents a base class for other objects from the lib.
 */
class Stub extends Events.EventEmitter {
  /**
   * This constructor don't initializes anything. No input
   * paremeter needed.
   */
  constructor() {
    super();
    this.TransportFactory;
    this.endpoint; //needed since javascript types are so loosly threated
    this.object;
    this.address;
    this.properties;
  }

  /**
   * @return {String}
   */
  getAddress() {
    return this.address;
  }

  /**
   *
   * @param {String} address
   */
  setAddress(address) {
    if ((address == null) ? this.address == null : (address == this.address)) {
      return;
    }
    this.address = address;
    try {
      this.detach();
    } catch (e) {
      throw new Error(e);
    }
  }

  /**
   * @return {Object}
   */
  getObject() {
    return this.object;
  }

  /**
   *
   * @param {Object} object
   */
  setObject(object) {
    this.object = object;
  }

  /**
   * @return {TransportFactory}
   */
  getTransportFactory() {
    return this.transportFactory;
  }

  /**
   *
   * @param {TransportFactory} transportFactory
   */
  setTransportFactory(transportFactory) {
    this.transportFactory = transportFactory;
  }

  /**
   * @return {ConnectionOrientedEndpoint}
   */
  getEndpoint() {
    return this.endpoint;
  }

  /**
   *
   * @param {ConnectionOrientedEndpoint} endpoint
   */
  setEndpoint(endpoint) {
    this.endpoint = endpoint;

    // now we create a listener so the server can react to endpoint events
    let self = this;
    this.endpoint.on('disconnected', function() {
      self.emit('disconnected');
    });

    this.endpoint.on('connectiontimeout', function() {
      self.emit('connectiontimeout');
    });
  }

  /**
   * Detach the stub from the current endpoint
   */
  async detach() {
    let endpoint = this.getEndpoint();
    if (endpoint == null) return;
    try {
      await endpoint.detach();
    } finally {
      this.endpoint = null;
    }
  }

  /**
   *
   * @param {Object} info
   * @param {Number} timeout
   */
  async attach(info, timeout) {
    let endpoint = this.endpoint;
    if (endpoint != null) return;
    let address = this.address;
    if (address == null) throw new Error('No address specified.');

    // first we create the transport, and the associated Endpoint
    let transport = this.getTransportFactory().createTransport(
        address, timeout);
    this.setEndpoint(new Endpoint(transport,
        new PresentationSyntax(this.getSyntax()),));

    // now we attach the Endpoint to the server
    transport = this.endpoint.transport;
    await transport.attach()
        .catch(function(reject) {
          debug(reject);
        });
  }

  /**
   *
   * @param {String} semantics
   * @param {Object} ndrobj
   * @param {Object} info
   * @param {Number} timeout
   */
  async call(semantics, ndrobj, info, timeout) {
    await this.attach(info, timeout);
    let object = this.getObject();
    let uuid = (object == null) ? null : new UUID(object);
    return await this.getEndpoint().call(
        semantics, uuid, ndrobj.getOpnum(), ndrobj, info);
  }
}

module.exports = Stub;
