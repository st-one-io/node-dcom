const NdrBuffer = require('../../ndr/ndrbuffer.js');
const NdrObject = require('../../ndr/ndrobject.js');
const NetworkDataRepresentation = require('../../ndr/networkdatarepresentation.js');

/**
 * Instantiates the object.
 */
function ProtocolVersion() {
  this.majorVersion;
  this.minorVersion;
};

/**
 * @return {Number}
 */
ProtocolVersion.prototype.getMajorVersion = function() {
  return this.majorVersion;
};

/**
 * @param {Number} majorVersion
 */
ProtocolVersion.prototype.setMajorVersion = function(majorVersion) {
  this.majorVersion = majorVersion;
};

/**
 * @return {Number}
 */
ProtocolVersion.prototype.getMinorVersion = function() {
  return this.minorVersion;
};

/**
 * @param {Number} minorVersion
 */
ProtocolVersion.prototype.setMinorVersion = function(minorVersion) {
  this.minorVersion = minorVersion;
};

/**
 * @param {NetworkDataRepresentation} ndr
 * @param {NdrBuffer} dst
 */
ProtocolVersion.prototype.encode = function(ndr, dst) {
  dst.enc_ndr_small(this.majorVersion);
  dst.enc_ndr_small(this.minorVersion);
};

/**
 * @param {NetworkDataRepresentation} ndr
 * @param {NdrBuffer} src
 */
ProtocolVersion.prototype.decode = function(ndr, src) {
  this.majorVersion = src.dec_ndr_small();
  this.minorVersion = src.dec_ndr_small();
};

module.exports = ProtocolVersion;
