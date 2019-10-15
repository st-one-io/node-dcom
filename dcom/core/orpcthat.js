//@ts-check

const OrpcExtentArray = require('./orpcextentarray.js');
const OrpcFlags = require('./orpcflags');
const Struct = require('./struct');
const Pointer = require('./pointer');
const ComArray = require('./comarray');
const Flags = require('./flags');
const MarshalUnMarshalHelper = require('./marshalunmarshalhelper.js');
const NetworkDataRepresentation = require('../ndr/networkdatarepresentation');

const types = require('./types');
const ComValue = require('./comvalue');


class OrpcThat {

    constructor() {
        this.flags = -1; //int
        this.arry = null; //OrpcExtentArray
    }

    /**
     * 
     * @param {number} value 
     */
    setFlags(value) {
        this.flags = value;
    }

    /**
     * Returns an array of flags present (OrpcFlags).
     * For now only 2 flags are returned to the user 0 
     * and 1. Reserved flags are not returned.
     * @returns {number[]}
     */
    getSupportedFlags() {

        if (this.flags == -1)
            return null;

        if ((this.flags & 1) == 1) {
            return [1];
        }
        else{
            return [0];
        }
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
     * 
     * @param {NetworkDataRepresentation} ndr
     */
    encode(ndr) {
        ndr.writeUnsignedLong(0);
        ndr.writeUnsignedLong(0);
    }

    //TODO this is static, should be out of the class
    /**
     * 
     * @param {NetworkDataRepresentation} ndr
     * @returns {OrpcThat}
     */
    decode(ndr) {
        let orpcthat = new OrpcThat();
        orpcthat.setFlags(ndr.readUnsignedLong());

        //to throw RuntimeException from here.
        if (orpcthat.flags != OrpcFlags.ORPCF_NULL && orpcthat.flags != OrpcFlags.ORPCF_LOCAL &&
            orpcthat.flags != OrpcFlags.ORPCF_RESERVED1 && orpcthat.flags != OrpcFlags.ORPCF_RESERVED2
            && orpcthat.flags != OrpcFlags.ORPCF_RESERVED3 && orpcthat.flags != OrpcFlags.ORPCF_RESERVED4) {
            throw new Error("Invalid OrpcThat Flag" + orpcthat.flags);
        }

        let orpcextentarray = new Struct();
        //create the orpcextent struct
        /**
         * typedef struct tagORPC_EXTENT
         * {
         *     GUID                    id;          // Extension identifier.
         *     unsigned long           size;        // Extension size.
         *     [size_is((size+7)&~7)]  byte data[]; // Extension data.
         * } ORPC_EXTENT;
         */

        let orpcextent = new Struct();
        orpcextent.addMember(new ComValue(null, types.UUID));
        orpcextent.addMember(new ComValue(null, types.INTEGER));
        orpcextent.addMember(new ComValue(new ComArray(new ComValue(null, types.BYTE), null, 1, true), types.COMARRAY));
        //create the orpcextentarray struct
        /**
         * typedef struct tagORPC_EXTENT_ARRAY
         * {
         *     unsigned long size;     // Num extents.
         *     unsigned long reserved; // Must be zero.
         *     [size_is((size+1)&~1,), unique] ORPC_EXTENT **extent; // extents
         * } ORPC_EXTENT_ARRAY;
         */

        orpcextentarray.addMember(new ComValue(null, types.INTEGER));
        orpcextentarray.addMember(new ComValue(null, types.INTEGER));
        //this is since the pointer is [unique]
        let comOrpcExtent = new ComValue(orpcextent, types.STRUCT);
        let comOrpcExtentPointer = new ComValue(new Pointer(comOrpcExtent), types.POINTER);
        let comOrpcExtentPointerArray = new ComValue(new ComArray(comOrpcExtentPointer, null, 1, true), types.COMARRAY);
        let comOrpcExtentPointerArrayPointer = new ComValue(new Pointer(comOrpcExtentPointerArray), types.POINTER);
        orpcextentarray.addMember(comOrpcExtentPointerArrayPointer);

        let map = new Map();
        let comOrpcextentarray = new ComValue(orpcextentarray, types.STRUCT);
        let comOrpcextentarrayPointer = new ComValue(new Pointer(comOrpcextentarray), types.POINTER);
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
        //int ptr = ndr.readUnsignedLong();
        if (!orpcextentarrayptr.getValue().isNull()) {
            let pointers = orpcextentarrayptr.getValue().getReferent().getMember(2).getValue().getReferent().getArrayInstance(); //Pointer[]
            for (let i = 0; i < pointers.length; i++)
            {
                if (!(pointers[i] instanceof Pointer))
                    break;
                if (pointers[i].isNull())
                    continue;

                let orpcextent2 = pointers[i].getReferent(); //Struct
                let byteArray = orpcextent2.getMember(2).getArrayInstance(); //Byte[]

                extentArrays.push(new OrpcExtentArray((orpcextent2.getMember(0)).toString(), byteArray.length, byteArray));
            }

        }

        orpcthat.setExtentArray(extentArrays);

        return orpcthat;
    }
}

//emulate static methods
OrpcThat.encode = OrpcThat.prototype.encode;
OrpcThat.decode = OrpcThat.prototype.decode;

module.exports = OrpcThat;