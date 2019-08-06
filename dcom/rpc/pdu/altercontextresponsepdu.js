var Port = require("../core/port.js");
var PresentationResult = require("../core/presentationresult.js");
var ConnectionOrientedPdu = require("../connectionorientedpdu.js");

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

  getType(){
    return this.ALTER_CONTEXT_RESPONSE_TYPE;
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
