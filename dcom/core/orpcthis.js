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
  /**
   *
   * @param {*} casualityIdentifier
   */
  constructor(casualityIdentifier) {
    this.cid = casualityIdentifier ?
     casualityIdentifier.toString() : generateUUID();
    this.flags = 0;
    this.arry = null;
    this.version = new System().getComVersion();
  }

  /**
   *
   * @param {Number} flags
   */
  setORPCFlags(flags) {
    this.flags = flags;
  }

  /**
   * @return {Number}
   */
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
   * @return {OrpcExtentArray[]}
   */
  getExtentArray() {
    return this.arry;
  }

  /**
   * @return {String}
   */
  getCasualityIdentifier() {
    return this.cid;
  }

  /**
   *
   * @param {NetworkDataRepresentation} ndr
   */
  encode(ndr) {
    ndr.writeUnsignedShort(this.version.getMajorVersion()); // COM Major version
    ndr.writeUnsignedShort(this.version.getMinorVersion()); // COM minor version
    ndr.writeUnsignedLong(this.flags); // No Flags
    ndr.writeUnsignedLong(0); // Reserved ...always 0.

    let cid2 = cidForCallback || this.cid;
    let uuid = new UUID(cid2);
    uuid.encode(ndr, ndr.getBuffer());

    if (this.arry && this.arry.length != 0) {
      ndr.writeUnsignedLong(this.arry.length);
      ndr.writeUnsignedLong(0);
      for (const arryy of this.arry) {
        uuid = new UUID(arryy.getGUID());
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


    let extentArrays = [];
    // now read whether extend array exists or not
    if (!orpcextentarrayptr.isNull()) {
      let pointers =
        orpcextentarrayptr.getReferent().getMember(2).getReferent().getArrayInstance();
      for (let i = 0; i < pointers.length; i++) {
        if (pointers[i].isNull())
          continue;

        let orpcextent2 = pointers[i].getReferent();
        let byteArray = orpcextent2.getMember(2).getArrayInstance();

        extentArrays.push(new OrpcExtentArray(
            orpcextent2.getMember(0).toString(), byteArray.length, byteArray));
      }
    }

}

// emulate static methods
OrpcThis.decode = OrpcThis.prototype.decode;

module.exports = OrpcThis;