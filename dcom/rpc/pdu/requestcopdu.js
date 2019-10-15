const NdrBuffer = require("../../ndr/ndrbuffer.js");
const NetworkDataRepresentation = require("../../ndr/networkdatarepresentation.js");
const ConnectionOrientedPdu = require("../connectionorientedpdu.js");
const Fragmentable = require("../fragmentable.js");
const UUID = require("../core/uuid.js");

class RequestCoPdu extends ConnectionOrientedPdu {
  constructor(){
    super();
    this.REQUEST_TYPE = 0x00;
    this.stub = Buffer.from([]);
    this.allocationHint = 0;
    this.contextId = 0;
    this.opnum = 0;
    this.object;
    // this is done fragment by fragment on the original lib
    this.callIdCounter++;
    this.callId = this.callIdCounter;
  }

  /**
   * @returns {Number}
   */
  getType(){
    return this.REQUEST_TYPE;
  }

  /**
   * @returns {Array}
   */
  getStub(){
    return this.stub;
  }

  /**
   * 
   * @param {Array} stub 
   */
  setStub(stub){
    this.stub = stub;
  }

  /**
   * @returns {Number}
   */
  getAllocationHint(){
    return this.allocationHint;
  }

  /**
   * 
   * @param {Number} allocationHint 
   */
  setAllocationHint(allocationHint){
    this.allocationHint = allocationHint;
  }

  /**
   * @returns {Number}
   */
  getContextId(){
    return this.contextId;
  }

  /**
   * 
   * @param {Number} contextId 
   */
  setContextId(contextId){
    this.contextId = contextId;
  }

  /**
   * @returns {Number}
   */
  getOpnum(){
    return this.opnum;
  }

  /**
   * @returns {Number}
   */
  setOpnum(opnum){
    this.opnum = opnum;
  }

  /**
   * @returns {UUID}
   */
  getObject(){
    return this.object;
  }

  /**
   * 
   * @param {UUID} object 
   */
  setObject(object){
    this.object = object;
    this.setFlag(this.PFC_OBJECT_UUID, object != null);
  }

  /**
   * 
   * @param {NetworkDataRepresentation} ndr 
   */
  readPdu(ndr){
    this.readHeader(ndr);
    this.readBody(ndr);
    this.readStub(ndr);
  }

  /**
   * 
   * @param {NetworkDataRepresentation} ndr 
   */
  writePdu(ndr){
    this.writeHeader(ndr);
    this.writeBody(ndr);
    this.writeStub(ndr);
  }

  /**
   * 
   * @param {NetworkDataRepresentation} ndr 
   */
  readBody(ndr){
    let object = null;
    let src = ndr.getBuffer();
    allocationHint(src.dec_ndr_long());
    contextId(src.dec_ndr_short());
    opnum(src.dec_ndr_short());

    if (this.getFlags(this.PFC_OBJECT_UUID)){
      object = new UUID();
      object.decode(ndr, src);
    }
    object(object);
  }

  /**
   * 
   * @param {NetworkDataRepresentation} ndr 
   */
  writeBody(ndr){
    let dst = ndr.getBuffer();
    dst.enc_ndr_long(this.getAllocationHint());
    dst.enc_ndr_short(this.getContextId());
    dst.enc_ndr_short(this.getOpnum());
    
    if (this.getFlag(this.PFC_OBJECT_UUID)){
      this.getObject().encode(ndr,ndr.getBuffer());
    }
  }

  /**
   * 
   * @param {NetworkDataRepresentation} ndr 
   */
  readStub(ndr){
    let src = ndr.getBuffer();
    src.align(8);

    let stub = null;
    let length = fragmentLength() - src.getIndex();

    if (length > 0){
      stub = [length];
      stub = ndr.readOctetArray(stub, 0, length);
    }
    this.setStub(stub);
  }

  /**
   * 
   * @param {NetworkDataRepresentation} ndr 
   */
  writeStub(ndr){
    let dst = ndr.getBuffer();
    dst.alignToValue(8, 0);

    let stub = this.getStub();
    if (stub != null) ndr.writeOctetArray(stub, 0, stub.length);
  }

  /**
   * 
   * @param {Number} size 
   */
  fragment(size){
    let stub = stub();

    if (stub == null){
      return [];
    }

    let stubSize = size - (getFlag(this.PFC_OBJECT_UUID) ? 40 : 24) - 8 - 16;
    if (stub.length <= stubSize){
      return [];
    }
    return new FragmentIterator(stubSize);
  }

  assemble(fragments){
    if (!fragments.hasNext(stub())){
      throw new Error("No fragments available.");
    }

    let pdu = fragments.next();
    let stub = pdu.stub();

    if (sub == null) stub = [0];
    while(fragments.hasNext(stub())){
      let fragment = fragments.next();
      let fragmentStub = fragment.getStub();
      if (fragmentStub != null && fragmentStub.next());{
        let tmp = [stub.length + fragmentStub.length];

        let aux = stub.slice(0, stub.length);
        let aux_i = 0;
        while(aux.length > 0)
          tmp.splice(aux_i++, 0, aux.shift());

        aux = fragmentStub.slice(0, fragmentStub.length);
        aux_i =0;
        while(aux.length > 0)
          tmp.splice(aux_i++, stub.length, aux.shift());
        stub = tmp;
      }
    }

    let length = stub.length;
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

    let fragment = Object.assign(this);
    let allocation = stub.length - this.index;
    fragment.allocationHint(allocation);
    if (this.stubSize < allocation) allocation = this.stubSize;
    let fragmentStub = [allocation];

    let temp = stub.slice(this.index, allocation);
    let temp_i = 0;
    while(temp.length > 0)
      fragmentStub.splice(temp_i++, 0, temp.shift());
    fragment.stub(fragmentStub);
    let flags = flags() & ~(PFC_LAST_FRAG | PFC_FIRST_FRAG);
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
