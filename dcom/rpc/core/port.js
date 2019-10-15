var NdrBuffer = require("../../ndr/ndrbuffer.js");
var NdrObject = require("../../ndr/ndrobject.js");
var NetworkDataRepresentation = require("../../ndr/networkdatarepresentation.js");

function Port (portSpec){
  this.portSpec = portSpec;
}

Port.prototype.read = function (ndr){
  var length = ndr.readUnsignedShort();
  
  if (length > 0){
    var buffer = ndr.getBuffer();
    ports = new Array(length - 1);

    ndr.readCharacterArray(ports, 0, ports.length);
    ndr.readUnsignedSmall();

    this.portSpec = ports.join();
  }else{
    this.portSpec = null;
  }
}

Port.prototype.write = function (ndr){
  var spec = [];

  if (this.portSpec != null){
    spec = new Array(this.portSpec.length() + 1);
    this.portSpec.getChars(0, this.portSpec.length(), spec, 0);
  }else{
    spec = new Array(0);
  }

  ndr.writeUnsignedShort(spec.length);
  if (spec.length > 0) ndr.writeCharacterArray(spec, 0, spec.length);
}

Port.prototype.equals = function (obj) {
  if (!(obj instanceof Port)) return false;
  debug(obj);
  return (this.portSpec != null) ? this.equals(obj.portSpec) : obj.portSpec == null;
};

module.exports = Port;
