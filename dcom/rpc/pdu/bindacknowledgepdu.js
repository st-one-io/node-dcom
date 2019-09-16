// @ts-check
const ConnectionOrientedPdu = require('../connectionorientedpdu.js');
const Port = require('../core/port.js');
const PresentationResult = require('../core/presentationresult.js');

/**
 * This class represents a BindAcknowledgePacket
 */
class BindAcknowledgePdu extends ConnectionOrientedPdu {
  /**
   * This class have a basic constructor with no input parameters
   * and a few constants definitions.
   */
  constructor() {
    super();
    this.resultList;
    this.maxTransmitFragment = this.MUST_RECEIVE_FRAGMENT_SIZE;
    this.maxReceiveFragment = this.MUST_RECEIVE_FRAGMENT_SIZE;
    this.type = 0x0c;
    this.associationGroupId = 0;
    this.secondaryAddress;
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
   * @returns {Number}
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
   * @return {Port}
   */
  getSecondaryAddress() {
    return this.secondaryAddress;
  }

  /**
   *
   * @param {Port} secondaryAddress
   */
  setSecondaryAddress(secondaryAddress) {
    this.secondaryAddress = secondaryAddress;
  }

  /**
   * @return {Array}
   */
  getResultList() {
    return this.resultList;
  }

  /**
   *
   * @param {Array} resultList
   */
  setResultList(resultList) {
    this.resultList = resultList;
  }

  /**
   *
   * @param {NetworkDataRepresentation} ndr
   */
  readBody(ndr) {
    this.setMaxTransmitFragment(ndr.readUnsignedShort());
    this.setMaxReceiveFragment(ndr.readUnsignedShort());
    this.setAssociationGroupId(Number.parseInt(ndr.readUnsignedLong()));
    const secondaryAddress = new Port();
    secondaryAddress.read(ndr);
    this.setSecondaryAddress(secondaryAddress);

    ndr.getBuffer().align(4);
    const count = ndr.readUnsignedSmall();
    const resultList = new Array(count);
    for (let i = 0; i < count; i++) {
      resultList[i] = new PresentationResult();
      resultList[i].read(ndr);
    }
    this.setResultList(resultList);
  }

  /**
   *
   * @param {NetworkDataRepresentation} ndr
   */
  writeBody(ndr) {
    ndr.writeUnsignedShort(this.getMaxTransmitFragment());
    ndr.writeUnsignedShort(this.getMaxReceiveFragment());
    ndr.writeUnsignedLong(this.getAssociationGroupId());
    let secondaryAddress = this.getSecondaryAddress();
    if (secondaryAddress == null) secondaryAddress = new Port();
    secondaryAddress.write(ndr);
    ndr.getBuffer().align(4);
    const resultList = this.getResultList();
    const count = resultList.length;
    ndr.writeUnsignedSmall(count);
    for (let i = 0; i < count; i++) {
      resultList[i].write(ndr);
    }
  }
}

BindAcknowledgePdu.BIND_ACKNOWLEDGE_TYPE = 0x0c;
module.exports = BindAcknowledgePdu;
