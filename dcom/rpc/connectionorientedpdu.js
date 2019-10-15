var Format = require("../ndr/format.js");
var NetworkDataRepresentation = require("../ndr/networkdatarepresentation.js");

var callIdCounter = 0;

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

    this.majorVersion = this.CONNECTION_ORIENTED_MAJOR_VERSION;
    this.minorVersion = 0;

    this.flags = (this.PFC_FIRST_FRAG | this.PFC_LAST_FRAG);

    this.callId = callIdCounter;

    this.useCallIdCounter = true;

    this.fragLength = 0;
    this.authLength = 0;

    this.format;
  }

  getMajorVersion(){
    return this.CONNECTION_ORIENTED_MAJOR_VERSION;
  }

  getMinorVersion(){
    return this.minorVersion;
  }

  setMinorVersion(minorVersion){
    this.minorVersion = minorVersion;
  }

  getFormat(){
    var aux = new Format(0x10000000);
    if (this.format != null) {
      this.format = this.format;
    } else {
      this.format = new Format(aux.DEFAULT_FORMAT);
    }
    return this.format;
  }

  setFormat(format){
    this.format = format;
  }

  getFlags(){
    return this.flags;
  }

  setFlags(flags){
    this.flags = flags;
  }

  getFlag(flag){
    return (this.getFlags() & flag) != 0;
  }

  setFlag(flag, value){
    this.setFlags(value ? (this.getFlags() | flag) : this.getFlags() & ~flag);
  }

  getCallId(){
    return this.callId;
  }

  setCallId(callId){
    this.useCallIdCounter = false;
    this.callId = callId;
  }

  getFragmentLength(){
    return this.fragLength;
  }

  setFragmentLength(fragLength){
    this.fragLength = fragLength;
  }

  getAuthLength(){
    return this.authLength;
  }

  setAuthLength(authLength){
    this.authLength = authLength;
  }

  decode(ndr, src){
    ndr.setBuffer(src);
    this.readPdu(ndr);
  }

  encode(ndr, dst){
    ndr.setBuffer(dst);
    ndr.setFormat(this.getFormat());
    this.writePdu(ndr);

    var buffer = ndr.getBuffer();
    var length = buffer.getLength();
    this.setFragmentLength(length);

    buffer.setIndex(this.FRAG_LENGTH_OFFSET);
    ndr.writeUnsignedShort(length);
    ndr.writeUnsignedShort(this.getAuthLength());
    buffer.setIndex(length);
  }

  readPdu(ndr){
    this.readHeader(ndr);
    this.readBody(ndr);
  }

  writePdu(ndr){
    this.writeHeader(ndr);
    this.writeBody(ndr);
  }

  readHeader(ndr){
    if (ndr.readUnsignedSmall() != this.CONNECTION_ORIENTED_MAJOR_VERSION){
      throw new Error("Version mismatch.");
    }

    this.setMinorVersion(ndr.readUnsignedSmall());
    if (this.getType() != ndr.readUnsignedSmall()){
      throw new Error("Incorrect PDU type.");
    }

    this.setFlags(ndr.readUnsignedSmall());
    var format = ndr.readFormat(false);
    this.setFormat(format);
    ndr.setFormat(format);
    this.setFragmentLength(ndr.readUnsignedShort());
    this.setAuthLength(ndr.readUnsignedShort());
    this.callId = Number.parseInt(ndr.readUnsignedLong());
  }

  writeHeader(ndr){
    ndr.writeUnsignedSmall(this.majorVersion);
    ndr.writeUnsignedSmall(this.minorVersion);
    ndr.writeUnsignedSmall(this.getType());
    ndr.writeUnsignedSmall(this.flags);
    ndr.writeFormatBool(false);

    ndr.writeUnsignedShort(0); //frag length, to be later overriden
    ndr.writeUnsignedShort(0); //auth length, to be later overriden
    ndr.writeUnsignedLong(this.useCallIdCounter ? callIdCounter++ : this.callId);
  }

  readBody(ndr){
    throw new Error("Should never be called, PDUs implementation must override");
  };

  writeBody(ndr) {
    throw new Error("Should never be called, PDUs implementation must override");
  };

  getType(){
    throw new Error("Should never be called, PDUs implementation must override");
  };

  resetCallIdCounter() {
    callIdCounter = 0;
  }
}

module.exports = ConnectionOrientedPdu;
