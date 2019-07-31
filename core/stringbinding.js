//@ts-check

const Session = require('./session');
const NetworkDataRepresentation = require('../ndr/networkdatarepresentation');

class StringBinding {

    /**
     * 
     * @param {number} [port]
     * @param {boolean} [hostname]
     */
    constructor(port, hostname) {
        this.towerId = -1;
        this.networkAddress = null;
        this.length = -1;

        if (port === undefined && hostname === undefined) return;

        let hostaddress = null;
        if (!hostname) {
            //single binding with our IP address
            hostaddress = new Session().getLocalHostAsIpString();
        } else {
            hostaddress = new Session().getLocalHostCanonicalAddressAsString();
        }

        if (port == -1) {
            this.networkAddress = hostaddress;
        }
        else {
            this.networkAddress = `${hostaddress}[${port}]`;
        }

        this.length = 2 + this.networkAddress.length * 2 + 2;
        this.towerId = 0x7; //TCP_IP
    }

    /**
     * @returns {number}
     */
    getLength() {
        return this.length;
    }

    /**
     * 
     * @param {NetworkDataRepresentation} ndr
     * @returns {StringBinding}
     */
    decode(ndr) {
        let stringBinding = new StringBinding();

        stringBinding.towerId = ndr.readUnsignedShort();

        //hit the end , security bindings start.
        if (stringBinding.towerId == 0) {
            return null;
        }

        //now to read the String till a null termination character.
        // a '0' will be represented as 30
        let retVal = -1;
        let buffer = [];
        while ((retVal = ndr.readUnsignedShort()) != 0) {
            //even though this is a unicode string , but will not have anything else
            //other than ascii charset, which is supported by all encodings.
            buffer.push(String.fromCharCode(retVal));
        }

        let temp = buffer;
        stringBinding.networkAddress = "";
        while (temp.length > 0) stringBinding.networkAddress += temp.shift();
        // 2 bytes for tower id, each character is 2 bytes (short) and last 2 bytes for null termination
        stringBinding.length = 2 + stringBinding.networkAddress.length * 2 + 2;

        return stringBinding;
    }

    /**
     * @returns {number}
     */
    getTowerId() {
        return this.towerId;
    }

    /**
     * @returns {string}
     */
    getNetworkAddress() {
        return this.networkAddress;
    }

    /**
     * 
     * @param {NetworkDataRepresentation} ndr
     */
    encode(ndr) {
        ndr.writeUnsignedShort(this.towerId);

        //now to write the network address.
        let i = 0;
        while (i < this.networkAddress.length) {
            ndr.writeUnsignedShort(this.networkAddress.charCodeAt(i));
            i++;
        }
        ndr.writeUnsignedShort(0); //null termination

    }

}

// emulate "static" members
StringBinding.decode = StringBinding.prototype.decode;

module.exports = StringBinding;
