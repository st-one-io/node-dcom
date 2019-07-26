//@ts-check
const Flags = require('./flags');
const Encdec = require('../ndr/encdec');
const ErrorCodes = require('../common/errorcodes');
const UUID = require('../rpc/core/uuid');

const Pointer = require('./pointer');
const ComArray = require('./comarray');
const ComObject = require('./comobject');
const ComObjectImpl = require('./comobjcimpl');
const ComString = require('./string.js');
const CallBuilder = require('./callbuilder');
const NetworkDataRepresentation = require('../ndr/networkdatarepresentation');
const InterfacePointer = require('./interfacepointer');
const InterfacePointerBody = require('./interfacepointerbody');
const Union = {};
const Variant = {};
const VariantBody = {};

const types = require('./types');
const ComValue = require('./comvalue');

/**
 * 
 * @param {NetworkDataRepresentation} ndr
 * @param {number} length 
 */
function readOctetArrayLE(ndr, length)
{
    let bytes = [...Buffer.alloc(8)];
    ndr.readOctetArray(bytes, 0, 8);
    for (let i = 0; i < 4; i++)
    {
        let t = bytes[i];
        bytes[i] = bytes[7 - i];
        bytes[7 - i] = t;
    }
    return Buffer.from(bytes);
}

/**
 * 
 * @param {NetworkDataRepresentation} ndr
 * @param {Buffer} b 
 */
function writeOctetArrayLE(ndr, b)
{
    for (let i = 0; i < b.length; i++)
    {
        ndr.writeUnsignedSmall(b[b.length - i - 1]);
    }
}

/**
 * 
 * @param {NetworkDataRepresentation} ndr
 * @param {ComValue} val
 * @param {Pointer[]} defferedPointers
 * @param {number} flag 
 */
function serialize(ndr, val, defferedPointers, flag) {
    let c = val.getType();
    let value = val.getValue();

    if (value instanceof ComArray) {
        value.encode(ndr, value.getArrayInstance(), defferedPointers, flag);
    } else {
        if ((c != types.COMOBJECT || c != types.DISPATCH) && value instanceof ComObject) {
            c = types.COMOBJECT;
        }

        alignMemberWhileEncoding(ndr, c, value);

        switch (c){
            case types.COMSTRING:
            case types.POINTER:
            case types.STRUCT:
            case types.UNION:
            case types.INTERFACEPOINTER:
            case types.VARIANT:
            case types.VARIANTBODY:
                value.encode(ndr, defferedPointers, flag);
                break;

            case types.DATE:
                ndr.getBuffer().align(8);
                Encdec.enc_doublele(convertMillisecondsToWindowsTime(value.getTime()), ndr.getBuffer().getBuffer(), ndr.getBuffer().getIndex());
                ndr.getBuffer().advance(8);
                break;

            //case types.CURRENCY:
            //    break;

            case types.BOOLEAN:
                if ((flag & Flags.FLAG_REPRESENTATION_VARIANT_BOOL) == Flags.FLAG_REPRESENTATION_VARIANT_BOOL) {
                    ndr.writeUnsignedShort(value ? 0xFFFF : 0x0000);
                } else {
                    ndr.writeBoolean(value);
                }
                break;

            case types.UNSIGNEDSHORT:
            case types.SHORT:
                ndr.writeUnsignedShort(value);
                break;

            case types.UNSIGNEDINTEGER:
            case types.INTEGER:
                ndr.writeUnsignedLong(value);
                break;
                
            case types.FLOAT:
                if (value === null || value === undefined) {
                    value = Number.NaN;
                }
                ndr.getBuffer().align(4);
                Encdec.enc_floatle(value, ndr.getBuffer().getBuffer(), ndr.getBuffer().getIndex());
                ndr.getBuffer().advance(4);
                break;

            case types.STRING:
                if ((flag & Flags.FLAG_REPRESENTATION_VALID_STRING) != Flags.FLAG_REPRESENTATION_VALID_STRING) {
                    throw new Error("UTIL_STRING_INVALID" + ErrorCodes.UTIL_STRING_INVALID);
                }

                let str = value && value.toString() || "";

                //BSTR encoding
                if ((flag & Flags.FLAG_REPRESENTATION_STRING_BSTR) == Flags.FLAG_REPRESENTATION_STRING_BSTR) {
                    let strBytes = null; //byte[]
                    try {
                        strBytes = Buffer.from(str, "utf16le");
                    } catch (e) {
                        throw new Error("UTIL_STRING_DECODE_CHARSET" + ErrorCodes.UTIL_STRING_DECODE_CHARSET);
                    }
                    //NDR representation Max count , then offset, then, actual count
                    //length of String (Maximum count)
                    ndr.writeUnsignedLong(strBytes.length / 2);
                    //last index of String (length in bytes)
                    ndr.writeUnsignedLong(strBytes.length);
                    //length of String Again !! (Actual count)
                    ndr.writeUnsignedLong(strBytes.length / 2);
                    //write an array of unsigned shorts
                    let i = 0;
                    while (i < strBytes.length) {
                        //ndr.writeUnsignedShort(str.charAt(i));
                        ndr.writeUnsignedSmall(strBytes[i]);
                        i++;
                    }

                    //Normal String
                } else if ((flag & Flags.FLAG_REPRESENTATION_STRING_LPCTSTR) == Flags.FLAG_REPRESENTATION_STRING_LPCTSTR) {
                    // the String is written as types.SHORT so length is strlen/2+1
                    let strlen = Math.round(str.length / 2);

                    ndr.writeUnsignedLong(strlen + 1);
                    ndr.writeUnsignedLong(0);
                    ndr.writeUnsignedLong(strlen + 1);
                    if (str.length != 0) {
                        ndr.writeCharacterArray(str.toCharArray(), 0, str.length);
                        //odd length
                        if (str.length % 2 != 0) {
                            //add a 0
                            ndr.writeUnsignedSmall(0);
                        }
                    }

                    //null termination
                    ndr.writeUnsignedShort(0);
                }
                else if ((flag & Flags.FLAG_REPRESENTATION_STRING_LPWSTR) == Flags.FLAG_REPRESENTATION_STRING_LPWSTR) {

                    let strBytes = null; //byte[]
                    try {
                        strBytes = Buffer.from(str, "utf16le");
                    } catch (e) {
                        throw new Error("UTIL_STRING_DECODE_CHARSET" + ErrorCodes.UTIL_STRING_DECODE_CHARSET);
                    }

                    //bytes + 1
                    ndr.writeUnsignedLong(strBytes.length / 2 + 1);
                    ndr.writeUnsignedLong(0);
                    ndr.writeUnsignedLong(strBytes.length / 2 + 1);
                    //write an array of unsigned shorts
                    let i = 0;
                    while (i < strBytes.length) {
                        //ndr.writeUnsignedShort(str.charAt(i));
                        ndr.writeUnsignedSmall(strBytes[i]);
                        i++;
                    }

                    //null termination
                    ndr.writeUnsignedShort(0);
                }
                break;

            case types.UUID:
                value.encode(ndr, ndr.getBuffer());
                break;

            case types.UNSIGNEDBYTE:
            case types.BYTE:
                ndr.writeUnsignedSmall(value);
                break;

            case types.DOUBLE:
                if (value === null || value === undefined) {
                    value = Number.NaN;
                }

                ndr.getBuffer().align(8);
                Encdec.enc_doublele(value, ndr.getBuffer().getBuffer(), ndr.getBuffer().getIndex());
                ndr.getBuffer().advance(8);
                break;

            case types.LONG:
                if (value === null || value === undefined) {
                    value = Number.NaN;
                }
                ndr.getBuffer().align(8);
                Encdec.enc_uint64le(value, ndr.getBuffer().getBuffer(), ndr.getBuffer().getIndex());
                ndr.getBuffer().advance(8);
                break;

            case types.CHARACTER:
                ndr.writeUnsignedSmall(value.charCodeAt(0));
                break;

            case types.INTERFACEPOINTERBODY:
                value.encode(ndr, flag);
                break;

            case types.DISPATCH:
            case types.COMOBJECT:
                let ptr = value.internal_getInterfacePointer(); //InterfacePointer
                serialize(ndr, new ComValue(ptr, types.INTERFACEPOINTER), defferedPointers, flag);

                if (ptr.isCustomObjRef()) {
                    //ask the session now for its marshaller unmarshaller and that should write the object down into the InterfacePointer.
                    //Where we are right now is where our object needs to be written.

                    //TODO we have just written a "reserved" member (before we write the body), it has been observed in WMIO that this reserved member 
                    //is the total length of the block, if this is so then the Custom Marshaller for WMIO should overwrite this with the full length.

                    //First write the custom marshaller unmarshaller CLSID. Then the object definition.
                    let index = ndr.getBuffer().getIndex();
                    value.getCustomObject().encode(ndr, defferedPointers, flag);
                    let currentIndex = ndr.getBuffer().getIndex();
                    let totalLength = (currentIndex - index) + 48;
                    ndr.getBuffer().setIndex(ndr.getBuffer().getIndex() - totalLength - 8);
                    ndr.writeUnsignedLong(totalLength + 4);
                    ndr.writeUnsignedLong(totalLength + 4);
                    ndr.getBuffer().setIndex(currentIndex);
                }
                break;

            default:
                throw new Error("UTIL_SERDESER_NOT_FOUND" + ErrorCodes.UTIL_SERDESER_NOT_FOUND + c);
        }
    }
}

/**
 * 
 * @param {NetworkDataRepresentation} ndr
 * @param {number} c 
 * @param {object} obj 
 */
function alignMemberWhileEncoding(ndr, c, obj)
{
    let index = ndr.getBuffer().getIndex();
    let align;

    switch (c) {
        case types.STRUCT:
        case types.UNION:
            //Custom alignment
            align = obj.getAlignment();
            break;
        case types.INTEGER:
        case types.FLOAT:
        case types.VARIANT:
        case types.STRING:
        case types.POINTER:
            align = 4
            break;
        case types.DOUBLE:
            align = 8
            break;
        case types.SHORT:
            align = 2
            break;
        default:
            //don't to any alignment, let it undefined
    }

    if (align !== undefined) {
        let i = Math.round(index % align)
        i = (i == 0) ? 0 : align - i;
        ndr.writeOctetArray([...Buffer.alloc(i)], 0, i);
    }
}

/**
 * 
 * @param {NetworkDataRepresentation} ndr
 * @param {number} c 
 * @param {object} obj 
 */
function alignMemberWhileDecoding(ndr, c, obj)
{
    let index = ndr.getBuffer().getIndex();
    let align;

    switch (c) {
        case types.STRUCT:
        case types.UNION:
            //Custom alignment
            align = obj.getAlignment();
            break;
        case types.INTEGER:
        case types.FLOAT:
        case types.VARIANT:
        case types.STRING:
        case types.POINTER:
            align = 4
            break;
        case types.DOUBLE:
            align = 8
            break;
        case types.SHORT:
            align = 2
            break;
        default:
            //don't to any alignment, let it undefined
    }

    if (align !== undefined) {
        let i = Math.round(index % align)
        i = (i == 0) ? 0 : align - i;
        ndr.readOctetArray([...Buffer.alloc(i)], 0, i);
    }
}

/**
 * 
 * @param {NetworkDataRepresentation} ndr
 * @param {ComValue} val 
 * @param {Pointer[]} defferedPointers 
 * @param {number} flag 
 * @param {Map} additionalData 
 */
function deSerialize(ndr, val, defferedPointers, flag, additionalData)
{
    let c = val.getType();
    let obj = val.getValue();
    if (obj instanceof ComArray) {
        return obj.decode(ndr, obj.getArrayClass(), obj.getDimensions(), defferedPointers, flag, additionalData);
    } else {

        alignMemberWhileDecoding(ndr, c, obj);

        switch (c) {
            case types.COMSTRING:
                return (!obj) ? new ComString().decode(ndr, defferedPointers, flag, additionalData) : obj.decode(ndr, defferedPointers, flag, additionalData);
            case types.POINTER:
                return (!obj) ? new Pointer().decode(ndr, defferedPointers, flag, additionalData) : obj.decode(ndr, defferedPointers, flag, additionalData);
            case types.STRUCT:
                return (!obj) ? new Struct().decode(ndr, defferedPointers, flag, additionalData) : obj.decode(ndr, defferedPointers, flag, additionalData);
            case types.UNION:
                return (!obj) ? new Union().decode(ndr, defferedPointers, flag, additionalData) : obj.decode(ndr, defferedPointers, flag, additionalData);
            case types.INTERFACEPOINTER:
                return (!obj) ? new InterfacePointer().decode(ndr, defferedPointers, flag, additionalData) : obj.decode(ndr, defferedPointers, flag, additionalData);
            case types.VARIANT:
                return (!obj) ? new Variant().decode(ndr, defferedPointers, flag, additionalData) : obj.decode(ndr, defferedPointers, flag, additionalData);
            case types.VARIANTBODY:
                return (!obj) ? new VariantBody().decode(ndr, defferedPointers, flag, additionalData) : obj.decode(ndr, defferedPointers, flag, additionalData);
            case types.DATE:
                ndr.getBuffer().align(8);
                let date = new Date(convertWindowsTimeToMilliseconds(Encdec.dec_doublele(ndr.getBuffer().getBuffer(), ndr.getBuffer().getIndex())));
                ndr.getBuffer().advance(8);
                return date;

            //case types.CURRENCY:
            //    break;

            case types.BOOLEAN:
                if ((flag & Flags.FLAG_REPRESENTATION_VARIANT_BOOL) == Flags.FLAG_REPRESENTATION_VARIANT_BOOL) {
                    let s = ndr.readUnsignedShort();
                    return (s != 0);
                } else {
                    return ndr.readBoolean();
                }

            case types.UNSIGNEDSHORT: //TODO we may need different behavior for unsigned here
            case types.SHORT:
                return ndr.readUnsignedShort();

            case types.UNSIGNEDINTEGER: //TODO we may need different behavior for unsigned here
            case types.INTEGER:
                return ndr.readUnsignedLong();

            case types.FLOAT:
                ndr.getBuffer().align(4);
                let float = Encdec.dec_floatle(ndr.getBuffer().getBuffer(), ndr.getBuffer().getIndex());
                ndr.getBuffer().advance(4);

                return float;

            case types.STRING:
                if ((flag & Flags.FLAG_REPRESENTATION_VALID_STRING) != Flags.FLAG_REPRESENTATION_VALID_STRING) {
                    throw new Error("UTIL_STRING_INVALID" + ErrorCodes.UTIL_STRING_INVALID);
                }

                let retString = null;

                //BSTR Decoding
                if ((flag & Flags.FLAG_REPRESENTATION_STRING_BSTR) == Flags.FLAG_REPRESENTATION_STRING_BSTR) {
                    //Read for user
                    ndr.readUnsignedLong();//eating max length
                    ndr.readUnsignedLong();//eating length in bytes
                    let actuallength = ndr.readUnsignedLong() * 2;
                    let buffer = Buffer.alloc(actuallength);
                    let i = 0;
                    while (i < actuallength) {
                        buffer[i] = ndr.readUnsignedSmall();
                        i++;
                    }

                    retString = buffer.toString('utf16le');

                    //Normal String
                } else if ((flag & Flags.FLAG_REPRESENTATION_STRING_LPCTSTR) == Flags.FLAG_REPRESENTATION_STRING_LPCTSTR) {
                    let actuallength = ndr.readUnsignedLong(); //max length
                    if (actuallength == 0) {
                        return "";
                    }

                    ndr.readUnsignedLong();//eating offset
                    ndr.readUnsignedLong();//eating actuallength again
                    //now read array.
                    let ret = new Array(actuallength * 2 - 2);
                    //read including the unsigned short (null chars)
                    ndr.readCharacterArray(ret, 0, actuallength * 2 - 2);
                    retString = Buffer.from(ret).toString('utf8');
                    if (ret[ret.length - 1] == '\0') {
                        retString = retString.substr(0, retString.length - 1);
                    }

                    ndr.readUnsignedShort();
                } else if ((flag & Flags.FLAG_REPRESENTATION_STRING_LPWSTR) == Flags.FLAG_REPRESENTATION_STRING_LPWSTR) {

                    let maxlength = ndr.readUnsignedLong();
                    if (maxlength == 0) {
                        return "";
                    }
                    ndr.readUnsignedLong();//eating offset
                    let actuallength = ndr.readUnsignedLong() * 2;
                    let buffer = Buffer.alloc(actuallength - 2);
                    let i = 0;
                    //last 2 bytes , null termination will be eaten outside the loop
                    while (i < actuallength - 2) {
                        buffer[i] = ndr.readUnsignedSmall();
                        i++;
                    }
                    if (actuallength != 0) {
                        ndr.readUnsignedShort();
                    }

                    retString = buffer.toString('utf16le');
                }

                return retString;

            case types.UUID:
                let uuid = new UUID();
                uuid.decode(ndr, ndr.getBuffer());
                return uuid;

            case types.UNSIGNEDBYTE: //TODO we may need different behavior for unsigned here
            case types.BYTE:
                return ndr.readUnsignedSmall();

            case types.DOUBLE:
                ndr.getBuffer().align(8);
                let double = Encdec.dec_doublele(ndr.getBuffer().getBuffer(), ndr.getBuffer().getIndex());
                ndr.getBuffer().advance(8);
                return double;

            case types.LONG:
                ndr.getBuffer().align(8);
                let long = Encdec.dec_uint64le(ndr.getBuffer().getBuffer(), ndr.getBuffer().getIndex());
                ndr.getBuffer().advance(8);
                return long;

            case types.CHARACTER:
                return String.fromCharCode(ndr.readUnsignedSmall());

            case types.INTERFACEPOINTERBODY:
                return InterfacePointerBody.decode(ndr, flag);

            case types.DISPATCH:
            case types.COMOBJECT:
                let session = additionalData.get(CallBuilder.CURRENTSESSION); //Session
                let ptr = deSerialize(ndr, new ComValue(null, types.INTERFACEPOINTER), defferedPointers, flag, additionalData);
                let comObject = new ComObjectImpl(session, ptr);
                if (ptr && ((Flags.FLAG_REPRESENTATION_ARRAY & flag) != Flags.FLAG_REPRESENTATION_ARRAY) && ptr.isCustomObjRef()) {
                    //now we need to ask the session for its marshaller unmarshaller based on the CLSID 
                    comObject.setCustomObject(session.getCustomMarshallerUnMarshallerTemplate(ptr.getCustomCLSID()).decode(comObject, ndr, defferedPointers, flag, additionalData));
                }
                additionalData.get(CallBuilder.COMOBJECTS).add(comObject);
                return comObject;

            case types.DUALSTRINGARRAY:
                return DualStringArray.decode(ndr);

            default:
                throw new Error("UTIL_SERDESER_NOT_FOUND" + ErrorCodes.UTIL_SERDESER_NOT_FOUND + c);
        }
    }

}

/**
 * 
 * @param {ComValue} val
 * @param {number} flag 
 */
function getLengthInBytes(val, flag)
{
    let c = val.getType();
    let obj = val.getValue();

    if (obj instanceof ComArray) {
        return obj.getSizeOfAllElementsInBytes();
    } else {
        if ((c != types.COMOBJECT || c != types.DISPATCH) && obj instanceof ComObject) {
            c = types.COMOBJECT;
        }

        let length;

        switch (c){
            case types.CURRENCY:
                throw new Error("Not yet implemented");

            case types.VARIANTBODY:
                return obj.getLengthInBytes();
                
            case types.VARIANT:
                return obj.getLengthInBytes(flag);
                
            case types.BOOLEAN:
                if ((flag & Flags.FLAG_REPRESENTATION_VARIANT_BOOL) == Flags.FLAG_REPRESENTATION_VARIANT_BOOL) {
                    return 2;
                } else {
                    return 1;
                }

            case types.STRING: 

                length = 4 + 4 + 4; //max len, offset ,actual length

                if (!((flag & Flags.FLAG_REPRESENTATION_STRING_BSTR) == Flags.FLAG_REPRESENTATION_STRING_BSTR)) {
                    length = length + 2; //adding null termination
                }

                let strLen = (obj || "").length;

                if ((flag & Flags.FLAG_REPRESENTATION_STRING_LPCTSTR) == Flags.FLAG_REPRESENTATION_STRING_LPCTSTR) {
                    length = length + strLen; //this is only a character array, no unicode, each char is writen in 1 byte "abcd" --> ab, cd ,00 ; "abcde" --> ab,cd,e0, 00
                    if (!(strLen % 2 == 0)) { //odd
                        length++;
                    }
                } else {
                    length = length + (strLen * 2); //these are both unicode (utf-16le)
                }

                return length;

            case types.DISPATCH:
            case types.COMOBJECT:
                return obj.internal_getInterfacePointer().getLength();

            case types.POINTER:
            case types.DUALSTRINGARRAY:
            case types.STRUCT:
            case types.UNION:
            case types.INTERFACEPOINTER:
            case types.INTERFACEPOINTERBODY:
                return obj.getLength();

            case types.COMSTRING:
                length = 4;

                if (!obj.getString()) {
                    return length;
                }

                //for LPWSTR and BSTR adding 2 for the null character.
                length = length + (obj.getType() == Flags.FLAG_REPRESENTATION_STRING_LPCTSTR ? 0 : 2);
                //Pointer referentId --> USER
                return length + getLengthInBytes(new ComValue(obj.getString(), types.STRING), obj.getType() | flag);

            case types.CHARACTER:
            case types.BYTE:
            case types.UNSIGNEDBYTE:
                return 1;

            case types.SHORT:
            case types.UNSIGNEDSHORT:
                return 2;

            case types.INTEGER:
            case types.UNSIGNEDINTEGER:
            case types.FLOAT:
                return 4;

            case types.DATE:
            case types.DOUBLE:
            case types.LONG:
                return 8;

            case types.UUID:
                return 16;

            default:
                throw new Error("UTIL_SERDESER_NOT_FOUND" + ErrorCodes.UTIL_SERDESER_NOT_FOUND + c);
        }
    }

}

// ----------------
// private helper classes


const DT_DAYS_1899_1970 = 25569;
const MS_IN_ONE_DAY = 86400000;

/**FROM JACAOB 1.10. www.danadler.com.
* Convert a COM time from functions Date(), Time(), Now() to a
* Java time (milliseconds). Visual Basic time values are based to
* 30.12.1899, Java time values are based to 1.1.1970 (= 0
* milliseconds). The difference is added to the Visual Basic value to
* get the corresponding Java value. The Visual Basic double value
* reads: <day count delta since 30.12.1899>.<1 day percentage
* fraction>, e.g. "38100.6453" means: 38100 days since 30.12.1899 plus
* (24 hours * 0.6453). Example usage:
* <code>Date javaDate = new Date(toMilliseconds (vbDate));</code>.
*
* @param {number} comTime COM time.
* @return Java time.
*/
function convertWindowsTimeToMilliseconds(comTime) {
    let result;

    // code from jacobgen:
    comTime = comTime - DT_DAYS_1899_1970;
    //TODO test this and check for needed offsets
    //result = Math.round(86400000 * comTime) - cal.get(Calendar.ZONE_OFFSET);
    result = Math.round(MS_IN_ONE_DAY * comTime);
    //cal.setTime(new Date(result));
    //result -= cal.get(Calendar.DST_OFFSET);

    return result;
}


/**FROM JACAOB 1.10. www.danadler.com.
 * Convert a Java time to a COM time.
 *
 * @param {number} milliseconds Java time.
 * @return COM time.
 */
function convertMillisecondsToWindowsTime(milliseconds) {
    let result;

    // code from jacobgen:
    //Calendar cal = Calendar.getInstance();
    //cal.setTimeInMillis(milliseconds);
    //milliseconds += (cal.get(Calendar.ZONE_OFFSET) + cal
    //    .get(Calendar.DST_OFFSET)); // add GMT offset
    result = (milliseconds / MS_IN_ONE_DAY) + DT_DAYS_1899_1970;

    return result;
}//convertMillisecondsToWindowsTime()


module.exports = {
    readOctetArrayLE,
    writeOctetArrayLE,
    serialize,
    deSerialize,
    alignMemberWhileEncoding,
    alignMemberWhileDecoding,
    getLengthInBytes
}