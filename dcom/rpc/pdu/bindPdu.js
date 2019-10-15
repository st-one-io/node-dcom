var ConnectionOrientedPdu = require("../connectionorientedpdu.js");
var PresentationContext = require("../core/presentationcontext.js");

class BindPdu extends ConnectionOrientedPdu{
  constructor(){
    super();
    this.BIND_TYPE = 0x0b;

    this.contextList;

    this.maxTransmitFragment = this.MUST_RECEIVE_FRAGMENT_SIZE;
    this.maxReceiveFragment = this.MUST_RECEIVE_FRAGMENT_SIZE;

    this.associationGroupId = 0;
  }

  resetCallIdCounter(){
    super.resetCallIdCounter();
  }

  getType(){
    return this.BIND_TYPE;
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

  getContextList(){
    return this.contextList;
  }

  setContextList(contextList){
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
    ndr.writeUnsignedShort(this.getMaxTransmitFragment());
    ndr.writeUnsignedShort(this.getMaxReceiveFragment());
    ndr.writeUnsignedLong(this.getAssociationGroupId());
    var contextList = this.getContextList();
    var count = contextList.length;
    ndr.writeUnsignedSmall(count);
    for (var i = 0; i < count; i++) {
        contextList[i].write(ndr);
    }
  }
}

module.exports = BindPdu;
