var Port = require("../core/port.js");
var PresentationResult = require("../core/presentationresult.js");
var ConnectionOrientedPdu = require("../connectionorientedpdu.js");

class AlterContextResponsePdu{
  constructor(){
    this.ALTER_CONTEXT_RESPONSE_TYPE = 0x0f;

    this.resultList;

    this.maxTransmitFragment = -1;
    this.maxReceiveFragment = -1;

    this.associationGroupId = 0;

    this.secondaryAddress;
  }

  get type(){
    return this.ALTER_CONTEXT_RESPONSE_TYPE;
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
    this.maxTransmitFragment = ndr.readUnsignedShort();
    this.maxReceiveFragment = ndr.readUnsignedShort();
    this.associationGroupId = ndr.readUnsignedLong();
    var secondaryAddress = new Port();
    secondaryAddress.read(ndr);
    this.secondaryAddress = secondaryAddress;
    ndr.getBuffer().align(4);
    var count = ndr.readUnsignedSmall();
    var resultList = [count];
    for (var i = 0; i < count; i++){
      resultList[i] = new PresentationResult();
      resultList[i].read(ndr);
    }
    this.resultList(resultList);
  }

  writeBody(){
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
