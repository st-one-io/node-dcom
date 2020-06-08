const NdrBuffer = require('../ndr/ndrbuffer.js');
const NetworkDataRepresentation = require('../ndr/networkdatarepresentation.js');
const AuthenticationVerifier = require('./core/authenticationverifier.js');
const AlterContextPdu = require('./pdu/altercontextpdu.js');
const AlterContextResponsePdu = require("./pdu/altercontextresponsepdu.js");
const Auth3Pdu = require('./pdu/auth3pdu.js');
const BindAcknowledgePdu = require('./pdu/bindacknowledgepdu.js');
const BindNoAcknowledgePdu = require('./pdu/bindnoacknowledgepdu.js');
const BindPdu = require('./pdu/bindPdu.js');
const CancelCoPdu = require('./pdu/cancelCoPdu.js');
const ConnectionOrientedPdu = require('./connectionorientedpdu.js');
const FaultCoPdu = require('./pdu/faultCoPdu.js');
const OrphanedPdu = require('./pdu/orphanedpdu.js');
const RequestCoPdu = require('./pdu/requestcopdu.js');
const ResponseCoPdu = require('./pdu/responsecopdu.js');
const ShutdownPdu = require('./pdu/shutdownpdu.js');
const Events = require('events');
const util = require('util');
const debug = util.debuglog('dcom');

class DefaultConnection
{
  constructor(transmitLength, receiveLength)
  {
    //FIXME these are defined per instance but need to be statically avaialbe
    // either define in a constants file or we should export the class and the constants separately
    //this.transmitLength = transmitLength || ConnectionOrientedPdu.MUST_RECEIVE_FRAGMENT_SIZE;
    //this.receiveLength = receiveLength || ConnectionOrientedPdu.MUST_RECEIVE_FRAGMENT_SIZE;
    this.transmitLength = transmitLength || 7160;
    this.receiveLength = receiveLength || 7160;

    this.ndr = new NetworkDataRepresentation();
    this.transmitBuffer = new NdrBuffer(new Array(this.transmitLength), 0);
    this.receiveBuffer = new NdrBuffer(new Array(this.receiveLength), 0);
    this.security;
    this.contextId;
    this.bytesRemainingInReceiveBuffer = false;
    this.info;
    this.sendQueue = null;
  }

  transmit(pdu, transport, info)
  {
    if (!(pdu instanceof RequestCoPdu)){
      this.transmitFragment(pdu, transport, info);
      return;
    }

    let stubSize = this.transmitLength - (pdu.getFlag(pdu.PFC_OBJECT_UUID) ?
      40 : 24) - 8 - 16;
    let index = 0;
    var pdu_length = pdu.getStub().length;
    while (index < pdu_length) {
      if (index >= pdu_length) {
        throw new Error("No such element.");
      }
      
      // we cannot rely fully on Object.assign() so do it step by step
      let fragment = new RequestCoPdu();
      fragment.setContextId(pdu.getContextId());
      fragment.setStub(pdu.getStub());
      fragment.setAllocationHint(pdu.getAllocationHint());
      fragment.setOpnum(pdu.getOpnum());
      fragment.setObject(pdu.getObject());
      fragment.setFlags(pdu.getFlags());

      let allocation = fragment.getStub().length - index;
      fragment.setAllocationHint(allocation);
      if (stubSize < allocation) allocation = stubSize;
      
      let fragmentStub;
      let aux = pdu.getStub().slice(index, index + allocation);
      fragmentStub = aux;
      fragment.setStub(fragmentStub);
      
      let flags = pdu.getFlags() & ~(pdu.PFC_FIRST_FRAG | pdu.PFC_LAST_FRAG);
      if (index == 0) flags |= pdu.PFC_FIRST_FRAG;
      index += allocation;
      if (index >= pdu.getStub().length) flags |= pdu.PFC_LAST_FRAG;
      fragment.setFlags(flags);

      // use the same callid for all fragment of this request
      fragment.setCallId(pdu.getCallId());

      this.transmitFragment(fragment, transport, info);
    }
  }

  async receive(transport)
  {
    var fragment = await this.receiveFragment(transport);
    var first = fragment.getFlag(new ConnectionOrientedPdu().PFC_FIRST_FRAG);
    var last = fragment.getFlag(new ConnectionOrientedPdu().PFC_LAST_FRAG);
    var flag =  first && last;
    
    if ((!this.bytesRemainingInReceiveBuffer && flag) || !(fragment instanceof ResponseCoPdu)){
      return fragment;
    } 

    let stub = fragment.getStub();

    do{
      fragment = await this.receiveFragment(transport);
      let newStub = fragment.getStub();
      
      if (newStub != null && newStub.length > 0){
        if (fragment.getFlag(new ConnectionOrientedPdu().PFC_FIRST_FRAG)){
          first = fragment.getFlag(new ConnectionOrientedPdu().PFC_FIRST_FRAG);
          stub = Buffer.concat([stub, newStub]);
        } else{
          // if its the the first frag, it will be in the middle or in the end
          if (fragment.getFlag(new ConnectionOrientedPdu().PFC_LAST_FRAG)) {
            last = fragment.getFlag(new ConnectionOrientedPdu().PFC_LAST_FRAG);
          }
          stub = Buffer.concat([stub, newStub]);
        }
      }
    }while(!last);

    let length = stub.length;
    if (length > 0) {
      fragment.setStub(stub);
      fragment.setAllocationHint(length);
    } else {
      fragment.setStub(null);
      fragment.setAllocationHint(0);
    }
    
    fragment.setFlag(new ConnectionOrientedPdu().PFC_FIRST_FRAG, true);
    fragment.setFlag(new ConnectionOrientedPdu().PFC_LAST_FRAG, true);
    return fragment;
 }

  transmitFragment(fragment, transport, info)
  {
    this.transmitBuffer = new NdrBuffer(new Array(this.transmitLength), 0);

    fragment.encode(this.ndr, this.transmitBuffer);
    
    this.processOutgoing(info);
    
    transport.send(this.transmitBuffer,info);
  }

  async receiveFragment(transport)
  {
    var fragmentLength = -1;
    var type = -1;
    var read = true;

    if (this.bytesRemainingInReceiveBuffer) {
      if (this.receiveBuffer.length > new ConnectionOrientedPdu().TYPE_OFFSET){
        this.receiveBuffer.setIndex(new ConnectionOrientedPdu().TYPE_OFFSET);
        type = this.receiveBuffer.dec_ndr_small();

        if (this.isValidType(type)){
          while (this.receiveBuffer.length <= new ConnectionOrientedPdu().FRAG_LENGTH_OFFSET){
            var tmpBuffer = new NdrBuffer([10], 0);
            await transport.receive(tmpBuffer);
            
            var aux = tmpBuffer.buf.slice(0, tmpBuffer.length);
            var aux_i = 0;
            while (aux.length > 0)
              this.receiveBuffer.buf.splice(aux_i++, 1, aux.shift());
            this.receiveBuffer.length = this.receiveBuffer.length + tmpBuffer.length;
          }
          read = false;
        }
      }
      this.bytesRemainingInReceiveBuffer = false;
    }
    
    if (read){
      this.receiveBuffer.reset();
      this.receiveBuffer.buf =await transport.receive(this.receiveBuffer);
      this.receiveBuffer.length = this.receiveBuffer.buf.length
    }

    var newBuffer = null;
    var counter = 0;
    var trimSize = -1;
    var lengthOfArrayTobeRead = this.receiveBuffer.length;

    if (this.receiveBuffer.length > 0){
      this.receiveBuffer.setIndex(new ConnectionOrientedPdu().FRAG_LENGTH_OFFSET);
      fragmentLength = this.receiveBuffer.dec_ndr_short();

      newBuffer = [];
      if (fragmentLength > this.receiveBuffer.length){
        var remainingBytes = fragmentLength - this.receiveBuffer.length;
        while (fragmentLength > counter){
          let temp = this.receiveBuffer.buf.slice(0, lengthOfArrayTobeRead);
          newBuffer.push(...temp);
                    
          counter = counter + lengthOfArrayTobeRead;
          if (fragmentLength == counter){
            break;
          }

          this.receiveBuffer.reset();
          this.receiveBuffer.buf = await transport.receive(this.receiveBuffer);
          this.receiveBuffer.length = this.receiveBuffer.buf.length;
          if (fragmentLength - counter >= this.receiveBuffer.length){
            lengthOfArrayTobeRead = this.receiveBuffer.length;
          }else{
            lengthOfArrayTobeRead = fragmentLength - counter;
            trimSize = this.receiveBuffer.length - lengthOfArrayTobeRead;
          }
        }
        
      } else {
        newBuffer = this.receiveBuffer.buf.slice(0, fragmentLength);

        trimSize = this.receiveBuffer.length - fragmentLength;
      }

      if (trimSize > 0){
        let aux = this.receiveBuffer.buf.slice(this.receiveBuffer.length - trimSize, ((this.receiveBuffer.length - trimSize) + trimSize));
        this.receiveBuffer.buf = aux;
        //while (aux.length > 0)
          //this.receiveBuffer.buf.splice(aux_i++, 1, aux.shift());
        this.receiveBuffer.length = trimSize;
        this.receiveBuffer.index = 0;
        this.receiveBuffer.start = 0;
        this.bytesRemainingInReceiveBuffer = true;
      } else {
        /*
         * Sometimes packest might arive a bit late so checking the bytesRemainingInReceiveBuffer flag is not enough since
         * it would be set to false while new stuff arived on receiveBuffer. So when we consider trimsize to be 0, we need
         * to define receive buffer buf to an empty buffer;
         */
        this.receiveBuffer.buf = [];
        this.receiveBuffer.length = 0;
        this.receiveBuffer.index = 0;
        this.receiveBuffer.start = 0;
      }

      var bufferTobeUsed = new NdrBuffer(newBuffer, 0);
      bufferTobeUsed.length = newBuffer.length;

      this.processIncoming(bufferTobeUsed);
      bufferTobeUsed.setIndex(new ConnectionOrientedPdu().TYPE_OFFSET);
      type = bufferTobeUsed.dec_ndr_small();

      var pdu = null;
      
      switch (type) {
        case new AlterContextPdu().ALTER_CONTEXT_TYPE:
          pdu = new AlterContextPdu();
          break;
        case new AlterContextResponsePdu().ALTER_CONTEXT_RESPONSE_TYPE:
          pdu = new AlterContextResponsePdu();
          break;
        case new Auth3Pdu().AUTH3_TYPE:
          pdu = new Auth3Pdu();
          break;
        case new BindPdu().BIND_TYPE:
          pdu = new BindPdu();
          break;
        case new BindAcknowledgePdu().BIND_ACKNOWLEDGE_TYPE:
          pdu = new BindAcknowledgePdu();
          break;
        case new BindNoAcknowledgePdu().BIND_NO_ACKNOWLEDGE_TYPE:
          pdu = new BindNoAcknowledgePdu();
          break;
        case new CancelCoPdu().CANCEL_TYPE:
          pdu = new CancelCoPdu();
          breakl
        case new FaultCoPdu().FAULT_TYPE:
          pdu = new FaultCoPdu();
          break;
        case new OrphanedPdu().ORPHANED_TYPE:
          pdu = new OrphanedPdu();
          break;
        case new RequestCoPdu().REQUEST_TYPE:
          pdu = new RequestCoPdu();       
          break;
        case new ResponseCoPdu().RESPONSE_TYPE:
          pdu = new ResponseCoPdu();
          break;
        case new ShutdownPdu().SHUTDOWN_TYPE:
          pdu = new ShutdownPdu();
          break;
        default:
          throw new Error("Unknown PDU type: 0x" + String(type));
      }

      bufferTobeUsed.setIndex(0);
      pdu.decode(this.ndr, bufferTobeUsed);
      return pdu;
    }else{
      throw new Error("Socket Closed");
    }
  }

  isValidType(type)
  {
    switch (type) {
      case new AlterContextPdu().ALTER_CONTEXT_TYPE:
      case new AlterContextResponsePdu().ALTER_CONTEXT_RESPONSE_TYPE:
      case new Auth3Pdu().AUTH3_TYPE:
      case new BindPdu().BIND_TYPE:
      case new BindAcknowledgePdu().BIND_ACKNOWLEDGE_TYPE:
      case new BindNoAcknowledgePdu().BIND_NO_ACKNOWLEDGE_TYPE:
      case new CancelCoPdu().CANCEL_TYPE:
      case new FaultCoPdu().FAULT_TYPE:
      case new OrphanedPdu().ORPHANED_TYPE:
      case new RequestCoPdu().REQUEST_TYPE:
      case new ResponseCoPdu().RESPONSE_TYPE:
      case new ShutdownPdu().SHUTDOWN_TYPE:
        return true;
      default:
        return false;
    }
  }

  processIncoming(buffer)
  {
    buffer.setIndex(new ConnectionOrientedPdu().TYPE_OFFSET);
    var logMsg = true;

    switch (buffer.dec_ndr_small()) {
      case new BindAcknowledgePdu().BIND_ACKNOWLEDGE_TYPE:
        if (logMsg){
          debug("Received BIND_ACK");
          logMsg = false;
        }
      case new AlterContextResponsePdu().ALTER_CONTEXT_RESPONSE_TYPE:
        if (logMsg){
          debug("Received ALTER_CTX_RESP");
          logMsg = false;
        }
      case new BindPdu().BIND_TYPE:
        if (logMsg){
          debug("Received BIND");
          logMsg = false;
        }
      case new AlterContextPdu().ALTER_CONTEXT_TYPE:
        if (logMsg){
          debug("Received ALTER_CTX");
          logMsg = false;
        }

        var verifier = this.detachAuthentication(buffer);
        if (verifier != null){
          this.incomingRebind(verifier);
        }
        break;
      case new FaultCoPdu().FAULT_TYPE:
        if (logMsg){
          debug("Received FAULT");
          logMsg = false;
        }
      case new CancelCoPdu().CANCEL_TYPE:
        if (logMsg){
          debug("Received CANCEL");
          logMsg = false;
        }
      case new OrphanedPdu().ORPHANED_TYPE:
        if (logMsg){
          debug("Received ORPHANED");
          logMsg = false;
        }
      case new ResponseCoPdu().RESPONSE_TYPE:
        if (logMsg) {
          debug("Received RESPONSE");
          logMsg = false;
        }
      case new RequestCoPdu().REQUEST_TYPE:
        if (logMsg) {
          debug("Received REQUEST");
          logMsg = false;
        }
        
        if (this.security != null){
          var ndr2 = new NetworkDataRepresentation();
          ndr2.setBuffer(buffer);
          this.verifyAndUnseal(ndr2);
        }else{
          this.detachAuthentication(buffer);
        }
        break;
      case new Auth3Pdu().AUTH3_TYPE:
        if (logMsg) {
          logMsg = false;
        }
        incomingRebind(detatchAuthentication2(buffer));
        break;
      case new BindNoAcknowledgePdu().BIND_NO_ACKNOWLEDGE_TYPE:
      case new ShutdownPdu().SHUTDOWN_TYPE:
        return;
      default:
        throw new Error("Invalid incoming PDU type");
    }
  }

  processOutgoing(info)
  {
    this.ndr.getBuffer().setIndex((new ConnectionOrientedPdu).TYPE_OFFSET);
    var logMsg = true;

    let pduType = this.ndr.readUnsignedSmall();
    switch (pduType) {
      case (new BindPdu().BIND_TYPE):
        if (logMsg){
          debug("Sending BIND");
          logMsg = false;
        }
      case (new Auth3Pdu().AUTH3_TYPE):
        if (logMsg) {
          debug("Sending AUTH3");
          logMsg = false;
        }
      case (new BindAcknowledgePdu().BIND_ACKNOWLEDGE_TYPE):
        if (logMsg){
          debug("Sending BIND_ACK");
          logMsg = false;
        }
      case (new AlterContextResponsePdu().ALTER_CONTEXT_RESPONSE_TYPE):
        if (logMsg){
          debug("Sending ALTER_CTX_RESP");
          logMsg = false;
        }
      case (new RequestCoPdu().REQUEST_TYPE):
        if (logMsg) {
          debug("Sending REQUEST");
          logMsg = false;
        }       
        var verifier = this.outgoingRebind(info, pduType);
        if (verifier != null) this.attachAuthentication(verifier);
        break;
      case (new AlterContextPdu().ALTER_CONTEXT_TYPE):
        if (logMsg){
          debug("Sending ALTER_CTX");
          logMsg = false;
        }
        var verifier = this.outgoingRebind(info, pduType);
        if (verifier != null) this.attachAuthentication(verifier);
        break;
      case (new FaultCoPdu().FAULT_TYPE):
        if (logMsg){
          debug("Sending FAULT");
          logMsg = false;
        }
      case (new CancelCoPdu().CANCEL_TYPE):
        if (logMsg){
          debug("Sending CANCEL");
          logMsg = false;
        }
      case (new OrphanedPdu().ORPHANED_TYPE):
        if (logMsg){
          debug("Sending ORPHANED");
          logMsg = false;
        }
      case (new ResponseCoPdu().RESPONSE_TYPE):
        if (logMsg) {
          debug("Sending RESPONSE");
          logMsg = false;
        }
        if (security != null) {
          this.signAndSeal(this.ndr);
        }
        break;
      case (new BindNoAcknowledgePdu().BIND_NO_ACKNOWLEDGE_TYPE):
      case (new ShutdownPdu().SHUTDOWN_TYPE):
        return;
      default:
        throw new Error("Invalid outgoing PDU type");
    }
  }

  setSecurity(security)
  {
    this.security = security;
  }

  attachAuthentication(verifier)
  {
    try{
      var buffer = this.ndr.getBuffer();
      var length = buffer.getLength();
      
      buffer.setIndex(length);
      verifier.encode(this.ndr, buffer);
      
      length = buffer.getLength();
      buffer.setIndex(new ConnectionOrientedPdu().FRAG_LENGTH_OFFSET);
      this.ndr.writeUnsignedShort(length);
      this.ndr.writeUnsignedShort(verifier.body.length);
    }catch(e){
      throw new Error("Error attaching authentication to PDU");
    }
  }

  detatchAuthentication2(buffer)
  {
    try{
      buffer.setIndex(ConnectionOrientedPdu.AUTH_LENGTH_OFFSET);
      var length = buffer.dec_ndr_short();
      var index = 20;
      buffer.setIndex(index);
      var verifier = new AuthenticationVerifier(length);
      verifier.decode(ndr, buffer);
      buffer.setIndex(index + 2);
      length = index - buffer.dec_ndr_small();
      buffer.setIndex(ConnectionOrientedPdu.FRAG_LENGTH_OFFSET);
      buffer.enc_ndr_short(length);
      buffer.enc_ndr_short(0);
      buffer.setIndex(length);
      return verifier;
    }catch(e){
      throw new Error("Error striping authentication from PDU");
    }
  }

  detachAuthentication(buffer)
  {
    try {
      buffer.setIndex(new ConnectionOrientedPdu().AUTH_LENGTH_OFFSET);
      var length = buffer.dec_ndr_short();
      if (length == 0) {
        return null;
      }

      var index = buffer.getLength() - length - 8;
      buffer.setIndex(index);
      var verifier = new AuthenticationVerifier(length);
      verifier.decode(this.ndr, buffer);
      buffer.setIndex(index + 2);
      length = index - buffer.dec_ndr_small();
      buffer.setIndex(new ConnectionOrientedPdu().FRAG_LENGTH_OFFSET);
      buffer.enc_ndr_short(length);
      buffer.enc_ndr_short(0);
      buffer.setIndex(length);

      return verifier;
    } catch (e) {
      throw new Error("Error striping authentication from PDU.");
    }
  }

  signAndSeal(ndr)
  {
    var protectionLevel = this.security.getProtectionLevel();

    if (protectionLevel < Security.PROTECTION_LEVEL_INTEGRITY) return;

    var verifierLength = this.security.getVerifierLength();
    var verifier = new AuthenticationVerifier(this.security.getAuthenticationService(),
      protectionLevel, this.contextId, verifierLength);
    var buffer = ndr.getBuffer();
    var length = buffer.getLength();

    buffer.setIndex(length);
    verifier.encode(ndr, buffer);
    length = buffer.getLength();
    buffer.setIndex(ConnectionOrientedPdu.FRAG_LENGTH_OFFSET);
    ndr.writeUnsignedShort(length);
    ndr.writeUnsignedShort(verifierLength);

    var verifierIndex = length - verifierLength;
    length = length - verifierLength + 8;

    var index = ConnectionOrientedPdu.HEADER_LENGTH;
    buffer.setIndex(ConnectionOrientedPdu.TYPE_OFFSET);
    switch (ndr.readUnsignedSmall()) {
      case RequestCoPdu.REQUEST_TYPE:
        index += 8;
        buffer.setIndex(connectionorientedpdu.FLAGS_OFFSET);
        if ((ndr.readUnsignedSmall() & ConnectionOrientedPdu.PFC_OBJECT_UUID) != 0){
          index += 16;
        }
        break;
      case FaultCoPdu.FAULT_TYPE:
        index += 16;
        break;
      case ResponseCoPdu.RESPONSE_TYPE:
        index += 8;
        break;
      case CancelCoPdu.CANCEL_TYPE:
      case OrphanedPdu.ORPHANED_TYPE:
        index = length;
        break;
      default:
        throw new Error("Not and authenticated PDU type.");
    }

    var isFragmented = true;
    buffer.setIndex(ConnectionOrientedPdu.FLAGS_OFFSET);
    var flags = ndr.readUnsignedSmall();
    if ((flags & ConnectionOrientedPdu.PFC_FIRT_FRAG) == ConnectionOrientedPdu.PFC_FIRT_FRAG &&
      (flags & ConnectionOrientedPdu.PFC_LAST_FRAG) == ConnectionOrientedPdu.PFC_LAST_FRAG) {
      isFragmented = false;
    }
    length = length - index;
    this.security.processOutgoing(ndr, index, length, verifierIndex, isFragmented);
  }

  verifyAndUnseal(ndr)
  {
    var buffer = ndr.getBuffer();
    buffer.setIndex(ConnectionOrientedPdu.AUTH_LENGTH_OFFSET);

    var verifierLength = ndr.readUnsignedShort();
    if (verifierLength <= 0) {
      return;
    }

    var verifierIndex = buffer.getLength() - verifierLength;
    var length = verifierIndex - 8;
    var index = ConnectionOrientedPdu.HEADER_LENGTH;

    buffer.setIndex(ConnectionOrientedPdu.TYPE_OFFSET);
    switch (ndr.readUnsignedSmall()) {
      case RequestCoPdu.REQUEST_TYPE:
        index += 8;
        buffer.setIndex(ConnectionOrientedPdu.FLAGS_OFFSET);
        if ((ndr.readUnsignedSmall() &
          ConnectionOrientedPdu.PFC_OBJECT_UUID) != 0) {
          index += 16;
        }
        break;
      case FaultCoPdu.FAULT_TYPE:
        index += 16;
        break;
      case ResponseCoPdu.RESPONSE_TYPE:
        index += 8;
        break;
      case CancelCoPdu.CANCEL_TYPE:
      case OrphanedPdu.ORPHANED_TYPE:
        index = length;
        break;
      default:
        throw new Error("Not an authenticated PDU type.");
    }
    length = length - index;

    var isFragmented = true;
    buffer.setIndex(ConnectionOrientedPdu.FLAGS_OFFSET);
    var flags = ndr.readUnsignedSmall();
    if ((flags & ConnectionOrientedPdu.PFC_FIRT_FRAG) ==
      ConnectionOrientedPdu.PFC_FIRT_FRAG && (flags & ConnectionOrientedPdu.PFC_LAST_FRAG) ==
      ConnectionOrientedPdu.PFC_LAST_FRAG) {
      isFragmented = false;
    }

    this.security.processIncoming(ndr, index, length, verifierIndex, isFragmented);
    buffer.setIndex(verifierIndex - 6);
    length = verifierIndex - ndr.readUnsignedSmall() - 8;
    buffer.setIndex(connectionorientedpdu.FRAG_LENGTH_OFFSET);
    ndr.writeUnsignedShort(length);
    ndr.writeUnsignedShort(0);
    buffer.length = length;
  }

  outgoingRebind(info){};
}

module.exports = DefaultConnection;
