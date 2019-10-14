/* eslint-disable indent */
//@ts-check

const NetworkDataRepresentation = require('../ndr/networkdatarepresentation');
const COM_C_AUTHZ_NONE = 0xffff;

/**
 * Security Bindings info.
 */
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

    /**
     * @return {Number}
     */
    getLength() {
        return this.length;
    }


    /**
     *
     * @param {NetworkDataRepresentation} ndr
     * @return {SecurityBinding}
     */
    decode(ndr) {
        let securityBinding = new SecurityBinding();

        securityBinding.authnSvc = ndr.readUnsignedShort();

        if (securityBinding.authnSvc == 0) {
            return null;
        }

        securityBinding.authzSvc = ndr.readUnsignedShort();

        let retVal = -1;
        let buffer = [];
        while ((retVal = ndr.readUnsignedShort()) != 0) {
            buffer.push(String.fromCharCode(retVal));
        }

        securityBinding.princName = buffer.join();

        securityBinding.length = 2 + 2 +
         securityBinding.princName.length * 2 + 2;

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

    // eslint-disable-next-line indent
    }
}

// emulate "static" members
SecurityBinding.decode = SecurityBinding.prototype.decode;

module.exports = SecurityBinding;