// @ts-check
const Format = require('../ndr/format.js');
const NetworkDataRepresentation = require('../ndr/networkdatarepresentation.js');

var callIdCounter = 0;

/**
 * This is the main class from where all the PDU
 * classes are derived from.
 */
class ConnectionOrientedPdu {
  /**
   * Initializes a few constants. Takes no input parameters.
   */
  constructor() {
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

  /**
   * @return {Number}
   */
  getMajorVersion() {
    return this.CONNECTION_ORIENTED_MAJOR_VERSION;
  }

  /**
   * @return {Number}
   */
  getMinorVersion() {
    return this.minorVersion;
  }

  /**
   *
   * @param {Number} minorVersion
   */
  setMinorVersion(minorVersion) {
    this.minorVersion = minorVersion;
  }

  /**
   * @return {Format}
   */
  getFormat() {
    const aux = new Format(0x10000000);
    if (this.format != null) {
      this.format = this.format;
    } else {
      this.format = new Format(aux.DEFAULT_FORMAT);
    }
    return this.format;
  }

  /**
   *
   * @param {Format} format
   */
  setFormat(format) {
    this.format = format;
  }

  /**
   * @return {Number}
   */
  getFlags() {
    return this.flags;
  }

  /**
   *
   * @param {Number} flags
   */
  setFlags(flags) {
    this.flags = flags;
  }

  /**
   *
   * @param {Number} flag
   * @return {Number}
   */
  getFlag(flag) {
    return (this.getFlags() & flag) != 0;
  }

  /**
   *
   * @param {Number} flag
   * @param {Number} value
   */
  setFlag(flag, value) {
    this.setFlags(value ? (this.getFlags() | flag) : this.getFlags() & ~flag);
  }

  /**
   * @return {Number}
   */
  getCallId() {
    return this.callId;
  }

  /**
   *
   * @param {Number} callId
   */
  setCallId(callId) {
    this.useCallIdCounter = false;
    this.callId = callId;
  }

  /**
   * @return {Number}
   */
  getFragmentLength() {
    return this.fragLength;
  }

  /**
   *
   * @param {Number} fragLength
   */
  setFragmentLength(fragLength) {
    this.fragLength = fragLength;
  }

  /**
   * @return {Number}
   */
  getAuthLength() {
    return this.authLength;
  }

  /**
   *
   * @param {Number} authLength
   */
  setAuthLength(authLength) {
    this.authLength = authLength;
  }

  /**
   *
   * @param {NetworkDataRepresentation} ndr
   * @param {Array} src
   */
  decode(ndr, src) {
    ndr.setBuffer(src);
    this.readPdu(ndr);
  }

  /**
   *
   * @param {NetworkDataRepresentation} ndr
   * @param {Array} dst
   */
  encode(ndr, dst) {
    ndr.setBuffer(dst);
    ndr.setFormat(this.getFormat());
    this.writePdu(ndr);

    let buffer = ndr.getBuffer();
    let length = buffer.getLength();
    this.setFragmentLength(length);

    buffer.setIndex(this.FRAG_LENGTH_OFFSET);
    ndr.writeUnsignedShort(length);
    ndr.writeUnsignedShort(this.getAuthLength());
    buffer.setIndex(length);
  }

  /**
   *
   * @param {NetworkDataRepresentation} ndr
   */
  readPdu(ndr) {
    this.readHeader(ndr);
    this.readBody(ndr);
  }

  /**
   *
   * @param {NetworkDataRepresentation} ndr
   */
  writePdu(ndr) {
    this.writeHeader(ndr);
    this.writeBody(ndr);
  }

  /**
   *
   * @param {NetworkDataRepresentation} ndr
   */
  readHeader(ndr) {
    if (ndr.readUnsignedSmall() != this.CONNECTION_ORIENTED_MAJOR_VERSION) {
      throw new Error('Version mismatch.');
    }

    this.setMinorVersion(ndr.readUnsignedSmall());
    if (this.getType() != ndr.readUnsignedSmall()) {
      throw new Error('Incorrect PDU type.');
    }

    this.setFlags(ndr.readUnsignedSmall());
    let format = ndr.readFormat(false);
    this.setFormat(format);
    ndr.setFormat(format);
    this.setFragmentLength(ndr.readUnsignedShort());
    this.setAuthLength(ndr.readUnsignedShort());
    this.callId = Number.parseInt(ndr.readUnsignedLong());
  }

  /**
   *
   * @param {NetworkDataRepresentation} ndr
   */
  writeHeader(ndr) {
    ndr.writeUnsignedSmall(this.majorVersion);
    ndr.writeUnsignedSmall(this.minorVersion);
    ndr.writeUnsignedSmall(this.getType());
    ndr.writeUnsignedSmall(this.flags);
    ndr.writeFormatBool(false);

    ndr.writeUnsignedShort(0); // frag length, to be later overriden
    ndr.writeUnsignedShort(0); // auth length, to be later overriden
    ndr.writeUnsignedLong(this.useCallIdCounter ?
        callIdCounter++ : this.callId);
  }

  /**
   *
   * @param {NetworkDataRepresentation} ndr
   */
  readBody(ndr) {
    throw new Error(
        'Should never be called, PDUs implementation must override');
  };

  /**
   *
   * @param {NetworkDataRepresentation} ndr
   */
  writeBody(ndr) {
    throw new Error(
        'Should never be called, PDUs implementation must override');
  };

  /**
   * Should be implementend on each pdu class
   */
  getType() {
    throw new Error(
        'Should never be called, PDUs implementation must override');
  };

  /**
   * Reset the CallId counter
   */
  resetCallIdCounter() {
    callIdCounter = 0;
  }
}

module.exports = ConnectionOrientedPdu;
