var NetworkDataRepresentation = require("../../ndr/networkdatarepresentation.js");
var ConnectionOrientedPdu = require("../connectionorientedpdu.js");
var Fragmentable = require("../fragmentable.js");

class ResponseCoPdu extends ConnectionOrientedPdu {
  constructor(){
    super();
    this.RESPONSE_TYPE = 0x02;
    this.stub = [];
    this.allocationHint = 0;
    this.contextId = 0;
    this.cacnelCount = 0;
  }

  getType(){
    return this.RESPONSE_TYPE;
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

  getCancelCount(){
    return this.opnum;
  }

  setCancelCount(cancelCount){
    this.cancelCount = cancelCount;
  }

  readPdu(ndr){
    this.readHeader(ndr);
    this.readBody(ndr);
    this.readStub(ndr);
  }

  writePdu(ndr){
    this.writeHeader(ndr);
    this.writeBody(ndr);
    this.writeStub(ndr);
  }

  readBody(ndr){
    this.setAllocationHint(ndr.readUnsignedLong());
    this.setContextId(ndr.readUnsignedShort());
    this.setCancelCount(ndr.readUnsignedSmall());
  }

  writeBody(ndr){
    ndr.writeUnsignedLong(this.allocationHint());
    ndr.writeUnsignedShort(this.contextId());
    ndr.readUnsignedSmall(Number.parseIntg(this.cancelCount()));
  }

  readStub(ndr){
    ndr.getBuffer().align(8);
    var stub = null;
    var length = this.getFragmentLength() - ndr.getBuffer().getIndex();

    if (length > 0){
      stub = new Array(length);
      stub = ndr.readOctetArray(stub, 0, length);
    }
    this.setStub(stub);
  }

  writeStub(ndr){
    ndr.getBuffer().align(8, 0);
    var stub = getStub();
    if (stub != null) ndr.writeOctetArray(stub, 0, stub.length);
  }

  fragment(size){
    var stub = getStub();

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
    if (!fragments.hasNext()){
      throw new Error("No fragments available.");
    }

    var pdu = fragments.next();
    var stub = pdu.getStub();

    if (sub == null) stub = [0];
    while(fragments.hasNext()){
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
      pdu.getStub(stub);
      pdu.allocationHint(length);
    }else{
      pdu.getStub(null);
      pdu.allocationHint(0);
    }

    pdu.flag(PFC_FIRST_FRAG, true);
    pdu.flag(PFC_LAST_FRAG, true);
    return pdu;
  }
}

class FragmentIterator {
  constructor(currentFragment){
    this.currentFragment = currentFragment;
  }

  hasNext(){
    return ( this.currentFragment != null );
  }

  next(){
    if ( this.currentFragment == null ){
      throw new Error("No Such Element");
    }

    try{
      return this.currentFragment;
    }
    finally{
      if ( this.currentFragment.getFlag ( ConnectionOrientedPdu.PFC_LAST_FRAG ) )
      {
        this.currentFragment = null;
      }
      else{
          try{
              this.currentFragment = receiveFragment ( transport );
          }
          catch (e){
            throw new Error("Illegal State");
          }
      }
    }
    /*
    if (this.index >= this.fragment.getStub().length) throw new Error("No such element exception.");

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
    */
  }

  remove(){
    throw new Error("Unsupported Operation");
  }
}

module.exports = ResponseCoPdu, FragmentIterator;
