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

    this.flags = (this.PFC_FIRST_FRAG | this.PFC_LAST_FRAG);

    this.callIdCounter = 0;

    this.callId = this.callIdCounter;

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

  setFormkat(format){
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

  getCallId(){
    return this.callId;
  }

  setCallId(callId){
    this.useCallIdCounter = false;
    this.callId = callId;
  }

  getFragmentLength(){
    return this.fragmentLength;
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
    readPdu(ndr);
  }

  encode(ndr, dst){
    ndr.setBuffer(dst);
    console.log(dst);
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
    //this.writeBody(ndr);
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
    console.log(ndr.getBuffer());
    ndr.writeUnsignedSmall(this.majorVersion);
    ndr.writeUnsignedSmall(this.minorVersion);
    ndr.writeUnsignedSmall(this.type);
    ndr.writeUnsignedSmall(this.flags);
    ndr.writeFormatBool(false);

    ndr.writeUnsignedShort(0);
    ndr.writeUnsignedShort(0);
    ndr.writeUnsignedLong(this.useCallIdCounter ? this.callIdCounter : this.callId);
  }

  readBody(ndr){};

  writeBody(ndr){
    console.log("writeBody");
  };

  get type(){};
}

module.exports = ConnectionOrientedPdu;
