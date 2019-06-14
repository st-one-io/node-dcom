var NdrBuffer = require("../../ndr/ndrbuffer.js");
var NdrObject = require("../../ndr/ndrobject.js");
var NetworkDataRepresentation = require("../../ndr/networkdatarepresentation.js");

function ProtocolVersion (){
  this.majorVersion;
  this.minorVersion;
};

ProtocolVersion.prototype.getMajorVersion = function (){
  return this.majorVersion;
}

ProtocolVersion.prototype.setMajorVersion = function (majorVersion){
  this.majorVersion = majorVersion;
}

ProtocolVersion.prototype.getMinorVersion = function (){
  return this.minorVersion;
}

ProtocolVersion.prototype.setMinorVersion = function (minorVersion){
  this.minorVersion = minorVersion;
}

ProtocolVersion.prototype.encode = function (ndr, dst){
  dst.enc_ndr_small(this.majorVersion);
  dst.enc_ndr_small(this.minorVersion);
}

ProtocolVersion.prototype.decode = function (ndr, src){
  this.majorVersion = src.dec_ndr_small();
  this.minorVersion = src.dec_ndr_small();
}

module.exports = ProtocolVersion;
