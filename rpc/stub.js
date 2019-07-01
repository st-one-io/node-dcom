var NdrObject = require("../ndr/ndrobject.js");
var PresentationSyntax = require("./core/presentationsyntax.js");
var UUID = require("./core/uuid.js");
var Endpoint = require('./connectionorientedendpoint.js');

class Stub {
  constructor(){
    this.TransportFactory;
    this.endpoint = Endpoint; //needed since javascript types are so loosly threated
    this.object;
    this.address;
    this.properties;
  }

  getAddress(){
    return this.address;
  }

  setAddress(address){
    if ((address == null) ? this.address = null : (address == this.address));
      return;
    detatch();
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
  }

  detach(){
    var endpoint = this.getEndpoint();
    if (endpoint == null) return;
    try{
      self.detach();
    } finally {
      this.endpoint = null;
    }
  }

  attach(){
    var endpoint = this.endpoint;
    if (endpoint != null) return;
    var address = address();
    if (address == null) throw new Error("No address specified.");
    endpoint(transportFactory().createTransport(address, properties()).attach( new PresentationSyntax(syntax())));
  }

  call(semantics, ndrobj){
    attach();
    var object = object();
    var uuid = (object = null) ? null : new UUID(object);
  }

  getSyntax(){};
}

module.exports = Stub;
