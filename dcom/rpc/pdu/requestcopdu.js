// @ts-check
const ConnectionOrientedPdu = require('../connectionorientedpdu.js');
const UUID = require('../core/uuid.js');

/**
 * This class represents a dcerpc Request packet
 */
class RequestCoPdu extends ConnectionOrientedPdu {
  /**
   * Initializes a few variables. Takes no input parameter.
   */
  constructor() {
    super();

    this.stub = [];
    this.allocationHint = 0;
    this.contextId = 0;
    this.opnum = 0;
    this.object;
    this.type = 0x00;
    // this is done fragment by fragment on the original lib
    this.callIdCounter++;
    this.callId = this.callIdCounter;
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
  getOpnum() {
    return this.opnum;
  }

  /**
   * 
   * @param {Number} opnum
   */
  setOpnum(opnum) {
    this.opnum = opnum;
  }

  /**
   * @return {UUID}
   */
  getObject() {
    return this.object;
  }

  /**
   *
   * @param {UUID} object
   */
  setObject(object) {
    this.object = object;
    this.setFlag(this.PFC_OBJECT_UUID, object != null);
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
    let object = null;
    let src = ndr.getBuffer();
    this.setAllocationHint(src.dec_ndr_long());
    this.setContextId(src.dec_ndr_short());
    this.setOpnum(src.dec_ndr_short());

    if (this.getFlag(this.PFC_OBJECT_UUID)) {
      object = new UUID();
      object.decode(ndr, src);
    }
    this.setObject(object);
  }

  /**
   *
   * @param {NetworkDataRepresentation} ndr
   */
  writeBody(ndr) {
    let dst = ndr.getBuffer();
    dst.enc_ndr_long(this.getAllocationHint());
    dst.enc_ndr_short(this.getContextId());
    dst.enc_ndr_short(this.getOpnum());

    if (this.getFlag(this.PFC_OBJECT_UUID)) {
      this.getObject().encode(ndr, ndr.getBuffer());
    }
  }

  /**
   *
   * @param {NetworkDataRepresentation} ndr
   */
  readStub(ndr) {
    let src = ndr.getBuffer();
    src.align(8);

    let stub = null;
    let length = this.getFragmentLength() - src.getIndex();

    if (length > 0) {
      stub = [length];
      ndr.readOctetArray(stub, 0, length);
    }
    this.setStub(stub);
  }

  /**
   *
   * @param {NetworkDataRepresentation} ndr
   */
  writeStub(ndr) {
    let dst = ndr.getBuffer();
    dst.alignToValue(8, 0);

    let stub = this.getStub();
    if (stub != null) ndr.writeOctetArray(stub, 0, stub.length);
  }
}

RequestCoPdu.REQUEST_TYPE = 0x00;
module.exports = RequestCoPdu;
