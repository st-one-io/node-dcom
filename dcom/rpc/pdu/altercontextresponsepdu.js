const Port = require("../core/port.js");
const PresentationResult = require("../core/presentationresult.js");
const ConnectionOrientedPdu = require("../connectionorientedpdu.js");

class AlterContextResponsePdu extends ConnectionOrientedPdu{
  constructor(){
    super();
    this.ALTER_CONTEXT_RESPONSE_TYPE = 0x0f;

    this.resultList;

    this.maxTransmitFragment = -1;
    this.maxReceiveFragment = -1;

    this.associationGroupId = 0;

    this.secondaryAddress;
  }

  /**
   * @returns {Number}
   */
  getType(){
    return this.ALTER_CONTEXT_RESPONSE_TYPE;
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
   * @returns {Array}
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
    this.maxTransmitFragment = ndr.readUnsignedShort();
    this.maxReceiveFragment = ndr.readUnsignedShort();
    this.associationGroupId = ndr.readUnsignedLong();
    var secondaryAddress = new Port();
    secondaryAddress.read(ndr);
    this.secondaryAddress = secondaryAddress;
    ndr.getBuffer().align(4);
    var count = ndr.readUnsignedSmall();
    var resultList = new Array(count);
    for (var i = 0; i < count; i++){
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
    var maxTransmitFragment = maxTransmitFragment();
    var maxReceiveFragment = maxReceiveFragment();
    ndr.writeUnsignedShort((maxTransmitFragment() == -1) ?
      ndr.getBuffer().getCapacity() : maxTransmitFragment);
    ndr.writeUnsignedShort((maxReceiveFragment() == -1) ?
      ndr.getBuffer().getCapacity() : maxReceiveFragment);
    ndr.writeUnsignedLong(associationGroupId());
    var secondaryAddress = secondaryAddress();
    if (secondaryAddress == null) secondaryAddress = new Port();
    secondaryAddress.write(ndr);
    ndr.getBuffer().align(4);
    var resultList = resultList();
    var count = resultList.length;
    ndr.writeUnsignedSmall(Numbaer.parseInt(count));
    for (var i = 0; i < count; i++){
      resultList[i].write(ndr);
    }
  }
}

module.exports = AlterContextResponsePdu;
