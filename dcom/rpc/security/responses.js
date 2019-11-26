// @ts-check

const Crypto = require('crypto');
const LegacyEncoding = require('legacy-encoding');

class Responses
{
    constructor(){}

    /**
     * 
     * @param {String} password 
     * @param {Array} challenge 
     */
    getLMResponse (password, challenge)
    {
        let lmHash = this.lmHash(password);
        return this.lmResponse(lmHash, challenge);
    }

    /**
     * 
     * @param {String} password 
     * @param {Array} challenge 
     */
    getNTLMResponse (password, challenge)
    {
        let ntlmHash = this.ntlmHash(password);
        return this.lmResponse(ntlmHash, challenge);
    }

    /**
     * 
     * @param {String} target 
     * @param {String} user 
     * @param {String} password 
     * @param {Array} targetInformation 
     * @param {Array} challenge 
     * @param {Array} clientNonce 
     */
    getNTLMv2Response (target, user, password, targetInformation, challenge, clientNonce)
    {
        let retval = new Array(2);
        let ntlmv2Hash = this.ntlmv2Hash(target, user, password);
        let blob = this.createBlob(targetInformation, clientNonce);

        retval[1] = blob;
        retval[0] = this.lmv2Response(ntlmv2Hash, blob, challenge);
        
        return retval;
    }

    /**
     * 
     * @param {String} target 
     * @param {String} user 
     * @param {String} password 
     * @param {Array} challenge 
     * @param {Array} clientNonce 
     */
    getLMv2Response (target, user, password, challenge, clientNonce)
    {
        let ntlmv2Hash = this.ntlmv2Hash(target, user, password);
        return this.lmv2Response(ntlmv2Hash, clientNonce, challenge);
    }

    /**
     * 
     * @param {String} password 
     * @param {Buffer} challenge 
     * @param {Buffer} clientNonce 
     */
    getNTLM2SessionResponse(password, challenge, clientNonce)
    {        
        // create a hash of the given password
        let ntlm = this.ntlmHash(password);
        let md5 = Crypto.createHash('md5');
        
        // concatenate the challenge with the nonce and create an md5 hash
        clientNonce = Buffer.concat([challenge, clientNonce], (challenge.length + clientNonce.length));
        md5.update(clientNonce);
        
        // create a sessionHash with the first 8 bytes of the md5 hash
        let sessionHash = md5.digest().slice(0, 8);

        return this.lmResponse(ntlm, sessionHash);
    }

    /**
     * 
     * @param {String} password 
     */
    lmHash (password)
    {
        let oemPassword = [...Buffer.from(password.toUpperCase())];
        let length = Math.min(oemPassword.length, 14);
        let keyBytes = new Array(14);

        let aux = oemPassword.slice(0, length);
        let aux_i = 0;
        while (aux.length > 0) keyBytes.splice(aux_i++, 1, aux.shift());

        let lowKey = this.createDESKey(keyBytes, 0);
        let highKey = this.createDESKey(keyBytes, 7);

        let magicConstant = LegacyEncoding.encode("KGS!@#$%", "us-ascii");

        let des = Crypto.createCipheriv('ded-ecb', Buffer.from(lowKey),'');
        des.update(magicConstant);
        let lowHash = [...des.final()];
        //aux = des.final();

        des = Crypto.createCipheriv('des-ecb', Buffer.from(highKey),'');
        des.update(magicConstant)
        let highHash = [...des.final()];

        let lmHash = new Array();
        lmHash.concat(lowHash);
        lmHash.concat(highHash);

        return lmHash;
    }

    /**
     * 
     * @param {String} password 
     */
    ntlmHash (password)
    {
        let unicodePassword = Buffer.from(password, 'utf16le');

        let md4 = Crypto.createHash('md4');

        md4.update(unicodePassword);
        
        return md4.digest();
    }

    /**
     * 
     * @param {String} target 
     * @param {String} user 
     * @param {String} password 
     */
    ntlmv2Hash (target, user, password)
    {
        let ntlmHash = this.ntlmHash(password);
        let identity = user.toUpperCase() + target;

        return this.hmacMD5(LegacyEncoding.encode(identity, "utf16-le"), ntlmHash);
    }

    /**
     * 
     * @param {Buffer} hash 
     * @param {Array} challenge 
     */
    lmResponse (hash, challenge)
    {
        let keyBytes = Buffer.from([0, 0, 0, 0, 0], 'utf16le');
        keyBytes = Buffer.concat([hash, keyBytes], (hash.length + keyBytes.length));
        
        let lowKey = this.createDESKey(keyBytes, 0);
        let middleKey = this.createDESKey(keyBytes, 7);
        let highKey = this.createDESKey(keyBytes, 14);
        
        let des = Crypto.createCipheriv("des-ecb", lowKey,'');
        let lowResponse = des.update(challenge);
        des.final();

        des = Crypto.createCipheriv("des-ecb", middleKey, '');
        let middleResponse = des.update(challenge)
        des.final();

        des = Crypto.createCipheriv("des-ecb", highKey, '');
        let highResponse = des.update(challenge);
        des.final();

        let lmResponse;
        lmResponse = Buffer.concat([lowResponse, middleResponse, highResponse], (
            lowResponse.length + middleResponse.length + highResponse.length));
        
        return lmResponse;
    }

    /**
     * 
     * @param {Array} hash 
     * @param {Array} clientData 
     * @param {Array} challenge 
     */
    lmv2Response (hash, clientData, challenge)
    {
        let data = new Array(challenge.length + clientData.length);

        let aux = challenge.slice(0, challenge.length);
        let aux_i = 0;
        while (aux.lenght > 0) data.splice(aux_i++, 1, aux.shift());

        aux = clientData.slice(0, clientData.length);
        aux_i = challenge.length;
        while (aux.lenght > 0) data.splice(aux_i++, 1, aux.shift());

        let mac = this.hmacMD5(data, hash);
        let lmv2Response = new Array();

        lmv2Response.concat(mac);
        lmv2Response.concat(clientData);

        return lmv2Response.slice(0, (mac.length + clientData.length));
    }

    /**
     * 
     * @param {Array} targetInformation 
     * @param {Array} clientNonce 
     */
    createBlob (targetInformation, clientNonce)
    {
        let blobSignature = [0x01, 0x01, 0x00, 0x00];

        let reserved = [0x00, 0x00, 0x00, 0x00];

        let unknown1 = [0x00, 0x00, 0x00, 0x00];

        let unknown2 = [0x00, 0x00, 0x00, 0x00];

        let time = Date.now();
        time += 11644473600000;
        time *= 10000;

        let timestamp = new Array(8);
        for (let index = 0; index < 8; index++) {
            timestamp[index] = (time >> (8 * 0)) && 0xff;
            time >>>= 8;
        }

        let blob = new Array();

        blob.concat(blobSignature);
        blob.concat(reserved);
        blob.concat(timestamp);
        blob.concat(clientNonce);
        blob.concat(unknown1);
        blob.concat(targetInformation);
        blob.concat(unknown2);
        
        return blob;
    }

    /**
     * 
     * @param {Array} data 
     * @param {Array} key 
     */
    hmacMD5 (data, key)
    {
        let ipad = new Array(64);
        let opad = new Array(64);

        for (let index = 0; index < 64; index++) {
            ipad[index] = (0x36 >> (8 * 0)) && 0xff;
            opad[index] = (0x5c >> (8 * 0)) && 0xff
        }

        for (let index = key.length - 1; index >= 0; index--) {
            ipad[index] ^= key[index];
            opad[index] ^= key[index];
        }

        let content = new Array(data.length + 64);

        let aux = ipad.slice(0, 64);
        let aux_i = 0;
        while (aux.length > 0) content.splice(aux_i++, 1, aux.shift());

        aux = data.slice(0, data.length);
        aux_i = 64;
        while (aux.length > 0) content.splice(aux_i++, 1, aux.shift());

        let md5 = Crypto.createHmac('md5', '');
        md5.update(Buffer.from(content));
        data = md5.digest();

        content = new Array(data.length + 64);

        aux = opad.slice(0, 64);
        aux_i = 0;
        while (aux.length > 0) content.splice(aux_i++, 1, aux.shift());

        aux = data.slice(0, data.length);
        aux_i = 0;
        while (aux.length > 0) content.splice(aux_i++, 1, aux.shift());

        md5.update(Buffer.from(content));
        return md5.digest();
    }

    /**
     * 
     * @param {Buffer} bytes 
     * @param {Number} offset 
     */
    createDESKey (bytes, offset)
    {
        let keyBytes = bytes.slice(offset, 7 + offset);
        
        let material = Buffer.alloc(8);
        material[0] = keyBytes[0];
        material[1] = ((keyBytes[0] << 7) & 0xff  | ((keyBytes[1] & 0xff) >>>1));
        material[2] = ((keyBytes[1] << 6) & 0xff  | ((keyBytes[2] & 0xff) >>>2));
        material[3] = ((keyBytes[2] << 5) & 0xff  | ((keyBytes[3] & 0xff) >>>3));
        material[4] = ((keyBytes[3] << 4) & 0xff  | ((keyBytes[4] & 0xff) >>>4));
        material[5] = ((keyBytes[4] << 3) & 0xff  | ((keyBytes[5] & 0xff) >>>5));
        material[6] = ((keyBytes[5] << 2) & 0xff  | ((keyBytes[6] & 0xff) >>>6));
        material[7] = ((keyBytes[6] << 1));

        this.oddParity(material);
        return material;
    }
    
    /**
     * 
     * @param {Buffer} bytes 
     */
    oddParity (bytes)
    {
        for (let index = 0; index < bytes.length; index++) {
            let b = bytes[index];
            let needsParity = (((b >>> 7) ^ (b >>> 6) ^ (b >>> 5) ^
                (b >>> 4) ^ (b >>> 3) ^ (b >>> 2) ^(b >>> 1)) & 0x01) == 0;
            if (needsParity) {
                bytes[index] |= 0x01;
            } else {
                bytes[index] &= 0xfe;
            }
        }
    }
}
module.exports = Responses;