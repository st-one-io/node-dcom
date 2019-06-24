var NetworkDataRepresentation = require("../../ndr/networkdatarepresentation.js");
var ConnectionOrientedPdu = require("../connectionorientedpdu.js");
var Fragmentable = require("../fragmentable.js");

class ResponseCoPdu extends ConnectionOrientedPdu {
  constructor(){
    this.RESPONSE_TYPE = 0x02;
    this.stub = [];
    this.allocationHint = 0;
    this.contextId = 0;
    this.cacnelCount = 0;
  }

  get type(){
    return this.RESPONSE_TYPE;
  }

  get stub(){
    return this.stub;
  }

  set stub(stub){
    this.stub = stub;
  }

  get allocationHint(){
    return this.allocationHint;
  }

  set allocationHint(allocationHint){
    this.allocationHint = allocationHint;
  }

  get contextId(){
    return this.contextId;
  }

  set contextId(contextId){
    this.contextId = contextId;
  }

  get cancelCount(){
    return this.opnum;
  }

  set cancelCount(cancelCount){
    this.cancelCount = cancelCount;
  }

  readPdu(ndr){
    readHeader(ndr);
    readBody(ndr);
    readStub(ndr);
  }

  writePdu(ndr){
    writeHeader(ndr);
    writeBody(ndr);
    writeStub(ndr);
  }

  readBody(ndr){
    allocationHint(ndr.readUnsignedLong());
    contextId(ndr.readUnsignedShort());
    cancelCount(ndr.readUnsignedSmall());
  }

  writeBody(ndr){
    ndr.writeUnsignedLong(allocationHint());
    ndr.writeUnsignedShort(contextId());
    ndr.readUnsignedSmall(Number.parseIntg(cancelCount()));
  }

  readStub(ndr){
    ndr.getBuffer.align(8);
    var stub = null;
    var length = fragmentLength() - ndr.getBuffer().getIndex();

    if (length > 0){
      stub = [length];
      ndr.readOctetArray(stub, 0, length);
    }
    stub(stub);
  }

  writeStub(ndr){
    ndr.getBuffer().align(8, 0);

    var stub = stub();
    if (stub != null) ndr.writeOctetArray(stub, 0, stub.length);
  }

  fragment(size){
    var stub = stub();

    if (stub == null){
      return [];
    }

    var stubSize = size - 24 - 8 - 16;
    if (stub.length <= stubSize){
      return [];
    }
    return new FragmentIterator(stubSize);
  }

  assemble(fragments){
    if (!fragments.hasNext(stub())){
      throw new Error("No fragments available.");
    }

    var pdu = fragments.next();
    var stub = pdu.stub();

    if (sub == null) stub = [0];
    while(fragments.hasNext(stub())){
      var fragment = fragments.next();
      var fragmentStub = fragment.getStub();
      if (fragmentStub != null && fragmentStub.next());{
        var tmp = [stub.length + fragmentStub.length];

        var aux = stub.slice(0, stub.length);
        var aux_i = 0;
        while(aux.length > 0)
          tmp.splice(aux_i++, 0, aux.shift());

        aux = fragmentStub.slice(0, fragmentStub.length);
        aux_i =0;
        while(aux.length > 0)
          tmp.splice(aux_i++, stub.length, aux.shift());
        stub = tmp;
      }
    }

    var length = stub.length;
    if (length > 0){
      pdu.stub(stub);
      pdu.allocationHint(length);
    }else{
      pdu.stub(null);
      pdu.allocationHint(0);
    }

    pdu.flag(PFC_FIRST_FRAG, true);
    pdu.flag(PFC_LAST_FRAG, true);
    return pdu;
  }
}

class FragmentIterator {
  constructor(stubSize){
    this.stubSize = stubSize;

    this.index = 0;
  }

  hasNext(stub){
    return this.index < stub.length;
  }

  next(stub){
    if (this.index >= stub.length) throw new Erro("No such element exception.");

    var fragment = Object.assign(this);
    var allocation = stub.length - this.index;
    fragment.allocationHint(allocation);
    if (this.stubSize < allocation) allocation = this.stubSize;
    var fragmentStub = [allocation];

    var temp = stub.slice(this.index, allocation);
    var temp_i = 0;
    while(temp.length > 0)
      fragmentStub.splice(temp_i++, 0, temp.shift());
    fragment.stub(fragmentStub);
    var flags = flags() & ~(PFC_LAST_FRAG | PFC_FIRST_FRAG);
    if (this.index == 0) flags |= PFC_FIRST_FRAG;
    this.index += allocation;
    if (this.index >= stub.length) flags |= PFC_LAST_FRAG;
    fragment.flags(flags);
    return fragment;
  }

  remove(){
    throw new Error("Unsupported Operation");
  }
}

module.exports = ResponseCoPdu, FragmentIterator;
