var NdrBuffer = require("../../ndr/ndrbuffer.js");
var NetworkDataRepresentation = require("../../ndr/networkdatarepresentation.js");
var ConnectionOrientedPdu = require("../connectionorientedpdu.js");
var Fragmentable = require("../fragmentable.js");
var UUID = require("../core/uuid.js");

class RequestCoPdu extends ConnectionOrientedPdu {
  constructor(){
    super();
    this.REQUEST_TYPE = 0x00;
    this.stub = [];
    this.allocationHint = 0;
    this.contextId = 0;
    this.opnum = 0;
    this.object;
  }

  geType(){
    return this.REQUEST_TYPE;
  }

  getStub(){
    return this.stub;
  }

  setStub(stub){
    this.stub = stub;
  }

  getAllocationHint(){
    return this.allocationHint;
  }

  setAllocationHint(allocationHint){
    this.allocationHint = allocationHint;
  }

  getContextId(){
    return this.contextId;
  }

  setContextId(contextId){
    this.contextId = contextId;
  }

  getOpnum(){
    return this.opnum;
  }

  setOpnum(opnum){
    this.opnum = opnum;
  }

  getObject(){
    return object;
  }

  setObject(object){
    this.object = object;
    flag(PFC_OBJECT_UUID, object != null);
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
    var object = null;
    var src = ndr.getBuffer();
    allocationHint(src.dec_ndr_long());
    contextId(src.dec_ndr_short());
    opnum(src.dec_ndr_short());

    if (flags(PFC_OBJECT_UUID)){
      object = new UUID();
      object.decode(ndr, src);
    }
    object(object);
  }

  writeBody(ndr){
    var dst = ndr.getBuffer();
    dst.enc_ndr_long(allocationHint());
    dst.enc_ndr_short(contextId());
    dst.enc_ndr_short(opnum());

    if (flag(PFC_OBJECT_UUID)){
      object().encode(ndr.ndr.getBuffer());
    }
  }

  readStub(ndr){
    var src = ndr.getBuffer();
    src.align(8);

    var stub = null;
    var length = fragmentLength() - src.getIndex();

    if (length > 0){
      stub = [length];
      ndr.readOctetArray(stub, 0, length);
    }
    stub(stub);
  }

  writeStub(ndr){
    var dst = ndr.getBuffer();
    dst.align(8, 0);

    var stub = stub();
    if (stub != null) ndr.writeOctetArray(stub, 0, stub.length);
  }

  fragment(size){
    var stub = stub();

    if (stub == null){
      return [];
    }

    var stubSize = size - (flag(PFC_OBJECT_UUID) ? 40 : 24) - 8 - 16;
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

module.exports = RequestCoPdu, FragmentIterator;
