// @ts-check

const InterfacePointer = require('./interfacepointer');
const StdObjRef = require('./stdobjref');
const DualStringArray = require('./dualstringarray');
const NetworkDataRepresentation = require('../ndr/networkdatarepresentation');
const Flags = require('./flags');
const UUID = require('../rpc/core/uuid');

/**
 * Thie class complements the InterfacePointer class by acting as a
 * body while InterfacePointer is like a header.
 */
class InterfacePointerBody {
    /**
     *
     * @param {string} [iid]
     * @param {number|InterfacePointer} [port]
     * @param {StdObjRef} [objref]
     */
    constructor(iid, port, objref) {
        this.iid = null; // String
        this.customCLSID = null; // String
        this.objectType = -1; // int
        this.stdObjRef = null; // StdObjRef
        this.length = -1; // int
        this.resolverAddr = null; // DualStringArray
        this.port = -1; // to be used when doing local resolution. //int

        if (iid === undefined && port === undefined && objref === undefined) return;

        this.iid = iid;
        if (port instanceof InterfacePointer) {
            this.stdObjRef = port.getObjectReference(InterfacePointer.OBJREF_STANDARD);
            this.resolverAddr = port.getStringBindings();
        } else {
            this.port = port;
            this.stdObjRef = objref;
            this.resolverAddr = new DualStringArray(port);
        }
        this.length = 40 + 4 + 4 + 16 + this.resolverAddr.getLength();
    }

    /**
     * @return {boolean}
     */
    isCustomObjRef() {
        return this.objectType == new InterfacePointer().OBJREF_CUSTOM;
    }

    /**
     * @return {string}
     */
    getCustomCLSID() {
        return this.customCLSID;
    }

    /**
     *
     * @param {NetworkDataRepresentation} ndr
     * @param {number} flags
     * @return {InterfacePointerBody}
     */
    decode(ndr, flags) {
        if ((flags & Flags.FLAG_REPRESENTATION_INTERFACEPTR_DECODE2) == Flags.FLAG_REPRESENTATION_INTERFACEPTR_DECODE2) {
            return this.decode2(ndr);
        }

        let length = ndr.readUnsignedLong();
        ndr.readUnsignedLong();// length

        let ptr = new InterfacePointerBody();
        ptr.length = length;

        // check for MEOW
        let b = []
        b = ndr.readOctetArray(b, 0, 4);
        for (let i = 0; i < 4; i++) {
            if (b[i] != InterfacePointer.OBJREF_SIGNATURE[i]) {
                return null;
            }
        }

        // TODO only STDOBJREF supported for now
        ptr.objectType = ndr.readUnsignedLong()
        if (ptr.objectType != InterfacePointer.OBJREF_STANDARD) {

            let ipid2 = new UUID();
            ipid2.decode(ndr, ndr.getBuffer());
            ptr.iid = ipid2.toString();

            let clsid = new UUID();
            clsid.decode(ndr, ndr.getBuffer());
            ptr.customCLSID = clsid.toString();

            // extension
            ndr.readUnsignedLong();

            // reserved
            ndr.readUnsignedLong();

            return ptr;
        }

        let ipid2 = new UUID();
        ipid2.decode(ndr, ndr.getBuffer());
        ptr.iid = ipid2.toString();
        ptr.stdObjRef = StdObjRef.decode(ndr);
        ptr.resolverAddr = DualStringArray.decode(ndr);

        return ptr;
    }

    /**
     *
     * @param {NetworkDataRepresentation} ndr
     * @return {InterfacePointerBody}
     */
    decode2(ndr) {

        let ptr = new InterfacePointerBody();

        // check for MEOW
        let b = new Array(4);
        b = ndr.readOctetArray(b, 0, 4);

        let i = 0;
        while (i != 4) {
            // not MEOW then what ?
            if (b[i] != new InterfacePointer().OBJREF_SIGNATURE[i]) {
                return null;
            }
            i++;
        }

        // TODO only STDOBJREF supported for now
        if ((ptr.objectType = ndr.readUnsignedLong()) != new InterfacePointer().OBJREF_STANDARD) {
            return null;
        }

        try {
            let ipid2 = new UUID();
            ipid2.decode(ndr, ndr.getBuffer());
            ptr.iid = ipid2.toString();
        } catch (e) {
            throw new Error('InterfacePointer - decode' + e);
        }

        ptr.stdObjRef = StdObjRef.decode(ndr);

        ptr.resolverAddr = DualStringArray.decode(ndr);

        return ptr;
    }

    /**
     * @return {Number}
     */
    getObjectType() {
        return this.objectType;
    }

    /**
     * @param {Object} objectType
     * @return {Object}
     */
    getObjectReference(objectType) {
        if (objectType == new InterfacePointer().OBJREF_STANDARD) {
            return this.stdObjRef;
        } else {
            return null;
        }
    }

    /**
     * @return {Number}
     */
    getIID() {
        return this.iid;
    }

    /**
     * @return {String}
     */
    getIPID() {
        return this.stdObjRef.getIpid();
    }

    /**
     * @return {String}
     */
    getOID() {
        return this.stdObjRef.getObjectId();
    }

    /**
     * @return {String}
     */
    getStringBindings() {
        return this.resolverAddr;
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
     * @param {Number} FLAGS
     */
    encode(ndr, FLAGS) {
        // now for length
        // the length for STDOBJREF is fixed 40 bytes : 4,4,8,8,16.
        // Dual string array has to be computed, since that can vary. MEOW = 4., flag stdobjref = 4
        // + 16 bytes of ipid
        let length = 0;
        if (!this.isCustomObjRef()) {
            length = 40 + 4 + 4 + 16 + this.resolverAddr.getLength();
        }

        ndr.writeUnsignedLong(length);
        ndr.writeUnsignedLong(length);

        // for OBJREF_CUSTOM we will correct this length after the custom object has been marshalled.
        // this object is marshalled 4 + 4 + 40 bytes after this point. The length of the length itself is not included.
        ndr.writeOctetArray(new InterfacePointer().OBJREF_SIGNATURE, 0, 4);

        if (this.isCustomObjRef()) {
            ndr.writeUnsignedLong(new InterfacePointer().OBJREF_CUSTOM);
            try {
                let ipid2 = new UUID(iid);
                ipid2.encode(ndr, ndr.getBuffer());
                ipid2 = new UUID(this.customCLSID);
                ipid2.encode(ndr, ndr.getBuffer());
                ndr.writeUnsignedLong(0); // extension
                ndr.writeUnsignedLong(0); // reserved, now the spec say that this is ignored by the server but the
                // the WMIO marshaller puts the length of the entire buffer here. If this is the case then we will have to go
                // 4 bytes back and rewrite this with total lengths in the custom marshaller.
            } catch (e) {
                // TODO Auto-generated catch block
                throw new Error(e);
            }

            return;// rest will be filled by the Custom Marshaller.
        }

        // std ref
        ndr.writeUnsignedLong(new InterfacePointer().SORF_OXRES1);

        try {
            let ipid2 = new UUID(iid);

            if ((FLAGS & Flags.FLAG_REPRESENTATION_USE_IUNKNOWN_IID) == Flags.FLAG_REPRESENTATION_USE_IUNKNOWN_IID) {
                ipid2 = new UUID(new ComObject().IID);
            } else if ((FLAGS & Flags.FLAG_REPRESENTATION_USE_IDISPATCH_IID) == Flags.FLAG_REPRESENTATION_USE_IDISPATCH_IID) {
                ipid2 = new UUID(new Dispatch().IID);
            }

            ipid2.encode(ndr, ndr.getBuffer());
        } catch (e) {
            // TODO Auto-generated catch block
            throw new Error(e);
        }
        this.stdObjRef.encode(ndr);
        this.resolverAddr.encode(ndr);
    }
}

// export "static" members
InterfacePointerBody.decode = InterfacePointerBody.prototype.decode;
InterfacePointerBody.decode2 = InterfacePointerBody.prototype.decode2;

module.exports = InterfacePointerBody;