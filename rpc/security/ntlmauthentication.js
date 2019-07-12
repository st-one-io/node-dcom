var Crypto = require('crypto');
var NtlmFlags = require('./ntlmflags.js');
var Security = require('../security.js');
var Type1Message = require('./messages/type1message.js');
var os = require('os');

class NTLMAuthentication
{
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

    var domain = null;
    var user = null;
    var password = null;
    // FIXME: most of these came from properties and have these values by default
    this.lanManagerkey = false;
    this.seal = false;
    this.sign = false;
    this.keyExchange = false;

    var keyLength = 128;
    if (keyLength != null) {
      try {
        this.keyLength = Number.parseInt(keyLength);
      } catch (err) {
        throw new Erro("Invalid key length: " +  keyLength);
      }
    }

    //this.useNtlm2sessionsecurity = true;
    //this.useNtlmV2 = true;
    this.domain = domain;
    var security = new Security();
    this.user = security.USERNAME;
    this.password = security.PASSWORD;

    this.credentials = {domain: domain, user: user, password: password};
  }

  getSecurity()
  {
    return this.security;
  }

  getAuthenticationResource()
  {
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
    console.log("createType1");
    var flags = this.getDefaultFlags();
    console.log("createtype1");
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

  createType3(type2, info)
  {
    console.log("create type3");
    var flags = type2.getFlags();

    if ((flags & NtlmFlags.NTLMSSP_NEGOTIATE_DATAGRAM_STYLE) != 0) {
      flags = this.adjustFlags(flags);
      flag &= ~0x00020000;
    }

    var type3 = null;
    var clienteNonce = new Array(8);
    var blob = null;

    var target = null;

    if (target == null) {
      target = info.domain.toUpperCase();
      if (target == "") {
        target = this.getTargetFromTargetInformation(type2.getTargetInformation());
      }
    }

    if (this.useNtlmV2) {
      clientNonce = [...(Crypto.randomBytes(8))];
      try {
        var lmv2Response = new Responses.getLMv2Response(target, this.credentials.username,
          this.credentials.username, type2.getChallenge(), clientNonce);
        var retval = new Responses().getNTLMv2Response(target, this.credentials.username,
          this.credentials.username, clientNonce);
          var ntlmv2Response = retval[0];

          type3 = new Type3Message(flags, lmv2Response, ntlmv2Response, target,
            this.credentials.username, new Type3Message().getDefaultWorkstation());
      } catch (err) {
          throw new Error("Exception occured while forming NTLMv2 Type3Response ",e);
      }
    } else if ((flags & NtlmFlags.NTLMSSP_NEGOTIATE_EXTENDED_SESSIONSECURITY) != 0) {
      flags = this.adjustFlags(flags);
      flags &= ~0x00020000;
      console.log(flags);
      var challenge = type2.getChallenge();
      var lmResponse = [24];

      clientNonce = [...(Crypto.randomBytes(8))];
      lmResponse = clientNonce.slice(0, clientNonce.length);
      var ntResponse;

      try {
					ntResponse = new Responses().getNTLM2SessionResponse(
            this.credentials.password, challenge, clientNonce);
			} catch (e)
			{
					throw new Error("Exception occured while forming Session Security Type3Response ",e);
      }

      type3 = new Type3Message(flags, lmResponse, ntResponse, target,
        this.credentials.username, new Type3Message().getDefaultWorkstation());
    } else {
      var challenge = type2.getChallenge();
      var lmResponse = NtlmPasswordAuthentication.getPreNTLMResponse(
        this.credentials.password, challenge);
      var ntResponse = NtlmPasswordAuthentication.getNTLMResposne(
        this.credentials.password, challenge);

      type3 = new Type3Message(flags, lmResponse, ntResponse, target,
        this.credentials.username, new Type3Message().getDefaultWorkstation());

      if ((flags & NtlmFlags.NTLMSSP_NEGOTIATE_KEY_EXCH) != 0) {
	      throw new RuntimeException("Key Exchange not supported by Library !");
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
