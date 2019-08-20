// @ts-check
const Crypto = require('crypto');
const Encdec = require('../../ndr/encdec.js');
const LegacyEncoding = require('legacy-encoding');

class NtlmUtils 
{
    constructor()
    {
        this.S8 = [0x4b, 0x47, 0x53, 0x21, 0x40, 0x23, 0x24, 0x25];
    }

    /**
     * 
     * @param {Array} responseKeyNT 
     * @param {Array} serverChallenge 
     * @param {Array} clientChallenge 
     * @param {Number} nanos1601 
     * @param {avPairs} avPairs 
     */
    getNTLMv2Response(responseKeyNT, serverChallenge, clientChallenge, nanos1601, avPairs)
    {
        let avPairsLength = avPairs != null ? avPairs.length : 0;
        let temp =[...Buffer.from(new Array(28 + avPairsLength + 4))];

        Encdec.enc_uint16le(0x00000101, Buffer.from(temp), 0);
        Encdec.enc_uint32le(0x00000000, Buffer.from(temp), 4);
        Encdec.enc_uint64le(nanos1601, Buffer.from(temp), 8);

        let aux = clientChallenge.slice(0, 8);
        let aux_i = 16;
        while (aux.length > 0) {
            temp.splice(aux_i++, 1, aux.shift());
        }
        
        Encdec.enc_uint32le(0x00000000, temp, 24);

        if (avPairs != null) {
            aux = avPairs.slice(0, avPairsLength);
            aux_i = 28;
            while (aux.length > 0) {
                temp.splice(aux_i++, 1, aux.shift());
            }
        }

        Encdec.enc_uint32le(0x00000000, temp, 28 + avPairsLength);

        return this.computeResponse(responseKeyNT, serverChallenge, temp, 0, temp.length);
    }

    /**
     * 
     * @param {Array} responeKeyLM 
     * @param {Array} serverChallenge 
     * @param {Array} clientChallenge 
     */
    getLMv2Response(responeKeyLM, serverChallenge, clientChallenge)
    {
        return this.computeResponse(responeKeyLM, serverChallenge, clientChallenge, 0, clientChallenge.length);
    }

    /**
     * 
     * @param {Array} responseKey 
     * @param {Array} serverChallenge 
     * @param {Array} clientData 
     * @param {Number} offset 
     * @param {Number} length 
     */
    computeResponse(responseKey, serverChallenge, clientData, offset, length)
    {
        let hmac = Crypto.createHmac('md5',responseKey);
        hmac.update(serverChallenge);
        hmac.update(clientData);

        let mac = hmac.digest();
        let ret = new Array(mac.length + clientData.length);

        let aux = [...mac.slice(0, mac.length)];
        let aux_i = 0;
        while (aux.length > 0)
            ret.splice(aux_i++, 1, aux.shift());
        
        aux = clientData.slice(0, clientData.length);
        aux_i = mac.length;
        while (aux.length > 0)
            ret.splice(aux_i++, 1, aux.shift());
        
            return ret;    
    }

    /**
     * 
     * @param {String} domain 
     * @param {String} username 
     * @param {String} password 
     */
    nTOWFv2 (domain, username, password)
    {
        let md4 = Crypto.createHmac('md4', '');
        md4.update(LegacyEncoding.encode(password, 'utf16-le'));

        let hmac = Crypto.createHmac('md5', md4.digest());
        hmac.update(LegacyEncoding.encode(username.toUpperCase(), 'utf16-le'));
        hmac.update(LegacyEncoding.encode(domain, 'utf16-le'));
        
        return [...hmac.digest()];
    }

    /**
     * 
     * @param {String} password 
     */
    nTOWFv1 (password)
    {
        if (password == null) {
            throw new Error("Password parameter is required.");
        }
        
        let md4 = Crypto.createHmac('md4', '');
        md4.update(LegacyEncoding.encode(password, 'utf16-le'));
        
        return [...md4.digest()];
    }

    /**
     * 
     * @param {Array} nTOWFv1 
     * @param {Array} serverChallenge 
     * @param {Array} clientChallenge 
     */
    getNTLM2Response(nTOWFv1, serverChallenge, clientChallenge)
    {
        let sessionHash = new Array(8);

        let md5 = Crypto.createHmac('md5', '');
        md5.update(serverChallenge);
        md5.update(clientChallenge);

        let aux = [...md5.digest()].slice(0, 8);
        let aux_i = 0;
        while (aux.length > 0) sessionHash.splice(aux_i++, 1, aux.shift());
        
        let key = new Array(21);
        aux = nTOWFv1.slice(0, 16);
        aux_i = 0;
        while (aux.length > 0) key.splice(aux_i++, 1, aux.shift());

        let ntResponse = new Array(24);
        this.E(key, sessionHash, ntResponse);

        return ntResponse;
    }

    /**
     * 
     * @param {String} domain 
     * @param {String} user 
     * @param {String} password 
     * @param {Array} challenge 
     * @param {Array} clienteChallenge 
     */
    getLMv2Reponse (domain, user, password, challenge, clienteChallenge)
    {
        let response = new Array(24);
        let md4 = Cryptol.createHmac('md4', '');

        md4.update(LegacyEncoding.encode(password, 'utf16-le'));
        let hmac = Crypto.createHmac('md5', md4.digest());
        hmac.update(LegacyEncoding.encode(user.toUpperCase(), 'utf16-le'));
        hmac.update(LegacyEncoding.encode(domain.toUpperCase(), 'utf16-le'));
        hmac = Crypto.createHmac('md5', hmac.digest());
        hmac.update(challenge);
        hmac.update(clienteChallenge);
        
        let aux = [...hmac.digest()];
        for (let index = 0; index < 16; index++) {
            response[index] = aux[i];            
        }

        aux = clienteChallenge.slice(0, 8);
        let aux_i = 16;
        while (aux.length > 0) response.splice(aux_i++, 1, aux.shift());
        
        return response;
    }

    /**
     * 
     * @param {String} password 
     * @param {Array} challenge 
     */
    getNTLMResponse (password, challenge)
    {
        let p21 = new Array(21);
        let p24 = new Array(24);

        let uni = LegacyEncoding.encode(password, 'utf16-le');
        let md4 = Crypto.createHmac('md4', '');
        md4.update(uni);
        
        let aux = [...md4.digest()];
        for (let index = 0; index < 16; index++) {
            p21[index] = aux[index];
        }

        this.E(p21, challenge, p24);

        return p24;
    }

    /**
     * 
     * @param {*} tc 
     * @param {String} password 
     * @param {Array} challenge 
     */
    getPreNTLMResponse (tc, password, challenge)
    {
        let p14 = new Array(14);
        let p21 = new Array(21);
        let p24 = new Array(24);
        let passwordBytes = LegacyEncoding.encode(password, tc.getConfig());
        let passwordLength = passwordBytes.length;

        if (passwordLength > 14) {
            passwordLength = 14;
        }

        let aux = passwordBytes.slice(0, passwordLength);
        let aux_i = 0;
        while (aux.length > 0) p14.splice(aux_i++, 1, aux.shift());
        this.E(p14, this.S8, p21);
        this.E(p21, challenge, p24);

        return p24;
    }

    E (key, data, e ) {
        let key7 = new Array(7);
        let e8 = new Array(8);

        let aux;
        let aux_i;
        for ( let i = 0; i < key.length / 7; i++ ) {
            aux = key.slice(i * 7, 7);
            aux_i = 0;
            while (aux.length > 0) key7.splice(aux_i++, 1, aux.shift());
            
            let des = Crypto.createDecipher('des', Buffer.from(key7));
            aux = des.update(data);
            for (let j = 0; j < data.length; j++) e8[j] = aux[j];
            
            aux = e8.slice(0, 8);
            aux_i = i * 8;
            while (aux.length > 0) e.splice(aux_i++, 1, aux.shift());
        }
    }

}

module.exports = NtlmUtils;