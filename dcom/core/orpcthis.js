//@ts-check
const Struct = require('./struct.js');
const Flags = require('./flags');
const ComArray = require('./comarray');
const Pointer = require('./pointer');
const OrpcExtentArray = require('./orpcextentarray.js');
const MarshalUnMarshalHelper = require('./marshalunmarshalhelper.js');
const System = require('../common/system');
const ComVersion = require('../common/comversion');
const UUID = require('../rpc/core/uuid');
const NetworkDataRepresentation = require('../ndr/networkdatarepresentation');

const types = require('./types');
const ComValue = require('./comvalue');

function generateUUID() {
    let d = new Date().getTime();
    let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}
/**
 * TODO - this "cidForCallback" let each thread have its
 * own copy of a variable in Java. We don't have threads in
 * JS, so we need to check how/why sth like this is going
 * to be needed. For now, just use a global variable
 */
//let cidForCallback = new ThreadLocal();
let cidForCallback;

class OrpcThis {

    constructor(casualityIdentifier) {
        this.cid = casualityIdentifier ? casualityIdentifier.toString() : generateUUID();
        this.flags = 0
        this.arry = null; //OrpcExtentArray[]
        this.version = new System().getComVersion();
    }

    setORPCFlags(flags) {
        this.flags = flags;
    }

    getORPCFlags() {
        return this.flags;
    }

    /**
     * 
     * @param {OrpcExtentArray[]} arry
     */
    setExtentArray(arry) {
        this.arry = arry;
    }

    /**
     * @returns {OrpcExtentArray[]}
     */
    getExtentArray() {
        return this.arry;
    }

    /**
     * @returns {String}
     */
    getCasualityIdentifier() {
        return this.cid;
    }

    /**
     * 
     * @param {NetworkDataRepresentation} ndr
     */
    encode(ndr) {
        ndr.writeUnsignedShort(this.version.getMajorVersion()); //COM Major version
        ndr.writeUnsignedShort(this.version.getMinorVersion()); //COM minor version
        ndr.writeUnsignedLong(this.flags); // No Flags
        ndr.writeUnsignedLong(0); // Reserved ...always 0.

        //the order here is important since the cid is always filled from the ctor hence will never be null.
        //let cid2 = cidForCallback.get() == null ? cid : (String)cidForCallback.get();
        let cid2 = cidForCallback || this.cid;
        let uuid = new UUID(cid2);
        uuid.encode(ndr, ndr.getBuffer());

        let i = 0;
        if (this.arry && this.arry.length != 0) {
            ndr.writeUnsignedLong(this.arry.length);
            ndr.writeUnsignedLong(0);
            for (const arryy of this.arry) {
                uuid = new UUID(arryy.getGUID());
                uuid.encode(ndr, ndr.getBuffer());

                ndr.writeUnsignedLong(arryy.getSizeOfData());
                ndr.writeOctetArray(arryy.getData(), 0, arryy.getSizeOfData());

            }
        } else {
            ndr.writeUnsignedLong(0);
        }
    }

    /**
     *
     * @param {NetworkDataRepresentation} ndr
     */
    decode(ndr) {
        let retval = new OrpcThis();
        let map = new Map();
        let majorVersion = MarshalUnMarshalHelper.deSerialize(ndr, new ComValue(null, types.SHORT), null, Flags.FLAG_NULL, map);
        let minorVersion = MarshalUnMarshalHelper.deSerialize(ndr, new ComValue(null, types.SHORT), null, Flags.FLAG_NULL, map);

        retval.version = new ComVersion(majorVersion, minorVersion);
        retval.flags = MarshalUnMarshalHelper.deSerialize(ndr, new ComValue(null, types.INTEGER), null, Flags.FLAG_NULL, map);

        MarshalUnMarshalHelper.deSerialize(ndr, new ComValue(null, types.INTEGER), null, Flags.FLAG_NULL, map);//reserved.

        let uuid = new UUID();
        uuid.decode(ndr, ndr.getBuffer());
        retval.cid = uuid.toString();

        let orpcextentarray = new Struct();
        //create the orpcextent struct
        /*
            *  typedef struct tagORPC_EXTENT
        {
            GUID                    id;          // Extension identifier.
            unsigned long           size;        // Extension size.
            [size_is((size+7)&~7)]  byte data[]; // Extension data.
        } ORPC_EXTENT;
    
            */

        let orpcextent = new Struct();
        orpcextent.addMember(new ComValue(null, types.UUID));
        orpcextent.addMember(new ComValue(null, types.INTEGER)); //length
        orpcextent.addMember(new ComValue(new ComArray(new ComValue(null, types.BYTE), null, 1, true), types.COMARRAY));
        //create the orpcextentarray struct
        /*
            *    typedef struct tagORPC_EXTENT_ARRAY
        {
            unsigned long size;     // Num extents.
            unsigned long reserved; // Must be zero.
            [size_is((size+1)&~1,), unique] ORPC_EXTENT **extent; // extents
        } ORPC_EXTENT_ARRAY;
    
        */


        orpcextentarray.addMember(new ComValue(null, types.INTEGER));
        orpcextentarray.addMember(new ComValue(null, types.INTEGER));
        //this is since the pointer is [unique]
        let comOrpcExtent = new ComValue(orpcextent, types.STRUCT);
        let comOrpcExtentPointer = new ComValue(new Pointer(comOrpcExtent), types.POINTER);
        let comOrpcExtentPointerArray = new ComValue(new ComArray(comOrpcExtentPointer, null, 1, true), types.COMARRAY);
        let comOrpcExtentPointerArrayPointer = new ComValue(new Pointer(comOrpcExtentPointerArray), types.POINTER);
        orpcextentarray.addMember(comOrpcExtentPointerArrayPointer);


        let comOrpcextentarray = new ComValue(orpcextentarray, types.STRUCT);
        let comOrpcextentarrayPointer = new ComValue(new Pointer(comOrpcextentarray), types.POINTER);
        /**@type {Pointer[]} */
        let listOfDefferedPointers = [];
        let orpcextentarrayptr = MarshalUnMarshalHelper.deSerialize(ndr, comOrpcextentarrayPointer, listOfDefferedPointers, Flags.FLAG_NULL, map);
        let x = 0;

        while (x < listOfDefferedPointers.length) {
            let newList = [];
            let replacement = MarshalUnMarshalHelper.deSerialize(ndr, new ComValue(listOfDefferedPointers[x], types.POINTER), newList, Flags.FLAG_NULL, map);
            listOfDefferedPointers[x].replaceSelfWithNewPointer(replacement); //this should replace the value in the original place.
            x++;
            listOfDefferedPointers.splice(x, 0, ...newList);
        }

        let extentArrays = [];
        //now read whether extend array exists or not
        if (!orpcextentarrayptr.isNull()) {
            let pointers = orpcextentarrayptr.getReferent().getMember(2).getReferent().getArrayInstance(); //Pointer[]
            for (let i = 0; i < pointers.length; i++) {
                if (pointers[i].isNull())
                    continue;

                let orpcextent2 = pointers[i].getReferent(); //Struct
                let byteArray = orpcextent2.getMember(2).getArrayInstance(); //Byte[]

                extentArrays.push(new OrpcExtentArray(orpcextent2.getMember(0).toString(), byteArray.length, byteArray));
            }

        }

        retval.arry = extentArrays;

        //decode can only be executed incase of a request made from the server side in case of a callback. so the thread making this
        //callback will store the cid from the decode operation in the threadlocal variable. In case an encode is performed using the
        //same thread then we know that this is a nested call. Hence will replace the cid with the thread local cid. For the calls being in
        //case of encode this value will not be used if the encode thread is of the client and not of ComOxidRuntimeHelper.
        cidForCallback = retval.cid;
        return retval;
    }

}

// emulate static methods
OrpcThis.decode = OrpcThis.prototype.decode;

module.exports = OrpcThis;