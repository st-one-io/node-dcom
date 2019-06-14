var NdrBuffer = require("../../ndr/ndrbuffer.js");
var NetworkDataRepresentation = require("../../ndr/networkdatarepresentation.js");
var UUID = require("./uuid.js");

function PresentationSyntax (syntax){
  this.uuid;
  this.version;
  parse(syntax);
}

PresentationSyntax.prototype.getUUID = function () {
  return this.uuid;
};

PresentationSyntax.prototype.setUUID = function (uuid) {
  this.uuid = uuid;
};

PresentationSyntax.prototype.getVersion = function () {
  return this.version;
};

PresentationSyntax.prototype.setVersion = function (version) {
  this.version = version;
};

PresentationSyntax.prototype.getMajorVersion = function () {
  return version & 0xffff;
};

PresentationSyntax.prototype.getMinorVersion = function () {
  return (version >> 16) & 0xffff;
};

PresentationSyntax.prototype.setVersionTwo = function (majorVersion, minorVersion) {
  this.setVersion((majorVersion & 0xffff) | (minorVersion << 16));
};

PresentationSyntax.prototype.encode = function (ndr, dst) {
  this.uuid.encode(ndr, dst);
  dst.enc_ndr_long(version);
};

PresentationSyntax.prototype.decode = function (ndr, src) {
  this.uuid = new UUID();
  this.uuid.decode(ndr, src);
  this.version = src.dec_ndr_long();
};

PresentationSyntax.prototype.toHexString = function () {
  return this.getUUID.toString() + ":" + this.getMajorVersion() + "." +
    this.getMinorVersion();
};

PresentationSyntax.prototype.parse = function (syntax) {
  this.uuid = new UUID();
  var uuid_token = syntax.split(":")[0];
  var versions = (syntax.split(":"))[1].split(".");

  this.uuid.parse(uuid_token);
  this.setVersionTwo(versions[0], versions[1]);
};

module.exports = PresentationSyntax;
