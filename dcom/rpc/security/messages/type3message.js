// @ts-check
const NtlmMessage = require('./ntlmmessage.js');
const Type2Message = require('./type2message.js');
const NtlmFlags = require('../ntlmflags.js');
const Crypto = require('crypto');
const Buffer = require('buffer');
const NtlmUtils = require('../ntlmutils.js');
const LegacyEncoding = require('legacy-encoding');

/**
 * NTLM Type 3 Message Class
 */
class Type3Message extends NtlmMessage {
  /**
   *
   * @param {Object} tc
   * @param {Type2Message} type2
   * @param {String} targetName
   * @param {String} password
   * @param {String} domain
   * @param {String} user
   * @param {String} workstation
   * @param {Number} flags
   * @param {Boolean} nonAnonymous
   */
  constructor(tc, type2, targetName, password, domain, user, workstation, flags, nonAnonymous) {
    super();
    /** @type {Array} */
    this.lmResponse;
    /** @type {Array} */
    this.ntResponse;
    /** @type {String} */
    this.domain;
    /** @type {String} */
    this.user;
    /** @type {String} */
    this.workstation;
    /** @type {Array} */
    this.masterKey = null;
    /** @type {Array} */
    this.sessionKey = null;
    /** @type {Array} */
    this.mic = null;
    /** @type {Boolean} */
    this.micRequired;
    
    if (arguments.length == 1) {
      if (tc instanceof Object) {
        this.setFlags(this.getDefaultFlags(tc));
        this.setDomain(tc.getConfig().getDefaultDomain());
        this.setUser(tc.getConfig().getDefaultUser());
        this.setWorkstation(tc.getNameServiceClient().getLocalHost().getHostName);
      } else {
        this.parse(tc);
      }
    } else if (arguments.length == 8 || arguments.length == 9) {      
      this.setFlags(flags | this.getDefaultFlags(tc, type2));
      this.setWorkstation(workstation);
      this.setDomain(domain);
      this.setUser(user);

      nonAnonymous = nonAnonymous ? nonAnonymous : false;

      if (password == null || (!nonAnonymous && password.length == 0)) {
        this.setLMResponse(null);
        this.setNTResponse(null);
        return;
      }

      switch (tc.getConfig().getLanManCompatibility()) {
        case 0:
        case 1:
          if (!this.getFlag(NtlmFlags.NTLMSSP_NEGOTIATE_EXTENDED_SESSIONSECURITY)) {
            this.setLMResponse(this.getLMResponse(tc, type2, password));
            this.setNTResponse(this.getNTResponse(tc, type2, password));
          } else {
            let clientChallenge = Buffer.from(new Array(24));
            Crypto.randomBytes(clientChallenge.length, clientChallenge);
            
            // fill the buffer, from 8 to 24, with zeroes
            for (let index = 8; index < clientChallenge.length; index++) {
              clientChallenge[index] = 0x00;                
            }
            let responseKeyNT = new NtlmUtils().nTOWFv1(password);
            let ntlm2Response = new NtlmUtils().getNTLM2Response(responseKeyNT, type2.getChallenge(), clientChallenge);
            this.setLMResponse(clientChallenge);
            this.setNTResponse(ntlm2Response);

            let sessionNounce = new Array(16);

            let aux = type2.getChallenge().slice(0, 8);
            let aux_i = 0;
            while (aux.length > 0) sessionNounce.splice(aux_i++, 1, aux.shift());

            aux = clientChallenge.slice(0, 8);
            aux_i = 8;
            while (aux.length > 0) sessionNounce.splice(aux_i++, 1, aux.shift());

            let md4 = Crypto.createHmac('md4', '');
            md4.update(Buffer.from(responseKeyNT));
            let userSessionKey = md4.digest();
              
            let hmac = Crypto.createHmac('md5', userSessionKey);
            hmac.update(Buffer.from(sessionNounce));
            let ntlm2Sessionkey = hmac.digest();

            if (this.getFlag(NtlmFlags.NTLMSSP_NEGOTIATE_KEY_EXCH)) {
              this.masterKey = [...Crypto.randomBytes(16)];

              let exchangedKey = Buffer.from(new Array(16));
              let arcfour = Crypto.createCipher('rc4', Buffer.from(this.masterKey));
              this.setEncryptedSessionKeyl(exchangedKey);
            } else {
              this.masterKey = [...ntlm2Sessionkey];
            }
          }
          break;
        case 2:
          let nt = this.getNTResponse(tc, type2, password);
          this.setLMResponse(nt);
          this.setNTResponse(nt);
          break;
        case 3:
        case 4:
        case 5:
          let ntlmClienteChallengeInfo = type2.getTargetInformation();
          break;          
        default:
          break;
      }
    } else {
      // some names are changed because we lack polymorphism. This should be properly implementaed in the future
      this.setFlags(tc);
      this.setLMResponse(type2);
      this.setNTresponse(targetName);
      this.setDomain(password);
      this.setUser(domain);
      this.setWorkstation(user);      
    }
  }

  /**
   * 
   * @param {Array} type1 
   * @param {Array} type2 
   */
  setupMIC (type1, type2){
    let sk = this.masterKey;
    if (sk == null) {
      return;
    }

    let mac = Crypto.createHmac('md5', Buffer.from(sk));
    mac.update(Buffer.from(type1));
    mac.update(Buffer.from(type2));
    let type3 = this.toByteArray();
    mac.update(Buffer.from(type3));
    this.setMic([...mac.digest()]);
  }

  getDefaultFlags(tc, type2){}

  /**
   * @return {Array}
   */
  getLMResponse() {
    return this.lmResponse;
  }

  /**
   * 
   * @param {Array} lmResponse
   */
  setLMResponse(lmResponse)
  {
    this.lmResponse = lmResponse;
  }

  getNTResponse(){
    return this.ntResponse;
  }
  
  /**
   * 
   * @param {Array} ntResponse 
   */
  setNTresponse(ntResponse)
  {
    this.ntResponse = ntResponse;
  }

  /**
   * @return {String}
   */
  getDomain() {
    return this.domain;
  }

  /**
   * 
   * @param {String} domain
   */
  setDomain(domain)
  {
    this.domain = domain;
  }

  /**
   * @return {String}
   */
  getUser()
  {
    return this.user;
  }

  /**
   * 
   * @param {String} user
   */
  setUser(user)
  {
    this.user = user;
  }

  /**
   * @return {String}
   */
  getWorkstation() {
    return this.workstation;
  }

  /**
   *
   * @param {String} workstation
   */
  setWorkstation(workstation)
  {
    this.workstation = workstation;
  }

  /**
   * @return {Array}
   */
  getMasterKey() {
    return this.masterKey;
  }

  /**
   * @return {Array}
   */
  getEncryptedSessionKey()
  {
    return this.sessionKey;
  }

  /**
   *
   * @param {Array} sessionKey
   */
  setEncryptedSessionKey(sessionKey)
  {
    this.sessionKey = sessionKey;
  }

  /**
   * @return {Array}
   */
  getMic()
  {
    return this.mic;
  }

  /**
   *
   * @param {Array} mic
   */
  setMic(mic)
  {
    this.mic = mic;
  }

  /**
   * @return {Boolean}
   */
  isMICRequired()
  {
    return this.micRequired;
  }

  /**
   * @return {Array}
   */
  toByteArray() {
    let size = 64;
    
    const unicode = this.getFlag(NtlmFlags.NTLMSSP_NEGOTIATE_UNICODE);
    const oemCp = unicode ? null : this.getOEMEncoding();

    const domainName = this.getDomain();
    let domainBytes = null;
    if (domainName != null && domainName.length != 0) {
      domainBytes = unicode ? [...LegacyEncoding.encode(domainName, 'utf16-le')] 
          : [...LegacyEncoding.encode(domainName, oemCp)];
      size += domainBytes.length;
    }
    
    const userName = this.getUser();
    let userBytes = null;
    if (userName != null && userName.length != 0) {
      userBytes = unicode ? [...LegacyEncoding.encode(userName, 'utf16-le')] :
          [...LegacyEncoding.encode(userName.toUpperCase(), oemCp)];
      size += userBytes.length;
    }
    
    const workstationName = this.getWorkstation();
    let workstationBytes = null;
    if (workstationName != null && workstationName.length != 0) {
      workstationBytes = unicode ? [...LegacyEncoding.encode(workstationName, 'utf16-le')] :
          [...LegacyEncoding.encode(workstationName.toUpperCase(), oemCp)];
      if (workstationBytes.length > 22) {
        workstationBytes = workstationBytes.slice(0, 22);
      }
      size += workstationBytes.length;
    }
    
    const micBytes = this.getMic();
    if (micBytes != null) {
      size += 8 + 16;
    } else if (this.getFlag(NtlmFlags.NTLMSSP_NEGOTIATE_VERSION)) {
      size += 8;
    }
    
    const lmResponseBytes = this.getLMResponse();
    size += (lmResponseBytes != null) ? lmResponseBytes.length : 0;
    
    const ntResponseBytes = this.getNTResponse();
    size += (ntResponseBytes != null) ? ntResponseBytes.length : 0;
   
    const sessionKeyBytes = this.getEncryptedSessionKey();
    size += (sessionKeyBytes != null) ? sessionKeyBytes.length : 0;
    
    let type3 = new Array(size);
    let pos = 0;
    
    let aux = this.SIGNATURE.slice(0, 8);
    let aux_i = pos;
    while (aux.length > 0) type3.splice(aux_i++, 1, aux.shift());
    pos += 8;
    
    this.writeULong(type3, pos, this.TYPE3);
    pos += 4;
    
    const lmOff = this.writeSecurityBuffer(type3, 12, lmResponseBytes, 64);
    pos += 8;
    const ntOff = this.writeSecurityBuffer(type3, 20, ntResponseBytes, 130);
    pos += 8;
    const domOff = this.writeSecurityBuffer(type3, 28, domainBytes, 64);
    pos += 8;
    const userOff = this.writeSecurityBuffer(type3, 36, userBytes, 76);
    pos += 8;
    const wsOff = this.writeSecurityBuffer(type3, 44, workstationBytes, 84);
    pos += 8;
    const skOff = this.writeSecurityBuffer(type3, 52, sessionKeyBytes, 154);
    pos += 8;

    this.writeULong(type3, pos, this.getFlags());
    pos += 4;

    if (this.getFlag(NtlmFlags.NTLMSSP_NEGOTIATE_VERSION)) {
      aux = this.VERSION.slice(0, this.VERSION.length);
      aux_i = pos;
      while (aux.length > 0) type3.splice(aux_i++, 1, aux.shift());
      pos += this.VERSION.length;
    } else if (micBytes != null) {
      pos += this.VERSION.length;
    }

    if (micBytes != null) {
      aux = micBytes.slice(0, 16);
      aux_i = pos;
      while (aux.length > 0) type3.splice(aux_i++, 1, aux.shift());
      pos += 16;
    }
    
    pos += this.writeSecurityBufferContent(type3, pos, lmOff, lmResponseBytes);
    pos += this.writeSecurityBufferContent(type3, pos, ntOff, (ntResponseBytes == null ? [] : [...ntResponseBytes]));
    pos += this.writeSecurityBufferContent(type3, pos, domOff, domainBytes);
    pos += this.writeSecurityBufferContent(type3, pos, userOff, userBytes);
    pos += this.writeSecurityBufferContent(type3, pos, wsOff, workstationBytes);
    pos += this.writeSecurityBufferContent(type3, pos, skOff, sessionKeyBytes);
    return type3;
  }

  toString(){}

  getLMv2Response(tc, type2, domain, user, password, clientChallenge, clientChallengeInfo, ts){}

  /**
   * 
   * @param {Array} material 
   */
  parse(material){
    let pos = 0;
    for (let index = 0; index < 8; index++) {
      if (material[index] != this.SIGNATURE[index]) {
        throw new Error("Not and NTLMSSP message.");
      }
      pos += 8;

      if (this.readULong(material, pos) != this.TYPE3) {
        throw new Error("Not a Type 3 message.");
      }
      pos += 4;

      let lmResponseBytes = this.readSecurityBuffer(material, pos);
      this.setLMResponse(lmResponseBytes);
      let lmResponseOffset = this.readULong(material, pos + 4);
      pos += 8;

      let ntResponseBytes = this.readSecurityBuffer(material, pos);
      this.setNTresponse(ntResponseBytes);
      let ntResponseOffset = this.readULong(material, pos + 4);
      pos += 8;

      let domainBytes = this.readSecurityBuffer(material, post);
      let domainOffset = this.readULong(material, pos + 4);
      pos += 8;

      let userBytes = this.readSecurityBuffer(material, pos);
      let userOffset = this.readULong(material, pos + 4);
      pos += 8;

      let workstationBytes = this.readSecurityBuffer(material, pos);
      let workstationOffset = this.readULong(material, pos + 4);
      pos += 8;

      let end = false;
      let flags;
      let charset;
      if (lmResponseOffset < pos + 12 || ntResponseOffset <  pos + 12 || 
          domainOffset < pos + 12 || userOffset < pos + 12 || workstationOffset < pos + 12) {
        flags = NtlmFlags.NTLMSSP_NEGOTIATE_NTLM | NtlmFlags.NTLMSSP_NEGOTIATE_OEM;
        this.setFlags(flags);
        charset = this.getOEMEncoding();
        end = true;
      } else {
        this.setEncryptedSessionKey(this.readSecurityBuffer(material, pos));
        pos += 8;

        flags = this.readULong(material, pos);
        this.setFlags(flags);
        pos += 4;

        charset = ((flags & NtlmFlags.NTLMSSP_NEGOTIATE_UNICODE) != 0) ?
          this.UNI_ENCODING : this.getOEMEncoding();
      }

      domainBytes = Buffer.from(domainBytes);
      this.setDomain(LegacyEncoding.encode(domainBytes, charset).toString());
      
      userBytes = Buffer.from(userBytes);
      this.setUser(LegacyEncoding.encode(userBytes, charset).toString());

      workstationBytes = Buffer.from(workstationBytes);
      this.setWorkstation(LegacyEncoding.encode(workstationBytes, charset).toString());

      let micLen = pos + 24;
      if (end || lmResponseOffset < micLen || ntResponseOffset < micLen || domainOffset < micLen 
        || userOffset < micLen || workstationOffset < micLen ) {
        return;
      }

      pos += 8;

      let m = new Array(16);
      let aux = material.slice(pos, m.length);
      let aux_i = 0;
      while (aux.length > 0) m.splice(aux_i++, 1, aux.shift());

      this.setMic(m);
    }
  }
}

module.exports = Type3Message;
