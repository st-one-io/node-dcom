var NdrBuffer = require("../../ndr/ndrbuffer.js");
var NetworkDataRepresentation = require("../../ndr/networkdatarepresentation.js");
var UUID = require("./uuid.js");

class PresentationSyntax{
  constructor(syntax, majorVersion, minorVersion){
    this.uuid;
    this.version;

    if (arguments.length > 0){
      // cast to object so we can use instanceof successfuly
      syntax = new String(syntax);

      if (syntax instanceof UUID) {
        this.setUUID(syntax);
        this.setVersion(majorVersion, minorVersion);
      } else if (syntax instanceof String) {
        this.parse(syntax);
      }
    }
  }

  getUUID() {
    return this.uuid;
  };

  setUUID(uuid) {
    this.uuid = uuid;
  };

  getVersion() {
    return this.version;
  };

  setVersion(version) {
    this.version = version;
  };

  getMajorVersion() {
    return this.version & 0xffff;
  };

  getMinorVersion() {
    return (this.version >> 16) & 0xffff;
  };

  setVersionTwo(majorVersion, minorVersion) {
    this.setVersion((majorVersion & 0xffff) | (minorVersion << 16));
  };

  encode(ndr, dst) {
    this.uuid.encode(ndr, dst);
    dst.enc_ndr_long(this.version);
  };

  decode(ndr, src) {
    this.uuid = new UUID();
    this.uuid.decode(ndr, src);
    this.version = src.dec_ndr_long();
  };

  toHexString() {
    return this.getUUID().toString() + ":" + this.getMajorVersion() + "." +
      this.getMinorVersion();
  };

  parse(syntax) {
    this.uuid = new UUID();
    var uuid_token = syntax.split(":")[0];
    var versions = (syntax.split(":"))[1].split(".");

    this.uuid.parse(uuid_token);
    this.setVersionTwo(versions[0], versions[1]);
  };
}
module.exports = PresentationSyntax;
