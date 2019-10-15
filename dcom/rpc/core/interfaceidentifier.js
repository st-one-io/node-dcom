var NdrObject = require("../../ndr/ndrobject.js");

function InterfaceIdentifier (syntax){
  this.uuid;
  this.majorVersion;
  this.minorVersion;
  this.parse(syntax);
}

InterfaceIdentifier.prototype.getUUID = function () {
  return this.uuid;
};

InterfaceIdentifier.prototype.setUUID = function (uuid) {
  this.uuid = uuid;
};

InterfaceIdentifier.prototype.getMajorVersion = function () {
  return this.majorVersion;
};

InterfaceIdentifier.prototype.setMajorVersion = function (majorVersion) {
  this.majorVersion = majorVersion;
};

InterfaceIdentifier.prototype.getMinorVersion = function () {
  return this.minorVersion;
};

InterfaceIdentifier.prototype.setMinorVersion = function (minorVersion) {
  this.minorVersion = minorVersion;
};

InterfaceIdentifier.prototype.toString = function () {
  return this.getUUID().toString() + ":" + this.getMajorVersion() + "." + this.getMinorVersion();
};

InterfaceIdentifier.prototype.parse = function (syntax) {
  var uuid = syntax.split(":")[0];
  var versions = (syntax.split(":"))[1].split(".");
  this.setUUID(uuid);
  this.setMajorVersion(versions[0]);
  this.setMinorVersion(versions[1]);
};

module.exports = InterfaceIdentifier;
