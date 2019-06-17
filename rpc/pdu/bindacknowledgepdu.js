var ConnectionOrientedPdu = require("../connectionorientedpdu.js");
var Port = require("../core/port.js");
var PresentationResult = require("../core/presentationresult.js");

class BindAcknowledgePdu extends ConnectionOrientedPdu{
  constructor(){
    this.BIND_ACKOWLEDGE_TYPE = 0x0c;
    this.resultList;
    this.maxTransmitFragment = MUST_RECEIVE_FRAGMENT_SIZE;
    this.maxReceiveFragment = MUST_RECEIVE_FRAGMENT_SIZE;

    this.associationGroupId = 0;
    this.secondaryAddress;
  }

  get type(){
    return this.BIND_ACKNOWLEDGE_TYPE;
  }

  get maxTransmitFragment(){
    return this.maxTransmitFragment;
  }

  set maxTransmitFragment(maxTransmitFragment){
    this.maxTransmitFragment = maxTransmitFragment;
  }

  get maxReceiveFragment(){
    return this.maxReceiveFragment;
  }

  set maxReceiveFragment(maxReceiveFragment){
    this.maxReceiveFragment = maxReceiveFragment;
  }

  get associationGroupId(){
    return this.associationGroupId;
  }

  set associationGroupId(associationGroupId){
    this.associationGroupId = associationGroupId;
  }

  get secondaryAddress(){
    return this.secondaryAddress;
  }

  set secondaryAddress(secondaryAddress){
    this.secondaryAddress = secondaryAddress;
  }

  get resultList(){
    return this.resultList;
  }

  set resultList(resultList){
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
