var DefaultConnection = require('../defaultconnection.js');
var AuthenticationVerifier = require('../core/authenticationverifier.js');
var NdrBuffer = require('../../ndr/ndrbuffer.js');
var NTLMAuthentication = require('./ntlmauthentication.js');
var NTLMFlags = require('./ntlmflags.js');
var Security = require('../security.js');

class NTLMConnection extends DefaultConnection
{
  constructor()
  {
    super();
    this.contextSerial;
    console.log("ntlmconnection constructor");
    this.authentication = new NTLMAuthentication();
    this.ntlm;
  }

  setTransmitLength(transmitLength)
  {
    this.transmitBuffer = new NdrBuffer([transmitLength]);
  }

  setReceiveLength(receiveLength)
  {
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

  outgoingRebind(info)
  {

    if (this.ntlm == null) {
      this.contextId = ++this.contextSerial;
      this.ntlm = this.authentication.createType1(info.domain);
    } else if (this.ntlm instanceof Type1Message) {
      this.ntlm = this.authentication.createType2(this.ntlm);
    } else if (this.ntlm instanceof Type2Message) {
      var type2 = this.ntlm;
      this.ntlm = this.authentication.createType3(type2);
      // FIXME: same as incomingRebind
      var usentlmv2 = true;
      if (usentlmv2) {
        this.setSecurity(this.authentication.getSecurity());
      }
    } else if (this.ntlm instanceof Type3Message) {
      return new AuthenticationVerifier(
        new NTLMAuthenticationVerifier.AUTHENTICATION_SERVICE_NTLM, new Security.PROTECTION_LEVEL_CONNECT,
        this.contextId, [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
    } else {
      throw new Error("Unrecognized NTLM message.");
    }


    var protectionLevel = this.ntlm.getFlag((NTLMFlags.NTLMSSP_NEGOTIATE_SEAL) ?
      new Security().PROTECTION_LEVEL_PRIVACY : this.ntlm.getFlag((NtlmFlags.NTLMSSP_NEGOTIATE_SIGN) ?
                    new Security().PROTECTION_LEVEL_INTEGRITY : new Security().PROTECTION_LEVEL_CONNECT));


    return new AuthenticationVerifier(this.authentication.AUTHENTICATION_SERVICE_NTLM, protectionLevel,
      this.contextId, this.ntlm);
  }
}

module.exports = NTLMConnection;
