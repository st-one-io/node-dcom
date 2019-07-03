var ConnectionOrientedPdu = require("../connectionorientedpdu.js");
var Port = require("../core/port.js");
var PresentationResult = require("../core/presentationresult.js");

class BindAcknowledgePdu extends ConnectionOrientedPdu{
  constructor(){
    super();
    this.BIND_ACKOWLEDGE_TYPE = 0x0c;
    this.resultList;
    this.maxTransmitFragment = this.MUST_RECEIVE_FRAGMENT_SIZE;
    this.maxReceiveFragment = this.MUST_RECEIVE_FRAGMENT_SIZE;

    this.associationGroupId = 0;
    this.secondaryAddress;
  }

  getType(){
    return this.BIND_ACKNOWLEDGE_TYPE;
  }

  getMaxTransmitFragment(){
    return this.maxTransmitFragment;
  }

  setMaxTransmitFragment(maxTransmitFragment){
    this.maxTransmitFragment = maxTransmitFragment;
  }

  getMaxReceiveFragment(){
    return this.maxReceiveFragment;
  }

  setMaxReceiveFragment(maxReceiveFragment){
    this.maxReceiveFragment = maxReceiveFragment;
  }

  getAssociationGroupId(){
    return this.associationGroupId;
  }

  setAssociationGroupId(associationGroupId){
    this.associationGroupId = associationGroupId;
  }

  getSecondaryAddress(){
    return this.secondaryAddress;
  }

  setSecondaryAddress(secondaryAddress){
    this.secondaryAddress = secondaryAddress;
  }

  getResultList(){
    return this.resultList;
  }

  setResultList(resultList){
    this.resultList = resultList;
  }

  readBody(ndr){
    maxTransmitFragment(ndr.readUnsignedShort());
    maxReceiveFragment(ndr.readUnsignedShort());
    associationGroupId(Number.parseInt(ndr.readUnsignedLong()));
    var secondaryAddress = new Port();
    secondaryAddress.read(ndr);
    secondaryAddress(secondaryAddress);
    ndr.getBuffer().align(4);
    var count = ndr.readUnsignedSmall();
    var resultList = [count];
    for (var i = 0; i < count; i++) {
        resultList[i] = new PresentationResult();
        resultList[i].read(ndr);
    }
    resultList(resultList);
  }

  writeBody(ndr){
    ndr.writeUnsignedShort(maxTransmitFragment());
    ndr.writeUnsignedShort(maxReceiveFragment());
    ndr.writeUnsignedLong(associationGroupId());
    var secondaryAddress = secondaryAddress();
    if (secondaryAddress == null) secondaryAddress = new Port();
    secondaryAddress.write(ndr);
    ndr.getBuffer().align(4);
    var resultList = resultList();
    var count = resultList.length;
    ndr.writeUnsignedSmall(count);
    for (var i = 0; i < count; i++) {
        resultList[i].write(ndr);
    }
  }
}

module.exports = BindAcknowledgePdu;
