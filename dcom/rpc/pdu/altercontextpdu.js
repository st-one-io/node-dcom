// @ts-check
const ConnectionOrientedPdu = require('../connectionorientedpdu.js');
const PresentationContext = require('../core/presentationcontext.js');

/**
 * This class represents an AlterContext data packet
 */
class AlterContextPdu extends ConnectionOrientedPdu {
  /**
   * Initializes a few variables and receive no input parameter
   */
  constructor() {
    super();
    this.contextList;
    this.type = 0x0e;
    this.maxTransmitFramgent = -1;
    this.maxReceiveFragment = -1;

    this.associationGroupId = 0;
  }

  /**
   * @return {Number}
   */
  getType() {
    return this.type;
  }

  /**
   * @return {Number}
   */
  getMaxTransmitFramgent() {
    return this.maxTransmitFramgent;
  }

  /**
   * @param {Number} maxTransmitFramgent
   */
  setMaxTransmitFramgent(maxTransmitFramgent) {
    this.maxTransmitFramgent = maxTransmitFramgent;
  }

  /**
   * @return {Number}
   */
  getMaxReceiveFragment() {
    return this.maxReceiveFragment;
  }

  /**
   * @param {Number} maxReceiveFragment
   */
  setMaxReceiveFragment(maxReceiveFragment) {
    this.maxReceiveFragment = maxReceiveFragment;
  }

  /**
   * @return {Number}
   */
  getAssociationGroupId() {
    return this.associationGroupId;
  }

  /**
   *
   * @param {Number} associationGroupId
   */
  setAssociationGroupId(associationGroupId) {
    this.associationGroupId = associationGroupId;
  }

  /**
   * @return {Array}
   */
  getContextList() {
    return this.contextList;
  }

  /**
   * 
   * @param {Array} contextList
   */
  setContextList(contextList) {
    this.contextList = contextList;
  }

  /**
   * 
   * @param {NetworkDataRepresentation} ndr
   */
  readBody(ndr) {
    this.maxTransmitFramgent = ndr.readUnsingedShort();
    this.maxReceiveFragment = ndr.readUnsingedShort();
    this.associationGroupId = Number.parseInt(ndr.readUnsingedShort());
    let count = ndr.readUnsignedSmall();
    let contextList = [count];
    for (let i = 0; i < count; i++) {
      contextList[i] = new PresentationContext();
      contextList[i].read(ndr);
    }
    this.setContextList(contextList);
  }

  /**
   *
   * @param {NetworkDataRepresentation} ndr
   */
  writeBody(ndr) {
    let maxTransmitFramgent = this.getMaxTransmitFramgent();
    let maxReceiveFragment = this.getMaxReceiveFragment();
    ndr.writeUnsignedShort((maxTransmitFramgent == -1) ?
        ndr.getBuffer().getCapacity() : this.getMaxTransmitFramgent());
    ndr.writeUnsignedShort((maxReceiveFragment == -1) ?
        ndr.getBuffer().getCapacity() : this.getMaxReceiveFragment());
    ndr.writeUnsignedLong(this.getAssociationGroupId());
    let contextList = this.getContextList();
    let count = contextList.length;
    ndr.writeUnsignedSmall(count);
    for (let i = 0; i < count; i++) {
      contextList[i].write(ndr);
    }
  }
}

AlterContextPdu.ALTER_CONTEXT_TYPE = 0x0e;
module.exports = AlterContextPdu;
