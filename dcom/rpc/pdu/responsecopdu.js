// @ts-check
const ConnectionOrientedPdu = require('../connectionorientedpdu.js');

/**
 * This class represent a dceprc Response packet
 */
class ResponseCoPdu extends ConnectionOrientedPdu {
  /**
   * Initializes a few variables. Takes no input parameter.
   */
  constructor() {
    super();
    this.stub = [];
    this.type = 0x02;
    this.allocationHint = 0;
    this.contextId = 0;
    this.cacnelCount = 0;
  }

  /**
   * @return {Number}
   */
  getType() {
    return this.type;
  }

  /**
   * @return {Array}
   */
  getStub() {
    return this.stub;
  }

  /**
   *
   * @param {Array} stub
   */
  setStub(stub) {
    this.stub = stub;
  }

  /**
   * @return {Number}
   */
  getAllocationHint() {
    return this.allocationHint;
  }

  /**
   *
   * @param {Number} allocationHint
   */
  setAllocationHint(allocationHint) {
    this.allocationHint = allocationHint;
  }

  /**
   * @return {Number}
   */
  getContextId() {
    return this.contextId;
  }

  /**
   *
   * @param {Number} contextId
   */
  setContextId(contextId) {
    this.contextId = contextId;
  }

  /**
   * @return {Number}
   */
  getCancelCount() {
    return this.cancelCount;
  }

  /**
   *
   * @param {Number} cancelCount
   */
  setCancelCount(cancelCount) {
    this.cancelCount = cancelCount;
  }

  /**
   *
   * @param {NetworkDataRepresentation} ndr
   */
  readPdu(ndr) {
    this.readHeader(ndr);
    this.readBody(ndr);
    this.readStub(ndr);
  }

  /**
   *
   * @param {NetworkDataRepresentation} ndr
   */
  writePdu(ndr) {
    this.writeHeader(ndr);
    this.writeBody(ndr);
    this.writeStub(ndr);
  }

  /**
   *
   * @param {NetworkDataRepresentation} ndr
   */
  readBody(ndr) {
    this.setAllocationHint(ndr.readUnsignedLong());
    this.setContextId(ndr.readUnsignedShort());
    this.setCancelCount(ndr.readUnsignedSmall());
  }

  /**
   *
   * @param {NetworkDataRepresentation} ndr
   */
  writeBody(ndr) {
    ndr.writeUnsignedLong(this.getAllocationHint());
    ndr.writeUnsignedShort(this.getContextId());
    ndr.readUnsignedSmall(this.getCancelCount());
  }

  /**
   *
   * @param {NetworkDataRepresentation} ndr
   */
  readStub(ndr) {
    ndr.getBuffer().align(8);
    let stub = null;
    let length = this.getFragmentLength() - ndr.getBuffer().getIndex();

    if (length > 0) {
      stub = new Array(length);
      ndr.readOctetArray(stub, 0, length);
    }
    this.setStub(stub);
  }

  /**
   *
   * @param {NetworkDataRepresentation} ndr
   */
  writeStub(ndr) {
    ndr.getBuffer().align(8, 0);
    let stub = this.getStub();
    if (stub != null) ndr.writeOctetArray(stub, 0, stub.length);
  }
}

ResponseCoPdu.RESPONSE_TYPE = 0x02;
module.exports = ResponseCoPdu;
