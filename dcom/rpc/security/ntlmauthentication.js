// @ts-check
const Crypto = require('crypto');
const NtlmFlags = require('./ntlmflags.js');
const Security = require('../security.js');
const Type1Message = require('./messages/type1message.js');
const Type2Message = require('./messages/type2message.js');
const Type3Message = require('./messages/type3message.js');
const os = require('os');
const Responses = require('./responses.js');

/**
 *  NTLM Authentication class
 */
class NTLMAuthentication
{
  /**
   *
   * @param {Object} domain 
   */
  constructor(domain)
  {
    this.AUTHENTICATION_SERVICE_NTLM = 10;
    this.UNICODE_SUPPORTED = true;

    this.BASIC_FLAGS = NtlmFlags.NTLMSSP_REQUEST_TARGET | NtlmFlags.NTLMSSP_NEGOTIATE_NTLM |
      NtlmFlags.NTLMSSP_NEGOTIATE_OEM | NtlmFlags.NTLMSSP_NEGOTIATE_ALWAYS_SIGN |
      (this.UNICODE_SUPPORTED ? NtlmFlags.NTLMSSP_NEGOTIATE_UNICODE : 0);

    this.security;
    this.authenticationSource;
    this.lanManagerkey;
    this.seal;
    this.sign;
    this.keyExchange;
    this.useNtlm2sessionsecurity = false;
    this.useNtlmV2 = false;
    
    let user = domain.username;
    let password = domain.password;
    // FIXME: most of these came from properties and have these values by default
    this.lanManagerkey = false;
    this.seal = false;
    this.sign = false;
    this.keyExchange = false;

    const keyLength = 128;
    if (keyLength != null) {
      try {
        this.keyLength = Number.parseInt(keyLength);
      } catch (err) {
        throw new Error('Invalid key length: ' + keyLength);
      }
    }

    // this.useNtlm2sessionsecurity = true;
    // this.useNtlmV2 = true;
    this.domain = domain.domain;
    const security = new Security();
    this.user = security.USERNAME;
    this.password = security.PASSWORD;
    
    this.credentials = {domain: domain.domain, username: user, password: password};
  }

  /**
   *  @return {Boolean} security value
   */
  getSecurity() {
    return this.security;
  }

  /**
   * @return {String}
   */
  getAuthenticationResource() {
    if (this.authenticationSource != null) {
      return this.authenticationSource;
    }

    return new AuthenticationSrouce.getDefaultInstance();
  }

  getDefaultFlags()
  {
    var flags = this.BASIC_FLAGS;

    if (this.lanManagerkey) flags |= NtlmFlags.NTLMSSp_NEGOTIATE_LM_KEY;
    if (this.sign) flags |= NtlmFlags.NTLMSSP_NEGOTIATE_SIGN;
    if (this.sign) flags |= NtlmFlags.NTLMSSP_NEGOTIATE_SEAL;
    if (this.keyExchange) flags |= NtlmFlags.NTLMSSP_NEGOTIATE_KEY_EXCH;
    if (this.keyLength >= 56) flags |= NtlmFlags.NTLMSSP_NEGOTIATE_56;
    if (this.keyLength >= 128) flags |= NtlmFlags.NTLMSSP_NEGOTIATE_128;

    flags |= NtlmFlags.NTLMSSP_NEGOTIATE_EXTENDED_SESSIONSECURITY;
    return flags;
  }

  adjustFlags(flags)
  {
    if (this.UNICODE_SUPPORTED && ((flags & NtlmFlags.NTLMSSP_NEGOTIATE_UNICODE) != 0)) {
        flags &= ~NtlmFlags.NTLMSSP_NEGOTIATE_OEM;
        flags |= NtlmFlags.NTLMSSP_NEGOTIATE_UNICODE;
    } else {
        flags &= ~NtlmFlags.NTLMSSP_NEGOTIATE_UNICODE;
        flags |= NtlmFlags.NTLMSSP_NEGOTIATE_OEM;
    }
    if (!this.lanManagerKey) flags &= ~NtlmFlags.NTLMSSP_NEGOTIATE_LM_KEY;
    if (!(this.sign || this.seal)) flags &= ~NtlmFlags.NTLMSSP_NEGOTIATE_SIGN;
    if (!this.seal) flags &= ~NtlmFlags.NTLMSSP_NEGOTIATE_SEAL;
    if (!this.keyExchange) flags &= ~NtlmFlags.NTLMSSP_NEGOTIATE_KEY_EXCH;
    if (this.keyLength < 128) flags &= ~NtlmFlags.NTLMSSP_NEGOTIATE_128;
    if (this.keyLength < 56) flags &= ~NtlmFlags.NTLMSSP_NEGOTIATE_56;
    //        if (!useNtlm2sessionsecurity)
    //        {
    //        	flags &= ~NtlmFlags.NTLMSSP_NEGOTIATE_NTLM2;
    //        }
    return flags;
  }

  createType1(domain)
  {
    var flags = this.getDefaultFlags();
    return new Type1Message(null, flags, domain,
      os.hostname());
  }

  createType2(type1)
  {
    var flags;
    if (type1 == null) {
      flags = this.getDefaultFlags();
    } else {
      flags = this.adjustFlags(type1.getFlags());
    }
    // challenge accept response flag
    flags |= 0x00020000;

    var type2Message = new Type2Message(flags, [1,2,3,4,5,6,7,8],
      this.credentials.domain);

    return type2Message;
  }

  /**
   * 
   * @param {Type2Message} type2
   * @param {Object} info
   * @return {Type3Message}
   */
  createType3(type2, info) {
    let flags = type2.getFlags();

    if ((flags & NtlmFlags.NTLMSSP_NEGOTIATE_DATAGRAM_STYLE) != 0) {
      flags = this.adjustFlags(flags);
      flags &= ~0x00020000;
    }

    let type3 = null;
    let clientNonce = new Array(8);
    const blob = null;
    
    let target = null;

    if (target == null) {
      target = info.domain.toUpperCase();
      if (target == '') {
        target = this.getTargetFromTargetInformation(type2.getTargetInformation());
      }
    }

    if (this.useNtlmV2) {
      clientNonce = [...(Crypto.randomBytes(8))];
      try {
        const lmv2Response = new Responses().getLMv2Response(target,
            this.credentials.username, this.credentials.password,
            type2.getChallenge(), clientNonce);
        const retval = new Responses().getNTLMv2Response(target,
            this.credentials.username, this.credentials.password,
            type2.getTargetInformation(), type2.getChallenge(), clientNonce);
        const ntlmv2Response = retval[0];
        
        type3 = new Type3Message(flags, lmv2Response, ntlmv2Response, target,
            this.credentials.username,
            new Type3Message().getDefaultWorkstation());
      } catch (err) {
        throw new Error('Exception occured while forming NTLMv2 Type3Response',
            e);
      }
    } else if ((flags & NtlmFlags.NTLMSSP_NEGOTIATE_EXTENDED_SESSIONSECURITY)
         != 0) {
      flags = this.adjustFlags(flags);
      flags &= ~0x00020000;
                
      const challenge = type2.getChallenge();
      let lmResponse = new Array(24);

      clientNonce = [...(Crypto.randomBytes(8))];
      let aux = clientNonce.slice(0, clientNonce.length);
      let aux_i = 0;
      while (aux.length > 0) lmResponse.splice(aux_i++, 1, aux.shift());
      while (aux_i < lmResponse.length) lmResponse[aux_i++] = 0;
      let ntResponse;
      
      try {
        ntResponse = new Responses().getNTLM2SessionResponse(
            this.credentials.password, Buffer.from(challenge), Buffer.from(clientNonce));
      } catch (e) {
        throw new Error('Exception occured while forming Session Security Type3Response',e);
      }
      
      type3 = new Type3Message(flags, lmResponse, ntResponse, target,
          this.credentials.username, os.hostname());
    } else {
      const challenge = type2.getChallenge();
      const lmResponse = NtlmPasswordAuthentication.getPreNTLMResponse(
          this.credentials.password, challenge);
      const ntResponse = NtlmPasswordAuthentication.getNTLMResposne(
          this.credentials.password, challenge);

      type3 = new Type3Message(flags, lmResponse, ntResponse, target,
          this.credentials.username, new Type3Message().getDefaultWorkstation());

      if ((flags & NtlmFlags.NTLMSSP_NEGOTIATE_KEY_EXCH) != 0) {
	      throw new RuntimeException('Key Exchange not supported by Library !');
      }
    }
    
    if (this.useNtlm2sessionsecurity && (flags & NtlmFlags.NTLMSSP_NEGOTIATE_NTLM2) != 0) {
      var ntlmKeyFactory = new NTLMKeyFactory();
      var userSessionKey;

      if (this.useNtlmV2) {
        try {
          userSessionKey = ntlmKeyFactory.getNTLMv2UserSessionKey(target,
            this.credentials.username, this.credentials.password,
            type2.getChallenge(), blob);
        } catch (e) {
          throw new Error("Exception occured while forming NTLMv2 with NTLM2 Session Security for Type3Response ",e);
        }
      } else {
        var servernonce;
        servernonce = type2.getChallenge().slice(0, type2.getChallenge().length);
        servernonce.concat(servernonce, clientNonce);

        try {
          userSessionKey = ntlmKeyFactory.getNTLM2SessionResponseUserSessionKey(
            this.credentials.password(), this.credentials.password(),
            servernonce);
        } catch (e) {
          	throw new Error("Exception occured while forming Session Security for Type3Response ",e);
        }

        try {
          var secondayMasterKey = ntlmKeyFactory.getSecondarySessionKey();
					type3.setSessionKey(ntlmKeyFactory.encryptSecondarySessionKey(secondayMasterKey, userSessionKey));
          this.security = new Ntlm1(flags, secondayMasterKey,false);
        } catch (e) {
        	throw new Error("Exception occured while forming Session Security for Type3Response",e);
        }
      }
    }
    
    return type3;
  }

  getTargetFromTargetInformation(targetInformation)
  {
    var target = null;
    var i = 0;
    while (i < targetInformation.length) {
      switch (new Encdec().dec_uint16le(targetInformation, i)) {
        case 1:
          i++;
          i++;
          var length = new Encdec.dec_uint16le(targetInformation, i);
          i++;
          i++
          var domainb = new Array(length);
          domainb = targetInformation.slice(i, length);
          try {
            target = String(domainb);
          } catch (err) {
            return null;
          }
          i = i + length;
          i = targetInformation.length;
          break;
        default:
          i++;
          i++;
          length = new Encdec().dec_uint16le(targetInformation,i);
          i++;
          i++
          i = i + length;
      }
    }
    return target;
  }

  createSecurityWhenServer(type3)
  {
    var type3Message = type3;

    var flags = type3Message.getFlags();
    var ntlmKeyFactory = new ntlmKeyFactory();

    var secondayMasterKey;
    var sessionResponseUserSessionKey = null;

    if (type3Message.getFlag(0x00000800)) {
      sessionResponseUserSessionKey = new Array(16);
    } else if (this.useNtlmV2) {
      // TODO: create the key
      var h = 0;
    } else {
      //now create the key for the session
      //this key will be used to RC4 a 16 byte random key and set to the type3 message
      var servernonce;
      var challenge = new Array(1,2,3,4,5,6,7,8); //challenge is fixed
      servernonce = challenge.slice(0, challenge.length);
      servernonce.concat(type3Message.getLMResponse().slice(0, 8));//first 8 bytes only , the rest are all 0x00 and not required.
      try {
        sessionResponseUserSessionKey = ntlmKeyFactory.getNTLM2SessionResponseUserSessionKey(this.credentials.password, servernonce);
      } catch (e) {
        throw new RuntimeException("Exception occured while forming Session Security from Type3 AUTH",e);
      }
    }

    try {
      //now RC4 decrypt the session key
      secondayMasterKey = ntlmKeyFactory.decryptSecondarySessionKey(type3Message.getSessionKey(), sessionResponseUserSessionKey);
      this.security = new Ntlm1(flags, secondayMasterKey,true);
    } catch (e){
     throw new RuntimeException("Exception occured while forming Session Security Type3Response",e);
    }
  }
}

module.exports = NTLMAuthentication;
