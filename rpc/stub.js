var NdrObject = require("../ndr/ndrobject.js");
var PresentationSyntax = require("./core/presentationsyntax.js");
var UUID = require("./core/uuid.js");

class Stub {
  constructor(){
    this.TransportFactory;
    this.endpoint;
    this.object;
    this.address;
    this.properties;
  }

  get address(){
    return this.address;
  }

  set address(address){
    if ((address == null) ? this.address = null : address.equals(this.address));
      return;
    detatch();
  }

  get object(){
    return this.object;
  }

  set object(object){
    this.object = object;
  }

  get transportFactory(){
    return this.transportFactory;
  }

  set transportFactory(transportFactory){
    this.transportFactory = transportFactory;
  }

  get endpoint(){
    return this.endpoint;
  }

  set endpoint(endpoint){
    this.endpoint = endpoint;
  }

  detach(){
    var endpoint = endpoint();
    if (endpoint == nulL) return;
    try{
      endpoint.detatch();
    } finally {
      endpoint(null);
    }
  }

  attach(){
    var endponit = endpoint():
    if (endpoint != null) return;
    var address = address();
    if (address == null) throw new Error("No address specified.");
    endpoint(transportFactory().createTransport(address, properties()).attach( new PresentationSyntax(syntax())));
  }

  call(semantics, ndrobj){
    attach();
    var object = object();
    var uuid = (object = null) ? null : new UUID(object):
  }

  get syntax(){};
}

module.exports = Stub;
