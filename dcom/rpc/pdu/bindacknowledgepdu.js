const ConnectionOrientedPdu = require("../connectionorientedpdu.js");
const Port = require("../core/port.js");
const PresentationResult = require("../core/presentationresult.js");

class BindAcknowledgePdu extends ConnectionOrientedPdu{
  constructor(){
    super();
    this.BIND_ACKNOWLEDGE_TYPE = 0x0c;
    this.resultList;
    this.maxTransmitFragment = this.MUST_RECEIVE_FRAGMENT_SIZE;
    this.maxReceiveFragment = this.MUST_RECEIVE_FRAGMENT_SIZE;

    this.associationGroupId = 0;
    this.secondaryAddress;
  }

  /**
   * @returns {Number}
   */
  getType(){
    return this.BIND_ACKNOWLEDGE_TYPE;
  }

  /**
   * @returns {Number}
   */
  getMaxTransmitFragment(){
    return this.maxTransmitFragment;
  }

  /**
   * 
   * @param {Number} maxTransmitFragment 
   */
  setMaxTransmitFragment(maxTransmitFragment){
    this.maxTransmitFragment = maxTransmitFragment;
  }

  /**
   * @returns {Number}
   */
  getMaxReceiveFragment(){
    return this.maxReceiveFragment;
  }

  /**
   * 
   * @param {Number} maxReceiveFragment 
   */
  setMaxReceiveFragment(maxReceiveFragment){
    this.maxReceiveFragment = maxReceiveFragment;
  }

  /**
   * @returns {Number}
   */
  getAssociationGroupId(){
    return this.associationGroupId;
  }

  /**
   * 
   * @param {Number} associationGroupId 
   */
  setAssociationGroupId(associationGroupId){
    this.associationGroupId = associationGroupId;
  }

  /**
   * @returns {Number}
   */
  getSecondaryAddress(){
    return this.secondaryAddress;
  }

  /**
   * 
   * @param {Number} secondaryAddress 
   */
  setSecondaryAddress(secondaryAddress){
    this.secondaryAddress = secondaryAddress;
  }

  /**
   * @returns {Array}
   */
  getResultList(){
    return this.resultList;
  }

  /**
   * 
   * @param {Array} resultList 
   */
  setResultList(resultList){
    this.resultList = resultList;
  }

  /**
   * 
   * @param {NetworkDataRepresentation} ndr 
   */
  readBody(ndr){
    this.setMaxTransmitFragment(ndr.readUnsignedShort());
    this.setMaxReceiveFragment(ndr.readUnsignedShort());
    this.setAssociationGroupId(Number.parseInt(ndr.readUnsignedLong()));
    let secondaryAddress = new Port();
    secondaryAddress.read(ndr);
    this.setSecondaryAddress(secondaryAddress);

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
  writeBody(ndr){
    ndr.writeUnsignedShort(maxTransmitFragment());
    ndr.writeUnsignedShort(maxReceiveFragment());
    ndr.writeUnsignedLong(associationGroupId());
    let secondaryAddress = secondaryAddress();
    if (secondaryAddress == null) secondaryAddress = new Port();
    secondaryAddress.write(ndr);
    ndr.getBuffer().align(4);
    let resultList = resultList();
    let count = resultList.length;
    ndr.writeUnsignedSmall(count);
    for (let i = 0; i < count; i++) {
        resultList[i].write(ndr);
    }
  }
}

module.exports = BindAcknowledgePdu;
