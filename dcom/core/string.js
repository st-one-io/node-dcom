//@ts-check
let MarshalUnMarshalHelper;
let Variant;
let Pointer;
let Flags;
let ErrorCodes;
let NetworkDataRepresentation;

let types;
let ComValue;
let inited = false;

class ComString {

    /**
     * 
     * @param {string|number} [str]
     * @param {number} [type]
	 * @see Flags.FLAG_REPRESENTATION_STRING_BSTR
	 * @see Flags.FLAG_REPRESENTATION_STRING_LPCTSTR
	 * @see Flags.FLAG_REPRESENTATION_STRING_LPWSTR
     */
    constructor(str, type) {
        this._init();
        this.variant = null;
        this.variantByRef = null;
        this.member = null;
        this.type = Flags.FLAG_NULL;

        if (typeof str == 'number') {
            type = str;
            str = null;
        }

        if (str === null || str === undefined) {
            if (type == Flags.FLAG_REPRESENTATION_STRING_LPCTSTR || type == Flags.FLAG_REPRESENTATION_STRING_LPWSTR) {
                this.member = new ComValue(new Pointer(new ComValue(null, types.STRING), true), types.POINTER);
            } else if (type == Flags.FLAG_REPRESENTATION_STRING_BSTR) {
                this.member = new ComValue(new Pointer(new ComValue(null, types.STRING), false), types.POINTER);
            } else {
                throw new Error("UTIL_FLAG_ERROR" + new ErrorCodes().UTIL_FLAG_ERROR);
            }
            this.type = type;

        } else {
            if (type === null || type === undefined) {
                type = Flags.FLAG_REPRESENTATION_STRING_BSTR;
            }

            str = str || "";
            this.type = type;
            if (type == Flags.FLAG_REPRESENTATION_STRING_LPCTSTR || type == Flags.FLAG_REPRESENTATION_STRING_LPWSTR) {
                this.member = new ComValue(new Pointer(new ComValue(str, types.STRING), true), types.POINTER);
            } else if (type == Flags.FLAG_REPRESENTATION_STRING_BSTR) {
                this.member = new ComValue(new Pointer(new ComValue(str, types.STRING), false), types.POINTER);
                this.member.getValue().setReferent(0x72657355);//"User" in LEndian.
                let thisComValue = new ComValue(this, types.COMSTRING);
                this.variant = new Variant.Variant(thisComValue);
                this.variantByRef = new Variant.Variant(thisComValue, true);
            } else {
                throw new Error(new ErrorCodes().UTIL_FLAG_ERROR);
            }

            this.member.getValue().setFlags(type | Flags.FLAG_REPRESENTATION_VALID_STRING);

        }

        this.member.getValue().setFlags(this.type | Flags.FLAG_REPRESENTATION_VALID_STRING);
    }

    _init() {
        if (inited) return;
        MarshalUnMarshalHelper = require('./marshalunmarshalhelper.js');
        Variant = require('./variant');
        Pointer = require('./pointer');
        Flags = require('./flags');
        ErrorCodes = require('../common/errorcodes');
        NetworkDataRepresentation = require('../ndr/networkdatarepresentation');

        types = require('./types');
        ComValue = require('./comvalue');
        inited = true;
    }

	/** String encapsulated by this object. The encoding scheme for <code>LPWSTR</code> and <code>BSTR</code> strings is "UTF-16LE".
	 *
	 *
	 * @return
	 */
    getString() {
        return this.member.getValue().getReferent();
    }

	/** Type representing this object.
	 *
	 * @return {Number}
	 */
    getType() {
        return this.type;
    }


    /**
     * 
     * @param {NetworkDataRepresentation} ndr
     * @param {Pointer[]} defferedPointers 
     * @param {number} flag
     */
    encode(ndr, defferedPointers, flag) {
        MarshalUnMarshalHelper.serialize(ndr, new ComValue(this.member.getValue(), types.POINTER), defferedPointers, this.type | flag);
    }

    /**
     *
     * @param {NetworkDataRepresentation} ndr
     * @param {Pointer[]} defferedPointers
     * @param {number} flag
     * @param {Map} additionalData
     */
    decode(ndr, defferedPointers, flag, additionalData) {
        let newString = new ComString(this.type);
        newString.member = MarshalUnMarshalHelper.deSerialize(ndr, new ComValue(this.member.getValue(), types.POINTER), defferedPointers, this.type | flag, additionalData);
        return new ComValue(newString, types.COMSTRING);
    }

    /**
     * 
     * @param {boolean} deffered 
     */
    setDeffered(deffered) {
        /*
        //this condition is required so that only BSTRs are deffered and also since this member could be deffered and
        //setting it to true would spoil the logic
        * this is incorrect logic in the bug sent by Kevin , the ONEVENTSTRUCT consists of LPWSTRs which are deffered
        */
        if (this.member && !this.member.getValue().isReference()) {
            this.member.getValue().setDeffered(true);
        }
    }

    toString() {
        return this.member == null ? "[null]" : `[Type: ${this.type} , ${this.member.toString()}]`;
    }
}

module.exports = ComString;