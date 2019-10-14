// @ts-check
const ConnectionOrientedPdu = require('../connectionorientedpdu.js');
const FaultCodes= require('../faultcodes.js');

/**
 * This class represents a Fault dceprc packet
 */
class FaultCoPdu extends ConnectionOrientedPdu {
  /**
   * Intiializes a few variables and receives no parameter
   */
  constructor() {
    super();

    this.stub;
    this.allocationHint = 0;
    this.contextId = 0;
    this.type = 0x03;
    this.cancelCount = 0;
    this.status = FaultCodes.UNSPECIFIED_REJECTION;
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
   * @return {Number}
   */
  getStatus() {
    return this.status;
  }

  /**
   *
   * @param {Number} status
   */
  setStatus(status) {
    this.status = status;
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
   * @param {NetworkDataRepresenation} ndr
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
    this.setStatus(Number.parseInt(ndr.readUnsignedLong()));
  }

  /**
   *
   * @param {NetworkDataRepresentation} ndr
   */
  writeBody(ndr) {
    ndr.writeUnsignedLong(this.getAllocationHint());
    ndr.writeUnsignedShort(this.getContextId());
    ndr.writeUnsignedSmall(this.getCancelCount());
    ndr.writeUnsignedLong(this.getStatus());
  }

  /**
   *
   * @param {NetworkDataRepresentation} ndr
   */
  readStub(ndr) {
    let buf = ndr.getBuffer();
    buf.align(8);

    let stub = null;
    let length = this.getFragmentLength() - buf.getIndex();

    if (length > 0) {
      stub = [length];
      stub = ndr.readOctetArray(stub, 0, length);
    }
    this.setStub(stub);
  }

  /**
   *
   * @param {NetworkDataRepresentation} ndr
   */
  writeStub(ndr) {
    let buf = ndr.getBuffer();
    buf.align(8, 0);

    let stub = this.getStub();
    if (stub != null) {
      ndr.writeOctetArray(stub, 0, stub.length);
    }
  }
}

FaultCoPdu.FAULT_TYPE = 0x03;
module.exports = FaultCoPdu;
