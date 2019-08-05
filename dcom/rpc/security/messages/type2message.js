const HashMap = require('hashmap');
const NtlmMessage = require('./ntlmmessage.js');
const Type1Message = require('./type1message.js');
const NtlmFlags = require('./../ntlmflags.js');
const HexDump = require('../../../ndr/hexdump.js');
const LegacyEncoding = require('legacy-encoding');

/**
 * NTLM Type 2 Message Class
 */
class Type2Message extends NtlmMessage
{
  constructor(tc, type1, challenge, target)
  {
    super();
    if (arguments.length == 1) {      
      if (tc instanceof Array) {
        this.parse(tc);
      }
    } else {
      if (type1 instanceof Type1Message) {
        this.setFlags(this.getDefaultFlags(tc, type1));
      } else {
        this.setFlags(type1);
        this.setTarget(target);
      }

      if(target == null)
      {
        this.setTarget((type1 != null && target == null && type1.getFlag(this.NTLMSSP_REQUEST_TARGET)? tc.getConfig().getDefaultDomain() : target));
      } else {
        this.setTargetInformation(this.getDefaultTargetInfo(tc));
      }
      this.setChallenge(challenge);
    }
    this.TARGET_INFO_CACHE = new HashMap();
  }

  getDefaultTargetInfo(tc)
  {
    var domain = tc.getConfig().getDefaultDomain();
    var ti = this.TARGET_INFO_CACHE.get(domain);
    if (ti != null) {
      return ti;
    }

    ti = this.makeTargetInfo(tc, domain);
    this.TARGET_INFO_CACHE.set(domain, ti);
    return ti;
  }

  makeTargetInfo(tc, domainStr)
  {
    // TODO: FINISH THIS
    var domain = new Array();
    if (domainStr != null) {
      try {
        domain = Buffer.byteLength(domainStr);
      } catch (err) {

      }
    }
  }

  getDefaultFlags(unicode, type1)
  {
    if (type1 == null) {
      return NtlmFlags.NTLMSSP_NEGOTIATE_NTLM | NtlmFlags.NTLMSSP_NEGOTIATE_VERSION
        | (unicode ? NtlmFlags.NTLMSSP_NEGOTIATE_UNICODE : NtlmFlags.NTLMSSP_NEGOTIATE_OEM );
    } else {
      var flags = NtlmFlags.NTLMSSP_NEGOTIATE_NTLM | NtlmFlags.NTLMSSP_NEGOTIATE_VERSION;
      var type1Flags = type1.getFlags();

      flags |= ((type1Flags & NtlmFlags.NTLMSSP_NEGOTIATE_UNICODE) != 0) ?
        NtlmFlags.NTLMSSP_NEGOTIATE_UNICODE : NtlmFlags.NTLMSSP_NEGOTIATE_OEM;
      if ((type1Flags && NtlmFlags.NTLMSSP_REQUEST_TARGET) != 0) {
        var domain = tc.getConfig().getDefaultDomain();
        if (domain != null) {
          flags |= NtlmFlags.NTLMSSP_REQUEST_TARGET | NtlmFlags.NTLMSSP_TARGET_TYPE_DOMAIN;
        }
      }
      return flags;
    }
  }

  getChallenge()
  {
    return this.challenge;
  }

  setChallenge(challenge)
  {
    this.challenge = challenge;
  }

  getTarget()
  {
    return this.target;
  }

  setTarget(target)
  {
    this.target = target;
  }

  getTargetInformation()
  {
    return this.targetInformation;
  }

  setTargetInformation(targetInformation)
  {
    this.targetInformation = targetInformation;
  }

  getContext()
  {
    return this.context;
  }

  setContext(context)
  {
    this.context = context;
  }

  toByteArray()
  {
    var size = 48;
    var flags = this.getFlags();
    var targetName = this.getTarget();
    var targetInformationBytes = this.getTargetInformation();
    var targetBytes = new Array();

    if (this.getFlag(NtlmFlags.NTLMSSP_REQUEST_TARGET)) {
      if (targetName != null && targetName.length != 0 ){
        targetBytes = ( flags & NtlmFlags.NTLMSSP_NEGOTIATE_UNICODE ) != 0 ?
          targetName.getBytes(NtlmFlags.UNI_ENCODING) :
          targetName.toUpperCase().getBytes(this.getOEMEncoding());
        size += targetBytes.length;
      } else {
        flags &= (0xffffffff ^ NtlmFlags.NTLMSSP_REQUEST_TARGET);
      }
    }

    if (targetInformation != null) {
      size += targetInformation.length;
      flags |= NtlmFlags.NTLMSSP_NEGOTIATE_TARGET_INFO;
    }

    if (this.getFlag(NtlmFlags.NTLMSSP_NEGOTIATE_VERSION)) {
      size += 8;
    }

    var type2 = new Array(size);
    var pos = 0;

    var aux = this.SIGNATURE.slice(0, this.SIGNATURE.length);
    var aux_i = pos;
    while (aux.length > 0) {
      type2.splice(aux_i++, 1, aux.shift());
    }
    pos += this.SIGNATURE.length;

    this.writeULong(type2, pos, this.TYPE2)
    pos += 4;

    var targetNameOff = this.writeSecurityBuffer(type2, pos, targetBytes);
    pos += 8;

    this.writeULong(type2, pos, flags);
    pos += 4;

    var challengeBytes = this.getChallenge();
    if (challengeBytes != null) {
      aux = challengeBytes.slice(0, 8);
    }else {
      aux = new Array(8);
    }
    aux_i = pos;
    while (aux.length > 0) {
      type2.splice(aux_i++, 1, aux.shift());
    }
    pos += 8;


    var contextBytes = this.getContext();
    if (contextBytes != null) {
      aux = contextBytes.slice(0, 8);
    }else {
      aux = new Array(8);
    }
    aux_i = pos;
    while (aux.length > 0) {
      type2.splice(aux_i++, 1, aux.shift());
    }
    pos += 8;

    var targetInfoOff = this.writeSecurityBuffer(type2, pos, targetInformationBytes);
    pos += 8;

    if (this.getFlag(NtlmFlags.NTLMSSP_NEGOTIATE_VERSION)) {
      aux = this.VERSION.slice(0, this.VERSION.length);
      aux_i = pos;
      while (aux.length > 0) {
        type2.splice(aux_i++, 1, aux.shift());
        pos += this.VERSION.length;
      }
    }

    pos += this.writeSecurityBufferContent(type2, pos, targetNameOff, targetBytes);
    pos += this.writeSecurityBufferContent(type2, pos, targetInfoOff, targetInformationBytes);

    return type2;
  }

  /**
   * @return {null}
   */
  toString(){
    var targetString = this.getTarget();
    var challengeBytes = this.getChallenge();
    var contextBytes = this.getContext();
    var targetInformationBytes = this.getTargetInformation();

    return "Type2Message[target=" + targetString + ",challenge=" + ( challengeBytes == null ? "null" : "<" + challengeBytes.length + " bytes>" )
      + ",context=" + ( contextBytes == null ? "null" : "<" + contextBytes.length + " bytes>" ) + ",targetInformation="
      + ( targetInformationBytes == null ? "null" : "<" + targetInformationBytes.length + " bytes>" ) + ",flags=0x"
      + Hexdump.toHexString(getFlags(), 8) + "]";
  }

  /**
   *
   * @param {Array} input
   */
  parse(input) {
    let pos = 0;
    for (let i = 0; i < 8; i++) {
      if (input[i] != this.SIGNATURE[i]) {
        throw new Error('Not an NTLMSSP message.');
      }
    }
    pos += 8;

    if (this.readULong(input, pos) != this.TYPE2) {
      throw new Erro('Not a Type 2 message.');
    }
    pos += 4;

    const flags = this.readULong(input, pos + 8);
    this.setFlags(flags);

   
    const targetName = this.readSecurityBuffer(input, pos);
    const targetNameOff = this.readULong(input, pos + 4);
    if (targetName.length != 0) {
      this.setTarget(Buffer.from(targetName).toString(( flags & NtlmFlags.NTLMSSP_NEGOTIATE_UNICODE ) != 0 ?
      this.UNI_ENCODING : this.getOEMEncoding()));
    }
    
    pos += 12;

    if (!this.allZeros8(input, pos)) {
      let challengeBytes = new Array(8);
      
      let aux = input.slice(pos, pos+ challengeBytes.length);
      let aux_i = 0;
      while (aux.length > 0) {
        challengeBytes.splice(aux_i++, 1, aux.shift());
      }
      this.setChallenge(challengeBytes);
    }
    pos += 8;

    if (targetNameOff < pos + 8 || input.length < pos + 8) {
      return;
    }

    if (!this.allZeros8(input, pos)) {
      var contextBytes = new Array(8);
      var aux = input.slice(pos, pos + contextBytes.length);
      var aux_i = 0;
      while (aux.length > 0) {
        contextBytes.splice(aux_i++, 1, aux.shift());
      }
      this.setContext(contextBytes);
    }
    pos += 8;

    if (targetNameOff < pos + 8 || input.length < pos + 8) {
      return;
    }

    var targetInfo = this.readSecurityBuffer(input, pos);
    if (targetInfo.length != 0) {
      this.setTargetInformation(targetInfo);
    }
  }

  allZeros8(input, pos)
  {
    for (let i = pos; i < pos + 8; i++) {
      if (input[i] != 0) {
        return false;
      }
    }
    return true;
  }
}

module.exports = Type2Message;
