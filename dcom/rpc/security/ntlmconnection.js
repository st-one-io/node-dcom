var DefaultConnection = require('../defaultconnection.js');
var AuthenticationVerifier = require('../core/authenticationverifier.js');
var NdrBuffer = require('../../ndr/ndrbuffer.js');
var NTLMAuthentication = require('./ntlmauthentication.js');
var NTLMFlags = require('./ntlmflags.js');
var Security = require('../security.js');
var Type1Message = require('./messages/type1message.js');
var Type2Message = require('./messages/type2message.js');
var Type3Message = require('./messages/type3message.js');


var contextSerial = 0;
/**
 * NTLM Connection for secure communication
 */
class NTLMConnection extends DefaultConnection
{
  constructor(info)
  {
    super();
    this.authentication = new NTLMAuthentication(info);
    this.ntlm;
  }

  setTransmitLength(transmitLength)
  {
    this.transmitLength = transmitLength;
    this.transmitBuffer = new NdrBuffer([transmitLength]);
  }

  setReceiveLength(receiveLength)
  {
    this.receiveLength = receiveLength;
    this.receiveBuffer = new NdrBuffer([receiveLength]);
  }

  incomingRebind(verifier)
  {    
    switch (verifier.body[8]) {
      case 1:
        this.contextId = verifier.contextId;
        this.ntlm = new Type1Message(verifier.body);
        break;
      case 2:
        this.ntlm = new Type2Message(verifier.body);
        break;
      case 3:
        var type2 = this.ntlm;
        this.ntlm = new Type3Message(verifier.body);
        /* FIXME: In the future usentlmv2 and other things that the original
        *  library was reading from properties should be defined diferently
        *  so our lib can also support to manually choose those values
        */
        var usentlmv2 = true;
        if (usentlmv2) {
          this.authentication.createSecurityWhenServer(this.ntlm);
          this.setSecurity(this.authentication.getSecurity());
        }
        break;
      default:
        throw new Error("Invalid NTLM message type");
    }
  }

  /**
   * 
   * @param {Object} info
   * @return {NtlmMessage}
   */
  outgoingRebind(info, pduType)
  {
    if (this.ntlm == null) {
      this.contextId = ++contextSerial;
      this.ntlm = this.authentication.createType1(info.domain);
    } else if (this.ntlm instanceof Type1Message) {
      this.ntlm = this.authentication.createType2(this.ntlm);
    } else if (this.ntlm instanceof Type2Message) {
      const type2 = this.ntlm;
      this.ntlm = this.authentication.createType3(type2, info);
      // FIXME: same as incomingRebind
      const usentlmv2 = true;
      if (usentlmv2) {
        this.setSecurity(this.authentication.getSecurity());
      }
    } else if (this.ntlm instanceof Type3Message) {
      if (pduType == 0x00) {
        return new AuthenticationVerifier(
          new NTLMAuthentication(info).AUTHENTICATION_SERVICE_NTLM, new Security().PROTECTION_LEVEL_CONNECT,
          this.contextId, [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        } else if( pduType == 0x0e) {
          let auth = [0x4e, 0x54, 0x4c, 0x4d, 0x53, 0x53, 0x50, 0x00, 0x03, 0x00, 0x00, 0x00];
          let empty_body = [...Buffer.alloc(40, 0)];
          let noKeysNoFlags = [0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00];

          let verifier = auth.concat(empty_body);
          verifier = verifier.concat(noKeysNoFlags);
          return new AuthenticationVerifier(
            new NTLMAuthentication(info).AUTHENTICATION_SERVICE_NTLM, new Security().PROTECTION_LEVEL_CONNECT,
            this.contextId, verifier);
        }
    } else {
      throw new Error("Unrecognized NTLM message.");
    }

    let protectionLevel = this.ntlm.getFlag(NTLMFlags.NTLMSSP_NEGOTIATE_SEAL) ?
      new Security().PROTECTION_LEVEL_PRIVACY : this.ntlm.getFlag(NTLMFlags.NTLMSSP_NEGOTIATE_SIGN) ?
                    new Security().PROTECTION_LEVEL_INTEGRITY : new Security().PROTECTION_LEVEL_CONNECT;

    return new AuthenticationVerifier(this.authentication.AUTHENTICATION_SERVICE_NTLM, protectionLevel,
      this.contextId, this.ntlm.toByteArray());
  }
}

module.exports = NTLMConnection;
