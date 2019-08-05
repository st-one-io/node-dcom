//@ts-check

let inited = false;
let Oxid;
let ObjectId;
let NetworkDataRepresentation;
let MarshalUnMarshalHelper;
let UUID;

class StdObjRef {

    /**
     * 
     * @param {string} [ipid] 
     * @param {Oxid} [oxid] 
     * @param {ObjectId} [oid] 
     */
    constructor(ipid, oxid, oid) {
        this._init();
        this.flags = 0x0; //int
        this.publicRefs = -1; //int
        this.oxid = null; //byte[]
        this.oid = null; //byte[]
        this.ipidOfthisObjectRef = null; //String

        if (ipid === undefined && oxid === undefined && oid === undefined) return;

        this.ipidOfthisObjectRef = ipid;
        this.oxid = oxid ? oxid.getOXID() : [0, 0, 0, 0, 0, 0, 0, 0];
        this.oid = oid ? oid.getOID() : [0, 0, 0, 0, 0, 0, 0, 0];
        this.publicRefs = oid && oxid ? 5 : 0;
    }

    /**
     * 
     * @param {NetworkDataRepresentation} ndr
     * @returns {StdObjRef}
     */
    decode(ndr) {
        let objRef = new StdObjRef();

        objRef.flags = ndr.readUnsignedLong();
        objRef.publicRefs = ndr.readUnsignedLong();
        objRef.oxid = MarshalUnMarshalHelper.readOctetArrayLE(ndr, 8);
        objRef.oid = MarshalUnMarshalHelper.readOctetArrayLE(ndr, 8);

        let ipid2 = new UUID();
        ipid2.decode(ndr, ndr.getBuffer());
        objRef.ipidOfthisObjectRef = ipid2.toString();
        return objRef;
    }

    getFlags() {
        return this.flags;
    }

    getPublicRefs() {
        return this.publicRefs;
    }

    getOxid() {
        return this.oxid.slice();
    }

    getObjectId() {
        return this.oid.slice();
    }

    getIpid() {
        return this.ipidOfthisObjectRef;
    }

    /**
     * 
     * @param {NetworkDataRepresentation} ndr
     */
    encode(ndr) {
        ndr.writeUnsignedLong(this.flags);
        ndr.writeUnsignedLong(this.publicRefs);
        MarshalUnMarshalHelper.writeOctetArrayLE(ndr, this.oxid);
        MarshalUnMarshalHelper.writeOctetArrayLE(ndr, this.oid);

        let ipid = new UUID(this.ipidOfthisObjectRef);
        ipid.encode(ndr, ndr.getBuffer());
    }

    toString() {
        return `StdObjRef[IPID: ${this.ipidOfthisObjectRef}]`;
    }

    _init() {
        if (inited) return;
        Oxid = require('./oxid');
        ObjectId = require('./objectid');
        NetworkDataRepresentation = require('../ndr/networkdatarepresentation');
        MarshalUnMarshalHelper = require('./marshalunmarshalhelper');
        UUID = require('../rpc/core/uuid');
        inited = true;
    }
}

// export "static" members
StdObjRef.decode = StdObjRef.prototype.decode;

module.exports = StdObjRef;
