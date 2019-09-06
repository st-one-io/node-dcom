// @ts-check

const HashMap = require('hashmap');
const NetworkDataRepresentation = require('../ndr/networkdatarepresentation');
const System = require('../common/system');
const NdrObject = require('../ndr/ndrobject');
const UUID = require('../rpc/core/uuid');
const OrpcThis = require('./orpcthis');
const OrpcThat = require('./orpcthat');
const InterfacePointer = require('./interfacepointer');
const Flags = require('./flags');
const StdObjRef = require('./stdobjref');

/**
 * RemUnknown class
 */
class RemUnknown extends NdrObject {
    /**
     * 
     * @param {String} ipidOfUnknown
     * @param {String} requestIID
     */
    constructor(ipidOfUnknown, requestIID, refs){
        super();
        this.IID_Unknown = "00000131-0000-0000-c000-000000000046";
        this.ipidOfUnknown = ipidOfUnknown;
        this.requestIID = requestIID;
        this.iidPtr = null;
        this.refs = refs;
    }

    getOpnum() {
        return 3;
    }

    /**
     * 
     * @param {NetworkDataRepresentation} ndr
     */
    write(ndr) {
        let orpcthis = new OrpcThis();
        orpcthis.encode(ndr);

        let uuid = new UUID(this.ipidOfUnknown);
        try {
            uuid.encode(ndr, ndr.buf);
        } catch (e) {
            throw new Error('RemUnknown - write ' + e);
        }

        ndr.writeUnsignedLong(this.refs);
        ndr.writeUnsignedShort(1);// interfaces
        ndr.writeUnsignedShort(0);// aligment
        ndr.writeUnsignedLong(1);// length of the array

        uuid = new UUID(this.requestIID);
        try {
            uuid.encode(ndr, ndr.buf);
        } catch (e) {
            throw new Error('RemUnknown - Performing a QueryInterface for ' + this.requestIID + ' ' + e);
        }

        ndr.writeUnsignedLong(0)//TODO Index Matching
    }

    /**
     *
     * @param {NetworkDataRepresentation} ndr
     */
    read(ndr) {
        let orpcthat = new OrpcThat().decode(ndr);
        ndr.readUnsignedLong();

        let size = ndr.readUnsignedLong();
        for (let i = 0; i < size; i++) {
            let hresult1 = ndr.readUnsignedLong();
            if (hresult1 != 0) {
                throw new Error(hresult1);
            }

            ndr.readUnsignedLong();
            this.iidPtr = new InterfacePointer(this.requestIID, -1, new StdObjRef().decode(ndr));
            //this.iidPtr = new InterfacePointer().decode(ndr, new Array(), Flags.FLAG_NULL, new HashMap());
        }
        let hresult1 = ndr.readUnsignedLong();
        if (hresult1 != 0 ) {
            throw new Error(hresult1);
        }
    }

    getInterfacePointer() {
        return this.iidPtr;
    }
}

module.exports = RemUnknown;