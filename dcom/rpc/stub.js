const NdrObject = require("../ndr/ndrobject.js");
const PresentationSyntax = require("./core/presentationsyntax.js");
const UUID = require("./core/uuid.js");
const Endpoint = require('./connectionorientedendpoint.js');
const Events = require('events');

class Stub extends Events.EventEmitter {
  constructor(){
    super();
    this.TransportFactory;
    this.endpoint; //needed since javascript types are so loosly threated
    this.object;
    this.address;
    this.properties;
  }

  getAddress(){
    return this.address;
  }

  setAddress(address){
    if ((address == null) ? this.address == null : (address == this.address))
      return;
    this.address = address;
    try {
      this.detach();
    } catch(e) {
      throw new Error(e);
    }
  }

  getObject(){
    return this.object;
  }

  setObject(object){
    this.object = object;
  }

  getTransportFactory(){
    return this.transportFactory;
  }

  setTransportFactory(transportFactory){
    this.transportFactory = transportFactory;
  }

  getEndpoint(){
    return this.endpoint;
  }

  setEndpoint(endpoint){
    this.endpoint = endpoint;

    // now we create a listener so the server can react to endpoint events
    let self = this;
    this.endpoint.on('disconnected', function(){
      self.emit('disconnected');
    });

    this.endpoint.on('connectiontimeout', function(){
      self.emit('connectiontimeout');
    });
  }

  async detach(){
    var endpoint = this.getEndpoint();
    if (endpoint == null) return;
    try{
      await endpoint.detach();
    } finally {
      this.endpoint = null;
    }
  }

  async attach(info, timeout){
    var endpoint = this.endpoint;
    if (endpoint != null) return;
    var address = this.address;
    if (address == null) throw new Error("No address specified.");

    // first we create the transport, and the associated Endpoint
    let transport = this.getTransportFactory().createTransport(address, timeout);
    this.setEndpoint(new Endpoint(transport, new PresentationSyntax(this.getSyntax()),));

    // now we attach the Endpoint to the server
    transport = this.endpoint.transport;
    await transport.attach()
    .catch(function(reject) {
      debug(reject);
    });
  }

  async call(semantics, ndrobj, info, timeout){
    await this.attach(info, timeout);
    let object = this.getObject();
    let uuid = (object == null) ? null : new UUID(object);
    return await this.getEndpoint().call(semantics, uuid, ndrobj.getOpnum(), ndrobj, info);
  }
}

module.exports = Stub;
