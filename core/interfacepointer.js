//@ts-check

const Pointer = require('./pointer');
const Flags = require('./flags');
const InterfacePointerBody = require('./interfacepointerbody');
const MarshalUnMarshalHelper = require('./marshalunmarshalhelper');
const NetworkDataRepresentation = require('../ndr/networkdatarepresentation');
const DualStringArray = require('./dualstringarray');

const types = require('./types');
const ComValue = require('./comvalue');

const OBJREF_SIGNATURE = [0x4d, 0x45, 0x4f, 0x57];  // 'MEOW'
const OBJREF_STANDARD = 0x1;  // standard marshaled objref
const OBJREF_HANDLER = 0x2;  // handler marshaled objref
const OBJREF_CUSTOM = 0x4;  // custom marshaled objref

// Flag values for a STDOBJREF (standard part of an OBJREF).
// SORF_OXRES1 - SORF_OXRES8 are reserved for the object exporters
// use only, object importers must ignore them and must not enforce MBZ.
const SORF_OXRES1 = 0x1;  // reserved for exporter
const SORF_OXRES2 = 0x20; // reserved for exporter
const SORF_OXRES3 = 0x40; // reserved for exporter
const SORF_OXRES4 = 0x80; // reserved for exporter
const SORF_OXRES5 = 0x100;// reserved for exporter
const SORF_OXRES6 = 0x200;// reserved for exporter
const SORF_OXRES7 = 0x400;// reserved for exporter
const SORF_OXRES8 = 0x800;// reserved for exporter
const SORF_NULL = 0x0;   // convenient for initializing SORF
const SORF_NOPING = 0x1000;// Pinging is not required

class InterfacePointer {

    /**
     * 
     * @param {string} [iid]
     * @param {number|InterfacePointerBody} [port]
     * @param {*} [objref]
     */
    constructor(iid, port, objref){
        /** @type {Pointer} */
        this.member = null;
        if (iid !== null && iid !== undefined){
            this.member = new Pointer(new ComValue(new InterfacePointerBody(iid, port, objref), types.INTERFACEPOINTERBODY), false);
        }
    }

    /**
     * @returns {boolean}
     */
    isCustomObjRef() {
        return this.member.getReferent().value.isCustomObjRef();
    }

    /**
     * @returns {string}
     */
    getCustomCLSID() {
        return this.member.getReferent().value.getCustomCLSID();
    }

    /**
     * 
     * @param {boolean} deffered 
     */
    setDeffered(deffered) {
        this.member.setDeffered(true);
    }

    /**
     * 
     * @param {NetworkDataRepresentation} ndr
     * @param {Pointer[]} defferedPointers 
     * @param {number} flag
     * @param {Map} additionalData 
     */
    decode(ndr, defferedPointers, flag, additionalData) {
        let ptr = new InterfacePointer();
        if ((flag & Flags.FLAG_REPRESENTATION_INTERFACEPTR_DECODE2) == Flags.FLAG_REPRESENTATION_INTERFACEPTR_DECODE2) {
            let iBodyPtr = new ComValue(new Pointer(new ComValue(null, types.INTERFACEPOINTERBODY), true), types.POINTER);
            ptr.member = MarshalUnMarshalHelper.deSerialize(ndr, iBodyPtr, defferedPointers, flag, additionalData);
        } else {
            let iBodyPtr = new ComValue(new Pointer(new ComValue(null, types.INTERFACEPOINTERBODY)), types.POINTER);
            ptr.member = MarshalUnMarshalHelper.deSerialize(ndr, iBodyPtr, defferedPointers, flag, additionalData);
        }
        //the pointer is null, no point of it's wrapper being present, so return null from here as well
        if (ptr.member.isNull()) {
            ptr = null;
        }
        return ptr;
    }

    getObjectType() {
        return this.member.getReferent().value.getObjectType();
    }

    /**
     * @param {number} objectType
     * @return
     */
    getObjectReference(objectType) {
        return this.member.getReferent().value.getObjectReference(objectType);
    }

    /**
     * @returns {string}
     */
    getIID() {
        return this.member.getReferent().value.getIID();
    }

    /**
     * @returns {string}
     */
    getIPID() {
        return this.member.getReferent().value.getIPID();
    }

    /**
     * @returns {number[]}
     */
    getOID() {
        return this.member.getReferent().value.getObjectReference(InterfacePointer.OBJREF_STANDARD).getObjectId();
    }

    /**
     * @returns {number[]}
     */
    getOXID() {
        return this.member.getReferent().value.getObjectReference(InterfacePointer.OBJREF_STANDARD).getOxid();
    }

    /**
     * @returns {DualStringArray}
     */
    getStringBindings() {
        return this.member.getReferent().value.getStringBindings();
    }

    /**
     * @returns {number}
     */
    getLength() {
        return this.member.getReferent().value.getLength();
    }

    /**
     * 
     * @param {NetworkDataRepresentation} ndr
     * @param {Pointer[]} defferedPointers 
     * @param {number} flag
     */
    encode(ndr, defferedPointers, flag) {

        if ((flag & Flags.FLAG_REPRESENTATION_SET_JIINTERFACEPTR_NULL_FOR_VARIANT) == Flags.FLAG_REPRESENTATION_SET_JIINTERFACEPTR_NULL_FOR_VARIANT) {
            //just encode a null.
            MarshalUnMarshalHelper.serialize(ndr, new ComValue(0, types.INTEGER), defferedPointers, flag);
            return;
        }
        MarshalUnMarshalHelper.serialize(ndr, new ComValue(this.member, types.POINTER), defferedPointers, flag);
    }

    toString() {
        return `JIInterfacePointer[IID: ${this.getIID()} , ObjRef: ${this.getObjectReference(InterfacePointer.OBJREF_STANDARD)}]`;
    }

    /**
     * 
     * @param {InterfacePointer} src
     * @param {InterfacePointer} target
     */
    isOxidEqual(src, target) {
        if (!src || !target) {
            return false;
        }

        let srcOxid = src.getOXID();
        let tgtOxid = src.getOXID();

        return srcOxid.length === tgtOxid.length
            && srcOxid.every((e, i) => e == tgtOxid[i]);
    }

}

// export constants
InterfacePointer.OBJREF_SIGNATURE = OBJREF_SIGNATURE;
InterfacePointer.OBJREF_STANDARD = OBJREF_STANDARD;
InterfacePointer.OBJREF_HANDLER = OBJREF_HANDLER;
InterfacePointer.OBJREF_CUSTOM = OBJREF_CUSTOM;
InterfacePointer.SORF_OXRES1 = SORF_OXRES1;
InterfacePointer.SORF_OXRES2 = SORF_OXRES2;
InterfacePointer.SORF_OXRES3 = SORF_OXRES3;
InterfacePointer.SORF_OXRES4 = SORF_OXRES4;
InterfacePointer.SORF_OXRES5 = SORF_OXRES5;
InterfacePointer.SORF_OXRES6 = SORF_OXRES6;
InterfacePointer.SORF_OXRES7 = SORF_OXRES7;
InterfacePointer.SORF_OXRES8 = SORF_OXRES8;
InterfacePointer.SORF_NULL = SORF_NULL;
InterfacePointer.SORF_NOPING = SORF_NOPING;

// emulate "static" members
InterfacePointer.decode = InterfacePointer.prototype.decode;

module.exports = InterfacePointer;
