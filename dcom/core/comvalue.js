//@ts-check

let types;
let ComArray;
let ComObject;
let ComString;
let Currency;
let Pointer;
let Struct;
let Union;
let Variant;
let UUID;
let initted = false;

/**
 * Stores a value and it's related COM type
 */
class ComValue {

    /**
     * 
     * @param {*} obj 
     * @param {number} type 
     */
    constructor(obj, type){
        this._obj = obj;
        this._type = type;

        this._init();
        // We may want to indicate just the type, so skip check if no object
        if (this._obj === null || this._obj === undefined) return;

        // if the obj is an array, get a sample to use as current obj instance so we can check the class
        if (obj instanceof Array) {
            if (obj[0] instanceof ComValue)
                obj = obj[0].getValue();
            else
                obj = obj[0];
        }
        
        // some safety checks, preventing errors downstream
        switch (this._type) {
            case types.DOUBLE:
            case types.SHORT:
            case types.INTEGER:
            case types.FLOAT:
            case types.LONG:
            case types.BYTE:
            case types.UNSIGNEDBYTE:
            case types.UNSIGNEDINTEGER:
            case types.UNSIGNEDSHORT:
                if (typeof obj != 'number') throw new Error(`Value of type ${this._type} must be a number`);
                break;
            case types.BOOLEAN:
                if (typeof obj != 'boolean') throw new Error("Value of type BOOLEAN must be a boolean");
                break;
            case types.STRING:
                if (typeof obj != 'string') throw new Error("Value of type STRING must be a string");
                break;
            case types.DATE:
                if (!(obj instanceof Date)) throw new Error("Value of type DATE must be instance of Date");
                break;
            case types.CURRENCY:
                if (!(obj instanceof Currency)) throw new Error("Value of type CURRENCY must be instance of Currency");
                break;
            case types.UUID:
                if (!(obj instanceof UUID)) throw new Error("Value of type UUID must be instance of UUID");
                break;
            case types.CHARACTER:
                break;
            case types.VARIANTBODY:
                if (!(obj instanceof Variant.VariantBody)) throw new Error("Value of type VARIANTBODY must be instance of VariantBody");
                break;
            case types.VARIANT:
                if (!(obj instanceof Variant.Variant)) throw new Error("Value of type VARIANT must be instance of Variant");
                break;
            case types.COMARRAY:
                if (!(obj instanceof ComArray)) throw new Error("Value of type COMARRAY must be instance of ComArray");
                break;
            case types.COMOBJECT:
                if (!(obj instanceof ComObject)) throw new Error("Value of type COMOBJECT must be instance of ComObject");
                break;
            case types.INTERFACEPOINTER:
                //if (!(obj instanceof ComArray)) throw new Error("Value of type INTERFACEPOINTER must be instance of ComArray");
                break;
            case types.INTERFACEPOINTERBODY:
                //if (!(obj instanceof ComArray)) throw new Error("Value of type INTERFACEPOINTERBODY must be instance of ComArray");
                break;
            case types.DISPATCH:
                //if (!(obj instanceof ComArray)) throw new Error("Value of type DISPATCH must be instance of ComArray");
                break;
            case types.STRUCT:
                if (!(obj instanceof Struct)) throw new Error("Value of type STRUCT must be instance of Struct");
                break;
            case types.UNION:
                if (!(obj instanceof Union)) throw new Error("Value of type UNION must be instance of Union");
                break;
            case types.COMSTRING:
                if (!(obj instanceof ComString)) throw new Error("Value of type COMSTRING must be instance of ComString");
                break;
            case types.DUALSTRINGARRAY:
                //if (!(obj instanceof ComArray)) throw new Error("Value of type DUALSTRINGARRAY must be instance of ComArray");
                break;
            case types.POINTER:
                // there is a circular dependency between Pointer and ComValue, this achieves the same thing but withou breaking it with instanceof
                if (!(obj instanceof Pointer)) throw new Error("Value of type POINTER must be instance of Pointer");
                break;
            case types.EMPTY:
                break;
            case types.NULL:
                break;
            case types.SCODE:
                break;
            default:
                throw new Error(`Unrecognized type ${this._type}`);
        }
    }

    getValue(){
        return this._obj;
    }

    getType(){
        return this._type;
    }

    toString() {
        return `ComValue:[${types.descr[this._type]} : ${this._obj}]`;
    }
    _init() {
        if (initted) return;

        types = require('./types');
        ComArray = require('./comarray');
        ComObject = require('./comobjcimpl');
        ComString = require('./string');
        Currency = require('./currency');
        Pointer = require('./pointer.js');
        Struct = require('./struct');
        Union = require('./union');
        Variant = require('./variant');
        UUID = require('../rpc/core/uuid');

        initted = true;
    }
}

module.exports = ComValue;