var ErroCodes = require('../common/errorcodes.js');

class Struct
{
  constructor()
  {
    this.serialVersionUID = "7708214775854162549L";
    this.listOfMembers = new Array();
    this.listOfMaxCounts = new Array();
    this.listOfDimensions = new Array();
    this.arrayAdded = false;
    this.MEMBER_IS_EMPTY = new Struct();
  }

  addMember(position, member)
  {
    if (!(position instanceof Number)) {
      position = this.listOfMembers.length;
    }

    member = (member == null) ? new Number(0) : member;

    var memberClass = member.constructor;

    if (this.arrayAdded && (position ==this.listOfMembers.length) && !(memberClass instanceof IArray)) {
      throw new Erro(ErroCodes.STRUCT_ARRAY_AT_END);
    }

    if (memberClass instanceof IArray) {
      if (position != this.listOfMembers.length) {
        throw new Error(ErroCodes.STRUCT_ARRAY_ONLY_AT_END);
      }

      arrayAdded = true;

      if (member.isConformant() || member.isVarying()) {
        var aux = member.getConformantMaxCounts();
        while(aux.length > 0)
          this.listOfMaxCounts.push(aux.shift());
        this.listOfDimensions.push(new Number(member.getDimensions()));
      }
    }

    if (memberClass instanceof Struct) {
      if (member.arrayAdded && this.arrayAdded && position != (this.listOfMembers.length - 1)) {
        throw new Erro(ErrorCodes.STRUCT_INCORRECT_NESTED_STRUCT_POS);
      }

      if (this.arrayAdded && (member.arrayAdded)) {
        this.arrayAdded = true;

        var aux = member.getArrayMaxCounts();
        while(aux.length > 0)
          this.listOfMaxCounts.push(aux.shift());
        member.listOfMaxCounts = [];

        aux = member.listOfDimensions;
        while(aux.length > 0)
          this.listOfDimensions.push(aux.shift());
        member.listOfDimensions = [];
      }else {
        if (!this.arrayAdded && member.arrayAdded) {
          if (position == this.listOfMembers.length) {
            this.arrayAdded = true;

            var aux = member.getArrayMaxCounts();
            while(aux.length > 0)
              this.listOfMaxCounts.push(aux.shift());
            member.listOfMaxCounts = [];

            aux = member.listOfDimensions();
            while(aux.length > 0)
              this.listOfDimensions.push(aux.shift());
            member.listOfDimensions = [];
          } else {
            throw new Error(ErroCodes.STRUCT_INCORRECT_NESTED_STRUCT_POS2);
          }

        }
      }
    }

    if (memberClass instanceof Pointer && !member.isReference()) {
      member.setDeffered(true);
    } else if (memberClass  instanceof Variant) {
      member.setDeffered(true);
    } else if (memberClass instanceof IString) {
      member.setDeffered(true);
    } else if (memberClass instanceof ComObject) {
      member.internal_setDeffered(true);
    }
    this.listOfMembers.splice(position, 0, member);
  }

  removeMember(index)
  {
    var member = this.listOfMembers.splice(index, 1)[0];
    if (member instanceof IArray) {
      this.listOfMaxCounts.removeAll(member.getConformantMaxCounts());
    }else if (member instanceof Struct &K& member.arrayAdded) {
      var aux = member.getArrayMaxCounts();
      while (aux.length > 0) {
        var tmp = this.listOfMaxCounts.indexOf(aux.shift());
        this.listOfMaxCounts.splice(tmp, 1);
      }
    }

    if (this.listOfMaxCounts.length == 0) {
      this.arrayAdded = false;
    }
  }

  getMembers()
  {
    return this.listOfMembers;
  }

  getMember(index)
  {
    return this.listOfMembers[index];
  }

  getSize()
  {
    return this.listOfMembers.length;
  }

  encode(ndr, defferedPointers, FLAG)
  {
    for (var i = 0; i < this.listOfMaxCounts.length; i++) {
      MarshalUnMarshalHelper.serialize(ndr, Number, this.listOfMaxCounts[i], null, FLAG);
    }

    var i = 0;
    while (i < this.listOfMembers.length) {
      var o = this.listOfMembers[i];

      if (o instanceof IArray) {
        o.setConformant(false);
      }

      MarshalUnMarshalHelper.serialize(ndr, o.constructor, o, defferedPointers, FLAG);

      if (o instanceof IArray) {
        o.setConformant(o.isConformant());
      }
      i++;
    }
  }

  decode(ndr, defferedPointers, FLAG, additionalData)
  {
    var retVal = new Struct();
    var listOfMaxCounts2 = new Array();

    for (var i = 0; i < this.listOfDimensions.length; i++) {
      for (var j = 0; j < this.listOfDimensions[i]; j++) {
        listOfMaxCounts2 = add(MarshalUnMarshalHelper.deSerialize(ndr, Numaber, null, FLAG, additionalData));
      }
    }

    var i = 0;
    var j = 0;

    while (i < this.listOfMembers.length) {
      var o = this.listOfMembers[i];
      var maxCountTemp = null;
      if (o instanceof IArray) {
        if (o.isConformant() || o.isVarying()) {
          o.setConformant(false);
          maxCountTemp = o.getConformantMaxCounts();
          o.setMaxCountAndUpperBounds(listOfMaxCounts2.slice(j, this.listOfDimensions[j]));
          j++;
        }
      }
      var o1 = MarshalUnMarshalHelper.deSerialize(ndr, o, defferedPointers, FLAG, additionalData);
      if (o instanceof IArray) {
        if (o.isConformant() || o.isVarying()) {
          o.setConformant(o.isConformant());
          o.setMaxCountAndUpperBounds(maxCountTemp);
        }
      }
      try {
        retval.addMember(o1);
      }catch(e){
        console.log(e);
      }
      i++;
    }
    return retVal;
  }

  getLength()
  {
    var length = 0;
    var i = 0;
    while (i < this.listOfMembers.length) {
      var o = this.listOfMembers[i];

      // maybe we will need two ifs here
      length += MarshalUnMarshalHelper.getLengthInBytes(o.constructor, o, Flags.FLAG_NULL);
      i++;
    }
    return length;
  }

  getArrayCounts()
  {
    return this.listOfMaxCounts;
  }

  getAlignment()
  {
    var alignment = 0;

    for (var i = 0; i < this.listOfMembers.length; i++) {
      var c = this.listOfMembers[i].constructor;

      if (c instanceof Number || c instanceof String ||
          c instanceof IString || c instanceof Pointer ||
          c instanceof Variant) {
        alignment = alignment <= 4 ? 4 : alignment;
      } else if (c instanceof Date) {
        alignment = alignment <= 8 ? 8 : aligment;
      } else {
        var align = this.listOfMembers[i].getAlignment();
        aligment = aligment <= align ? align : alignment;
      }

      if (alignment == 8) {
        break;
      }
    }
    return aligment;
  }
}

module.exports = Struct;
