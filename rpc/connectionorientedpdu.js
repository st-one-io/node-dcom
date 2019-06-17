var Format = require("../ndr/format.js");
var NetworkDataRepresentation = require("../ndr/networkdatarepresentation.js");

class ConnectionOrientedPdu {
  constructor(){
    this.CONNECTION_ORIENTED_MAJOR_VERSION = 5;
    this.MUST_RECEIVE_FRAGMENT_SIZE = 7160;

    this.PFC_FIRST_FRAG = 0x01;
    this.PFC_LAST_FRAG = 0x02;

    this.PFC_PENDING_CANCEL = 0x04;

    this.PFC_CONC_MPX = 0x10;

    this.PFC_DID_NOT_EXECUTE = 0x20;

    this.PFC_MAYBE = 0x40;

    this.PFC_OBJECT_UUID = 0x80;

    this.MAJOR_VERSION_OFFSET = 0;

    this.MINOR_VERSION_OFFSET = 1;

    this.TYPE_OFFSET = 2;
    this.FLAGS_OFFSET = 3;
    this.DATA_REPRESENTATION_OFFSET = 4;
    this.FRAG_LENGTH_OFFSET =8;
    this.AUTH_LENGTH_OFFSET = 10;
    this.CALL_ID_OFFSET = 12;
    this.HEADER_LENGTH = 16;

    this.minorVersion = 0;

    this.flags = PFC_FIRST_FRAG | PFC_LAST_FRAG;

    this.callIdCounter = 0;

    this.callId = this.callIdCounter;

    this.useCallIdCounter = true;

    this.fragLength = 0;
    this.authLength = 0;

    this.format;
  }

  get majorVersion(){
    return this.CONNECTION_ORIENTED_MAJOR_VERSION;
  }

  get minorVersion(){
    return this.minorVersion;
  }

  set minorVersion(minorVersion){
    this.minorVersion = minorVersion;
  }

  get format(){
    return (this.format != null) ? format : (format = Format.DEFAULT_FORMAT);
  }

  set Formkat(format){
    this.format = format;
  }

  getFlags(){
    return this.flags;
  }

  setFlags(flags){
    this.flags = flags;
  }

  getFlag(flag){
    return (getFlags() & flag) != 0;
  }

  setFlag(flag, value){
    setFlags(value ? (getFlags() | flag) : getFlags() & ~flag);
  }

  get callId(){
    return this.callId;
  }

  set callId(callId){
    this.useCallIdCounter = false;
    this.callId = callId;
  }

  get fragmentLength(){
    return this.fragmentLength;
  }

  set fragmentLength(fragLength){
    this.fragLength = fragLength;
  }

  get authLength(){
    return this.authLength;
  }

  set authLength(authLength){
    this.authLength = authLength;
  }

  decode(ndr, src){
    ndr.setBuffer(src);
    readPdu(ndr);
  }

  encode(ndr, dst){
    ndr.setBuffer(dst);
    ndr.setFormat(this.format());
    this.writePdu(ndr);

    var buffer = ndr.getBuffer();
    var length = buffer.getLength();
    this.fragmentLength(length);

    buffer.setIndex(this.FRAG_LENGTH_OFFSET);
    ndr.writeUnsignedShort(length);
    ndr.writeUnsignedShort(this.authLength());
    buffer.setIndex(length);
  }

  readPdu(ndr){
    readHeader(ndr);
    readBody(ndr);
  }

  writePdu(ndr){
    writeHeader(ndr);
    writeBody(ndr);
  }

  readHeader(ndr){
    if (ndr.readUnsignedSmall() != this.CONNECTION_ORIENTED_MAJOR_VERSION){
      throw new Error("Version mismatch.");
    }

    this.minorVersion(ndr.readUnsignedSmall());
    if (this.type() != ndr.readUnsignedSmall()){
      throw new Error("Incorrect PDU type.");
    }

    this.flags(ndr.readUnsignedSmall());
    var format = ndr.readFormat(false);
    this.format(format);
    ndr.setFormat(format);
    this.fragmentLength(ndr.readUnsignedShort());
    this.authLength(ndr.readUnsignedShort());
    this.callId = Number.parseInt(ndr.readUnsignedShort());
  }

  writeHeader(ndr){
    ndr.writeUnsignedSmall(this.majorVersion);
    ndr.writeUnsignedSmall(this.minorVersion);
    ndr.writeUnsignedSmall(this.type);
    ndr.writeFormat(false);

    ndr.writeUnsignedShort(0);
    ndr.writeUnsignedShort(0);
    ndr.writeUnsignedLong(this.useCallIdCounter ? this.callIdCounter : this.callId);
  }

  readBody(ndr){};

  writeBody(ndr){};

  get type(){};
}

module.exports = ConnectionOrientedPdu;
