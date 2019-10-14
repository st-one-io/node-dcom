// @ts-check
const ConnectionOrientedPdu = require('../connectionorientedpdu.js');
const PresentationContext = require('../core/presentationcontext.js');

/**
 * This class represents the Bind dcerpc data packet
 */
class BindPdu extends ConnectionOrientedPdu {
  /**
   * Initializes a few variables and receives no input parameters
   */
  constructor() {
    super();

    this.contextList;
    this.type = 0x0b;
    this.maxTransmitFragment = this.MUST_RECEIVE_FRAGMENT_SIZE;
    this.maxReceiveFragment = this.MUST_RECEIVE_FRAGMENT_SIZE;

    this.associationGroupId = 0;
  }

  /**
   * Reset the CallId counter to 0
   */
  resetCallIdCounter() {
    super.resetCallIdCounter();
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
  getMaxTransmitFragment() {
    return this.maxTransmitFragment;
  }

  /**
   *
   * @param {Number} maxTransmitFragment
   */
  setMaxTransmitFragment(maxTransmitFragment) {
    this.maxTransmitFragment = maxTransmitFragment;
  }

  /**
   * @return {Number}
   */
  getMaxReceiveFragment() {
    return this.maxReceiveFragment;
  }

  /**
   *
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
    this.setMaxTransmitFragment(ndr.readUnsignedShort());
    this.setMaxReceiveFragment(ndr.readUnsignedShort());
    this.setAssociationGroupId(Number.parseInt(ndr.readUnsignedLong()));
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
    ndr.writeUnsignedShort(this.getMaxTransmitFragment());
    ndr.writeUnsignedShort(this.getMaxReceiveFragment());
    ndr.writeUnsignedLong(this.getAssociationGroupId());
    let contextList = this.getContextList();
    let count = contextList.length;
    ndr.writeUnsignedSmall(count);
    for (let i = 0; i < count; i++) {
      contextList[i].write(ndr);
    }
  }
}

BindPdu.BIND_TYPE = 0x0b;
module.exports = BindPdu;
