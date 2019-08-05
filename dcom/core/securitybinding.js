//@ts-check

const NetworkDataRepresentation = require('../ndr/networkdatarepresentation');

const COM_C_AUTHZ_NONE = 0xffff;

class SecurityBinding {

    /**
     * 
     * @param {number} [authnSvc] 
     * @param {number} [authzSvc] 
     * @param {string} [princName] 
     */
    constructor(authnSvc, authzSvc, princName) {
        this.authnSvc = authnSvc || 0;
        this.authzSvc = authzSvc || 0;
        this.princName = princName || "";
        this.length = 2 + 2 + 2 + this.princName.length * 2;
    }

    getLength() {
        return this.length;
    }


    /**
     * 
     * @param {NetworkDataRepresentation} ndr
     * @returns {SecurityBinding}
     */
    decode(ndr) {
        let securityBinding = new SecurityBinding();

        securityBinding.authnSvc = ndr.readUnsignedShort();

        if (securityBinding.authnSvc == 0) {
            //security binding over.
            return null;
        }

        securityBinding.authzSvc = ndr.readUnsignedShort();

        //now to read the String till a null termination character.
        // a '0' will be represented as 30
        let retVal = -1;
        let buffer = [];
        while ((retVal = ndr.readUnsignedShort()) != 0) {
            //even though this is a unicode string , but will not have anything else
            //other than ascii charset, which is supported by all encodings.
            buffer.push(String.fromCharCode(retVal));
        }

        securityBinding.princName = buffer.join();

        // 2 bytes for authnsvc, 2 for authzsvc , each character is 2 bytes (short) and last 2 bytes for null termination
        securityBinding.length = 2 + 2 + securityBinding.princName.length * 2 + 2;

        return securityBinding;
    }

    /**
     * 
     * @param {NetworkDataRepresentation} ndr
     */
    encode(ndr) {
        ndr.writeUnsignedShort(this.authnSvc);
        ndr.writeUnsignedShort(this.authzSvc);

        //now to write the network address.
        let i = 0;
        while (i < this.princName.length) {
            ndr.writeUnsignedShort(this.princName.charCodeAt(i));
            i++;
        }

        ndr.writeUnsignedShort(0); //null termination

    }
}

// emulate "static" members
SecurityBinding.decode = SecurityBinding.prototype.decode;

module.exports = SecurityBinding;