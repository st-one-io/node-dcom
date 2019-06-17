var ConnectionOrientedPdu = require("../connectionorientedpdu.js");
var PresentationContext = require("../core/presentationcontext.js");

class BindPdu extends ConnectionOrientedPdu{
  constructor(){
    this.BIND_TYPE = 0x0b;

    this.contextList;

    this.maxTransmitFragment = MUST_RECEIVE_FRAGMENT_SIZE;
    this.maxReceiveFragment = MUST_RECEIVE_FRAGMENT_SIZE;

    this.associationGroupId = 0;
  }

  resetCallIdCounter(){
    super.resetCallIdCounter;
  }

  get type(){
    return this.BIND_TYPE;
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

  get contextList(){
    return this.contextList;
  }

  set contextList(contextList){
    this.contextList = contextList;
  }

  readBody(ndr){
    maxTransmitFragment(ndr.readUnsignedShort());
    maxReceiveFragment(ndr.readUnsignedShort());
    associationGroupId(Number.parseInt(ndr.readUnsignedLong()));
    var count = ndr.readUnsignedSmall();
    var contextList = [count];
    for (var i = 0; i < count; i++) {
      contextList[i] = new PresentationContext();
      contextList[i].read(ndr);
    }
    contextList(contextList);
  }

  writeBody(ndr){
    ndr.writeUnsignedShort(maxTransmitFragment());
    ndr.writeUnsignedShort(maxReceiveFragment());
    ndr.writeUnsignedLong(associationGroupId());
    var contextList = getContextList();
    var count = contextList.length;
    ndr.writeUnsignedSmall(count);
    for (var i = 0; i < count; i++) {
        contextList[i].write(ndr);
    }
  }
}

module.exports = BindPdu;
