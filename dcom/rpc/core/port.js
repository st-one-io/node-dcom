// @ts-check
const NdrBuffer = require('../../ndr/ndrbuffer.js');
const NdrObject = require('../../ndr/ndrobject.js');
const NetworkDataRepresentation = require('../../ndr/networkdatarepresentation.js');

/**
 *
 * @param {Object} portSpec
 */
function Port(portSpec) {
  this.portSpec = portSpec;
}

/**
 * @param {NetworkDataRepresentation}
 */
Port.prototype.read = function(ndr) {
  let length = ndr.readUnsignedShort();
  if (length > 0) {
    let buffer = ndr.getBuffer();
    let ports = new Array(length - 1);

    ndr.readCharacterArray(ports, 0, ports.length);
    ndr.readUnsignedSmall();

    this.portSpec = ports.join();
  } else {
    this.portSpec = null;
  }
};

Port.prototype.write = function(ndr) {
  let spec = [];

  if (this.portSpec != null) {
    spec = new Array(this.portSpec.length() + 1);
    this.portSpec.getChars(0, this.portSpec.length(), spec, 0);
  } else {
    spec = new Array(0);
  }

  ndr.writeUnsignedShort(spec.length);
  if (spec.length > 0) ndr.writeCharacterArray(spec, 0, spec.length);
}

Port.prototype.equals = function(obj) {
  if (!(obj instanceof Port)) return false;
  debug(obj);
  return (this.portSpec != null) ? this.equals(obj.portSpec) : obj.portSpec == null;
};

module.exports = Port;
