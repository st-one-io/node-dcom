//@ts-check
const ErrorCodes = require('../common/errorcodes.js');
const MarshalUnMarshalHelper = require('./marshalunmarshalhelper');
const ComArray = require('./comarray');
const ComObject = require('./comobject');
const Variant = require('./variant');
const ComString = require('./string');
const Pointer = require('./pointer');
const Flags = require('./flags');
const NetworkDataRepresentation = require('../ndr/networkdatarepresentation');

const types = require('./types');
const ComValue = require('./comvalue');

class Struct {

  constructor() {
    
    /**@type {ComValue[]} */
    this.listOfMembers = new Array();
    /**@type {number[]} */
    this.listOfMaxCounts = new Array();
    /**@type {number[]} */
    this.listOfDimensions = new Array();
    this.arrayAdded = false;
    this.MEMBER_IS_EMPTY = Struct.MEMBER_IS_EMPTY;
  }

  /**
   * 
   * @param {ComValue} value
   * @param {number} [position]
   */
  addMember(value, position) {
    if (position === undefined){
      position = this.listOfMembers.length;
    }

    value = value || new ComValue(0, types.INTEGER);
    let member = value.value;

    //An array has already been added , now a new member cannot be added
    if (this.arrayAdded && (position == this.listOfMembers.length) && !(member instanceof ComArray)) {
      throw new Error("STRUCT_ARRAY_AT_END" + ErrorCodes.STRUCT_ARRAY_AT_END);
    }

    //arrays can only be the last element of this struct.
    if (member instanceof ComArray) {
      if (position != this.listOfMembers.length) {
        throw new Error("STRUCT_ARRAY_ONLY_AT_END" + ErrorCodes.STRUCT_ARRAY_ONLY_AT_END);
      }

      this.arrayAdded = true;

      if (member.isConformant() || member.isVarying()) {
        this.listOfMaxCounts.push(...member.getConformantMaxCounts());
        this.listOfDimensions.push(member.getDimensions());
      }
    }

    //struct part of another struct
    if (member instanceof Struct) {

      if (member.arrayAdded && this.arrayAdded && position != (this.listOfMembers.length - 1)) {
        throw new Error("STRUCT_INCORRECT_NESTED_STRUCT_POS" + ErrorCodes.STRUCT_INCORRECT_NESTED_STRUCT_POS);
      }

      if (this.arrayAdded && member.arrayAdded) {

        //means that we have to move the maxcount of the internal struct to this struct.
        this.arrayAdded = true;

        this.listOfMaxCounts.push(...member.getArrayMaxCounts());
        member.listOfMaxCounts.length = 0; //clear

        this.listOfDimensions.push(...member.listOfDimensions);
        member.listOfDimensions.length = 0; //clear

      } else {

        if (!this.arrayAdded && member.arrayAdded) {
          if (position == this.listOfMembers.length) {

            //means that we have to move the maxcount of the internal struct to this struct.
            this.arrayAdded = true;

            this.listOfMaxCounts.push(...member.getArrayMaxCounts());
            member.listOfMaxCounts.length = 0; //clear

            this.listOfDimensions.push(...member.listOfDimensions);
            member.listOfDimensions.length = 0; //clear
          } else {
            throw new Error("STRUCT_INCORRECT_NESTED_STRUCT_POS2" + ErrorCodes.STRUCT_INCORRECT_NESTED_STRUCT_POS2);
          }

        }
      }
    }

    if (member instanceof Pointer && !member.isReference()) {
      member.setDeffered(true);
    } else if (member instanceof Variant) {
      member.setDeffered(true);
    } else if (member instanceof ComString) {
      member.setDeffered(true);
    } else if (member instanceof ComObject) {
      member.internal_setDeffered(true);
    }
    this.listOfMembers.splice(position, 0, value);
  }

  removeMember(index) {
    var member = this.listOfMembers.splice(index, 1)[0].value;

    if (member instanceof ComArray) {
      let counts = member.getConformantMaxCounts();
      this.listOfMaxCounts = this.listOfMaxCounts.filter(elm => !counts.includes(elm));
    
    } else if (member instanceof Struct && member.arrayAdded) {
      let counts = member.getArrayMaxCounts();
      this.listOfMaxCounts = this.listOfMaxCounts.filter(elm => !counts.includes(elm));
    }

    if (this.listOfMaxCounts.length == 0) {
      this.arrayAdded = false;
    }
  }

  /**
   * @returns {ComValue[]}
   */
  getMembers() {
    return this.listOfMembers;
  }

  /**
   * 
   * @param {number} index 
   * @returns {ComValue}
   */
  getMember(index) {
    return this.listOfMembers[index];
  }

  /**
   * @returns {number}
   */
  getSize() {
    return this.listOfMembers.length;
  }

  /**
   * 
   * @param {NetworkDataRepresentation} ndr 
   * @param {Pointer[]} defferedPointers 
   * @param {number} flag
   */
  encode(ndr, defferedPointers, flag) {
    for (const elm of this.listOfMaxCounts) {
      MarshalUnMarshalHelper.serialize(ndr, new ComValue(elm, types.INTEGER), null, flag);
    }
    
    let i = 0;
    while (i < this.listOfMembers.length) {
      let o = this.listOfMembers[i];

      if (o.value instanceof ComArray) {
        o.value.setConformant(false);
      }

      MarshalUnMarshalHelper.serialize(ndr, o, defferedPointers, flag);

      if (o.value instanceof ComArray) {
        o.value.setConformant(o.value.isConformant());
      }
      i++;
    }
  }

  /**
   * 
   * @param {NetworkDataRepresentation} ndr 
   * @param {Pointer[]} defferedPointers 
   * @param {number} flag 
   * @param {Map} additionalData 
   */
  decode(ndr, defferedPointers, flag, additionalData) {
    var retVal = new Struct();
    var listOfMaxCounts2 = new Array();

    for (let i = 0; i < this.listOfDimensions.length; i++) {
      for (let j = 0; j < this.listOfDimensions[i]; j++) {
        listOfMaxCounts2.push(MarshalUnMarshalHelper.deSerialize(ndr, new ComValue(null, types.INTEGER), null, flag, additionalData));
      }
    }

    let i = 0;
    let j = 0;

    while (i < this.listOfMembers.length) {
      let value = this.listOfMembers[i]
      let o = value.value;
      let maxCountTemp = null;
      if (o instanceof ComArray) {
        if (o.isConformant() || o.isVarying()) {
          o.setConformant(false);
          maxCountTemp = o.getConformantMaxCounts();
          o.setMaxCountAndUpperBounds(listOfMaxCounts2.slice(j, this.listOfDimensions[j]));
          j++;
        }
      }
      var o1 = MarshalUnMarshalHelper.deSerialize(ndr, value, defferedPointers, flag, additionalData);
      if (o instanceof ComArray) {
        if (o.isConformant() || o.isVarying()) {
          o.setConformant(o.isConformant());
          o.setMaxCountAndUpperBounds(maxCountTemp);
        }
      }
      retVal.addMember(o1);
      i++;
    }
    return retVal;
  }

  getLength() {
    let length = 0;
    for (const member of this.listOfMembers) {
      length += MarshalUnMarshalHelper.getLengthInBytes(member, Flags.FLAG_NULL);
    }
    return length;
  }

  getArrayMaxCounts() {
    return this.listOfMaxCounts.slice();
  }

  getAlignment() {
    let alignment = 0;

    for (const member of this.listOfMembers) {
      switch (member.type){
        case types.SHORT:
        case types.UNSIGNEDSHORT:
          alignment = Math.max(alignment, 2);
          break;
        case types.INTEGER:
        case types.FLOAT:
        case types.STRING:
        case types.COMSTRING:
        case types.POINTER:
        case types.UNSIGNEDINTEGER:
        case types.VARIANT:
          alignment = Math.max(alignment, 4);
          break;
        case types.DOUBLE:
        case types.DATE:
        case types.LONG:
          alignment = Math.max(alignment, 8);
          break;
        case types.STRUCT:
        case types.UNION:
          alignment = Math.max(alignment, member.value.getAlignment());
      }
      if (alignment == 8) break;
    }

    return alignment;
  }
}

Struct.MEMBER_IS_EMPTY = new Struct();

module.exports = Struct;
