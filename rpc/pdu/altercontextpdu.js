var ConnectionOrientedPdu = require("../connectionorientedpdu.js");
var PresentationContext = require("../core/presentationcontext.js");
class AlterContextPdu {
  constructor(){
    this.ALTER_CONTEX_TYPE = 0x0e;

    this.contextList;

    this.maxTransmitFramgent = -1;
    this.maxReceiveFragment = -1;

    this.associationGroupId = 0;
  }

  get type(){
    return this.ALTER_CONTEX_TYPE;
  }

  get maxTransmitFramgent(){
    return this.maxTransmitFramgent;
  }

  set maxTransmitFramgent(maxTransmitFramgent){
    this.maxTransmitFramgent = maxTransmitFramgent;
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
    this.maxTransmitFramgent = ndr.readUnsingedShort();
    this.maxReceiveFragment = ndr.readUnsingedShort();
    this.associationGroupId = Number.parseInt(ndr.readUnsingedShort());
    var count = ndr.readUnsignedSmall();
    var contextList = [count];
    for (var i = 0; i < count; i++){
      contextList[i] = new PresentationContext();
      contextList[i].read(ndr);
    }
    contextList(contextList);
  }

  writeBody(ndr){
    var maxTransmitFramgent = maxTransmitFramgent();
    var maxReceiveFragment = maxReceiveFragment();
    ndr.writeUnsignedShort((maxTransmitFramgent == -1) ?
        ndr.getBuffer().getCapacity() : maxTransmitFramgent());
    ndr.writeUnsignedShort((maxReceiveFragment == -1) ?
        ndr.getBuffer().getCapacity() : maxReceiveFragment());
    ndr.writeUnsignedLong(associationGroupId());
    var contextList = contextList();
    var count = contextList.length;
    ndr.writeUnsignedSmall(count);
    for (var i = 0; i < count; i++){
      contextList[i] = write(ndr);
    }
  }
}

module.exports = AlterContextPdu;
