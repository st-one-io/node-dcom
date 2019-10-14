// @ts-check
const NTLMKeyFactory = require('./ntlmkeyfactory.js');
const NtlmFlags = require('./ntlmflags.js');
const NTLMAuthentication = require('./ntlmauthentication.js');
const Security = require('../security.js');

/**
 * This defines an object called Ntlm1 that represents the
 * authentication done through NTLM.
 */
class Ntlm1 {
  /**
   *
   * @param {Number} flags
   * @param {Array} sessionKey
   * @param {Boolean} isServer
   */
  constructor(flags, sessionKey, isServer) {
    this.NTLM1_VERIFIER_LENGTH = 16;

    this.keyFactory = new NTLMKeyFactory();
    this.isServer = isServer;
    this.protectionLevel = ((flags & NtlmFlags.NTLMSSP_NEGOTIATE_SEAL) != 0) ?
      Security.PROTECTION_LEVEL_PRIVACY : Security.PROTECION_LEVEL_INTEGRITY;

    this.clientSigningKey = this.keyFactory.generateClientSigningKeyUsingNegotiatedSecondarySessionKey(sessionKey);
    var clientSealingKey = this.keyFactory.generateClientSealingKeyUsingNegotiatedSecondarySessionKey(sessionKey);

    this.serverSigningKey = this.keyFactory.generateServerSigningKeyUsingNegotiatedSecondarySessionKey(sessionKey);
    var serverSealingKey = this.keyFactory.generateServerSealingKeyUsingNegotiatedSecondarySessionKey(sessionKey);

    this.clientCipher = this.keyFactory.getARCFOUR(clientSealingKey);
    this.serverCipehr = this.keyFactory.getARCFOUR(serverSealingKey);

    this.requestCounter = 0;
    this.responseCounter = 0;
  }

  /**
   * @return {Number}
   */
  getVerifierLength() {
    return this.NTLM1_VERIFIER_LENGTH;
  }

  /**
   * @return {Number}
   */
  getAuthenticationService() {
    return new NTLMAuthentication().AUTHENTICATION_SERVICE_NTLM;
  }

  /**
   * @return {Number}
   */
  getProtectionLevel() {
    return this.protectionLevel;
  }

  /**
   *
   * @param {NetworkDataRepresentation} ndr
   * @param {Number} index
   * @param {Number} length
   * @param {Number} verifierIndex
   * @param {Boolean} isFragmented
   */
  processIncoming(ndr, index, length, verifierIndex, isFragmented) {
    try {
      let buffer = ndr.getBuffer();

      let signingKey = null;
      let cipher = null;

      if (!this.isServer) {
        signingKey = this.serverSigningKey;
        cipher = this.serverCipehr;
      } else {
        signingKey = this.clientSigningKey;
        cipher = this.clientCipher;
      }

      let data = [];
      let data_length = 16;
      data.concat(ndr.getBuffer().getBuffer().slice(index, data_length));

      if (this.getProtectionLevel() === Security.PROTECTION_LEVEL_PRIVACY) {
        data = this.keyFactory.applyARCFOUR(cipher, data);
        let aux = data.slice(0, data.length);
        let aux_i = index;
        while (aux.length > 0) {
          ndr.getBuffer().buf.splice(aux_i, 0, aux.shift());
        }

        let verifier = this.keyFactory.signingPt1(this.responseCounter,
            signingKey, buffer.getBuffer(), verifierIndex);
        this.keyFactory.signingPt2(verifier, cipher);

        buffer.setIndex(verifierIndex);

        let signing = [16];
        ndr.readOctectArray(signing, 0, signing.length);

        if (this.keyFactory.compareSignature(verifier, signing)) {
          throw new Error('Message out of sequence. Perhaps the user being used to run this application is different from the one under which the COM server is running !.');
        }

        this.responseCounter++;
      }
    } catch (err) {
      throw new Error(err);
    }
  }

  /**
   * \
   * @param {NetworkDataRepresentation} ndr
   * @param {Number} index
   * @param {Number} length
   * @param {Number} verifierIndex
   * @param {Boolean} isFragmented
   */
  processOutgoing(ndr, index, length, verifierIndex, isFragmented) {
    try {
      let buffer = ndr.getBuffer();

      let signingKey = null;
      let cipher = null;

      if (this.isServer) {
        signingKey = this.serverSigningKey;
        cipher = this.serverCipehr;
      } else {
        signingKey = this.clientSigningKey;
        cipher = this.clientCipher;
      }

      let verifier = this.keyFactory.signingPt1(this.requestCounter, signingKey,
          buffer.getBuffer(), verifierIndex);
      let data = [length];

      var aux = data.slice(0, data.length);
      var aux_i = index;
      while (aux.length > 0) {
        ndr.getBuffer().buf.splice(aux_i, 0, aux.shift());
      }

      if (this.getProtectionLevel() == Security.PROTECTION_LEVEL_PRIVACY) {
        let data2 = this.keyFactory.applyARCFOUR(cipher, data);
        let aux = data2.slice(0, data2.length);
        let aux_i = index;
        while (aux.length > 0) {
          ndr.getBuffer().buf.splice(aux_i, 0, aux.shift());
        }
      }

      this.keyFactory.signingPt2(verifier, cipher);
      buffer.setIndex(verifierIndex);
      buffer.writeOctetArray(verifier, 0, verifier.length);

      this.requestCounter++;
    } catch (e) {
      throw new Error('General error: ' + e);
    }
  }
}

module.exports = Ntlm1;
