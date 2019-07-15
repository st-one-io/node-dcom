// @ts-check
const NtlmMessage = require('./ntlmmessage.js');
const Type2Message = require('./type2message.js');
const NtlmFlags = require('../ntlmflags.js');
const Crypto = require('crypto');
const Buffer = require('buffer');
const NtlmUtils = require('../ntlmutils.js');

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
      /**@type {Array} */
      this.lmResponse;
      /**@type {Array} */
      this.ntResponse;
      /**@type {String} */
      this.domain;
      /**@type {String} */
      this.user;
      /**@type {String} */
      this.workstation;
      /**@type {Array} */
      this.masterKey = null;
      /**@type {Array} */
      this.sessionKey = null;
      /**@type {Array} */
      this.mic = null;
      /**@type {Boolean} */
      this.micRequired;

      if (arguments.length == 1) {
        this.setFlags(this.getDefaultFlags(tc));
        this.setDomain(tc.getConfig().getDefaultDomain());
        this.setUser(tc.getConfig().getDefaultUser());
        this.setWorkstation(tc.getNameServiceClient().getLocalHost().getHostName);
      } else {
        this.setFlags(flags | this.getDefaultFlags(tc, type2));
        this.setWorkstation(workstation);
        this.setDomain(domain);
        this.setUser(user);

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
            console.log(ntlmClienteChallengeInfo);
            
          default:
            break;
        }

      }
  }

  /**
   * 
   * @param {Array} type1 
   * @param {Array} type2 
   */
  setupMIC (type1, type2){}

  getDefaultFlags(tc, type2){}

  getLMResponse(){}

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

  getDomain()
  {
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

  getWorkstation(){
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
   * @returns {Array} 
   */
  getMasterKey(){
    return this.masterKey;
  }

  /**
   * @returns {Array}
   */
  getEncryptedSessionKey()
  {
    return this.sessionKey;
  }

  /**
   * 
   * @param {Array} sessionKey 
   */
  setEncryptedSessionKeyl(sessionKey)
  {
    this.sessionKey = sessionKey;
  }

  /**
   * @returns {Array}
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
   * @returns {Boolean}
   */
  isMICRequired()
  {
    return this.micRequired;
  }

  toByteArray(){}

  toString(){}

  getLMv2Response(tc, type2, domain, user, password, clientChallenge, clientChallengeInfo, ts){}

  parse(material){}


}

module.exports = Type3Message;
