var ndrObject = require("../../ndr/ndrobject.js");
var UUID = require("./uuid.js");

function ContextHandle (attributes, uuid){
  this.attributes = setAttributes(uuid);
  this.uuid = new UUID(uuid);
};

contextHandle.prototype.getAttributes = function (){
  return this.attributes;
}

contextHandle.prototype.setAttributes = function (attributes){
  this.attributes = attributes;
}

contextHandle.prototype.getUUID = function (){
  return this.uuid;
}

contextHandle.prototype.setUUID = function (){
  this.uuid = uuid;
}

module.exports = ContextHandle;
