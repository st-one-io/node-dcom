// @ts-check
const Port = require('../core/port.js');
const PresentationResult = require('../core/presentationresult.js');
const ConnectionOrientedPdu = require('../connectionorientedpdu.js');

/**
 * This class represents the response equivalent to the AlterContext packet
 */
class AlterContextResponsePdu extends ConnectionOrientedPdu {
  /**
   * Initializes a few variables but takes no input parameter
   */
  constructor() {
    super();

    this.resultList;
    this.type = 0x0f;
    this.maxTransmitFragment = -1;
    this.maxReceiveFragment = -1;

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
    this.maxTransmitFragment = ndr.readUnsignedShort();
    this.maxReceiveFragment = ndr.readUnsignedShort();
    this.associationGroupId = ndr.readUnsignedLong();
    let secondaryAddress = new Port();
    secondaryAddress.read(ndr);
    this.secondaryAddress = secondaryAddress;
    ndr.getBuffer().align(4);
    let count = ndr.readUnsignedSmall();
    let resultList = new Array(count);
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
    let maxTransmitFragment = maxTransmitFragment();
    let maxReceiveFragment = maxReceiveFragment();
    ndr.writeUnsignedShort((maxTransmitFragment() == -1) ?
      ndr.getBuffer().getCapacity() : maxTransmitFragment);
    ndr.writeUnsignedShort((maxReceiveFragment() == -1) ?
      ndr.getBuffer().getCapacity() : maxReceiveFragment);
    ndr.writeUnsignedLong(associationGroupId());
    let secondaryAddress = secondaryAddress();
    if (secondaryAddress == null) secondaryAddress = new Port();
    secondaryAddress.write(ndr);
    ndr.getBuffer().align(4);
    let resultList = resultList();
    let count = resultList.length;
    ndr.writeUnsignedSmall(Numbaer.parseInt(count));
    for (let i = 0; i < count; i++) {
      resultList[i].write(ndr);
    }
  }
}

AlterContextResponsePdu.ALTER_CONTEXT_RESPONSE_TYPE = 0x0f;
module.exports = AlterContextResponsePdu;
