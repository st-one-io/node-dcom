//@ts-check

const types = require('./types');
const ComArray = require('./comarray');
const ComObject = require('./comobject');
const ComString = require('./string');
const Pointer = require('./pointer');
const Struct = require('./struct');
const Union = require('./union');
const Variant = require('./variant');
const UUID = require('../rpc/core/uuid');

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

        // We may want to indicate just the type, so skip check if no object
        if (this._obj === null || this._obj === undefined) return;

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
                if (typeof obj !== 'number') throw new Error(`Value of type ${this._type} must be a number`);
                break;
            case types.BOOLEAN:
                if (typeof obj !== 'boolean') throw new Error("Value of type BOOLEAN must be a boolean");
                break;
            case types.STRING:
                if (typeof obj !== 'string') throw new Error("Value of type STRING must be a string");
                break;
            case types.DATE:
                if (!(obj instanceof Date)) throw new Error("Value of type DATE must be instance of Date");
                break;
            case types.CURRENCY:
                //TODO
                break;
            case types.UUID:
                if (!(obj instanceof UUID)) throw new Error("Value of type UUID must be instance of UUID");
                break;
            case types.CHARACTER:
                break;
            case types.VARIANTBODY:
                break;
            case types.VARIANT:
                if (!(obj instanceof Variant)) throw new Error("Value of type VARIANT must be instance of Variant");
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
            case types.POINTER:
                if (!(obj instanceof Pointer)) throw new Error("Value of type POINTER must be instance of Pointer");
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
            default:
                throw new Error(`Unrecognized type ${this._type}`);
        }
    }

    get value(){
        return this.value;
    }

    get type(){
        return this._type;
    }

    toString() {
        return `ComValue:[${types.descr[this._type]} : ${this._obj}]`;
    }
}

module.exports = ComValue;