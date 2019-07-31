//@ts-check

const StringBinding = require('./stringbinding');
const SecurityBinding = require('./securitybinding');
const NetworkDataRepresentation = require('../ndr/networkdatarepresentation');

class DualStringArray {

    /**
     * 
     * @param {number} [port]
     */
    constructor(port) {
        /** @type {StringBinding[]} */
        this.stringBinding = [];
        /** @type {SecurityBinding[]} */
        this.securityBinding = [];
        this.length = 0;
        this.secOffset = 0;

        if (port === undefined) return;

        //create bindings here.
        this.stringBinding[0] = new StringBinding(port, false);
        this.stringBinding[1] = new StringBinding(port, true);

        this.length = this.stringBinding[0].getLength();
        this.length += this.stringBinding[1].getLength() + 2; //null termination

        this.secOffset = this.length;

        this.securityBinding[0] = new SecurityBinding(0x0a, 0xffff, "");
        this.length += this.securityBinding[0].getLength();

        this.length += 2 + 2 + 2; //null termination, 2 bytes for num entries and 2 bytes for sec offset.
    }

    /**
     * 
     * @param {NetworkDataRepresentation} ndr
     */
    decode(ndr) {
        let dualStringArray = new DualStringArray();

        //first extract number of entries
        let numEntries = ndr.readUnsignedShort();

        //return empty
        if (numEntries == 0)
            return dualStringArray;

        //extract security offset
        let securityOffset = ndr.readUnsignedShort();

        let listOfStringBindings = [];
        let listOfSecurityBindings = [];

        let stringbinding = true;
        while (true) {
            if (stringbinding) {
                let s = StringBinding.decode(ndr);
                if (!s) {
                    stringbinding = false;
                    //null termination
                    dualStringArray.length = dualStringArray.length + 2;
                    dualStringArray.secOffset = dualStringArray.length;
                    continue;
                }

                listOfStringBindings.push(s);
                dualStringArray.length = dualStringArray.length + s.getLength();
            }
            else {
                let s = SecurityBinding.decode(ndr);
                if (!s) {
                    //null termination
                    dualStringArray.length = dualStringArray.length + 2;
                    break;
                }

                listOfSecurityBindings.push(s);
                dualStringArray.length = dualStringArray.length + s.getLength();
            }

        }

        // 2 bytes for num entries and 2 bytes for sec offset.
        dualStringArray.length = dualStringArray.length + 2 + 2;

        dualStringArray.stringBinding = listOfStringBindings;
        dualStringArray.securityBinding = listOfSecurityBindings;
        return dualStringArray;
    }

    /**
     * @returns {StringBinding[]}
     */
    getStringBindings() {
        return this.stringBinding;
    }

    /**
     * @returns {SecurityBinding[]}
     */
    getSecurityBindings() {
        return this.securityBinding;
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
     */
    encode(ndr) {
        //fill num entries
        //this is total length/2. since they are all shorts
        ndr.writeUnsignedShort((this.length - 4) / 2);
        ndr.writeUnsignedShort((this.secOffset) / 2);

        let i = 0;
        for (const s of this.stringBinding) {
            s.encode(ndr);
        }
        if (this.stringBinding.length) {
            ndr.writeUnsignedShort(0);
        }

        for (const s of this.securityBinding) {
            s.encode(ndr);
        }
        if (this.securityBinding.length) {
            ndr.writeUnsignedShort(0);
        }

    }

}

// export "static" members
DualStringArray.decode = DualStringArray.prototype.decode;

module.exports = DualStringArray;