let ErrorCodes;
let System;
let HashMap;
let Flags;
let ComString;
let ComArray;
let ComObject;
let ComObjectImpl;
let types;
let ComValue;
let MarshalUnMarshalHelper;
let Pointer;
let Struct;
let inited;
let InterfacePointer;

const EMPTY = {};
const NULL = {};
const SCODE = {};

class Variant {

  /**
   * 
   * @param {ComValue} [value]
   * @param {boolean} [isByRef]
   */
  constructor(value, isByref, FLAG)
  {
    this._init();
    
    this.EMPTY = {};
    this.EMPTY_BYREF = this.EMPTY; // TO-DO; maybe it should be Variant
    this.NULL = {};
    this.OPTIONAL_PARAM = {};
    this.SCODE = SCODE;
    this.member = null;

    this.serialVersionUUID = "5101290038004040628L;"
    this.VT_NULL 			   = 0x00000001;
  	this.VT_EMPTY 			 = 0x00000000;
  	this.VT_I4 				   = 0x00000003;
  	this.VT_UI1				   = 0x00000011;
  	this.VT_I2 				   = 0x00000002;
  	this.VT_R4 				   = 0x00000004;
  	this.VT_R8 				   = 0x00000005;
  	this.VT_VARIANT			 = 0x0000000c;
  	this.VT_BOOL 			   = 0x0000000b;
  	this.VT_ERROR 			 = 0x0000000a;
  	this.VT_CY 				   = 0x00000006;
  	this.VT_DATE 			   = 0x00000007;
  	this.VT_BSTR 			   = 0x00000008;
  	this.VT_UNKNOWN 		 = 0x0000000d;
  	this.VT_DECIMAL 		 = 0x0000000e;
  	this.VT_DISPATCH 		 = 0x00000009;
  	this.VT_ARRAY			   = 0x00002000;
  	this.VT_BYREF  			 = 0x00004000;
  	this.VT_BYREF_VT_UI1 = this.VT_BYREF|this.VT_UI1;//0x00004011;
  	this.VT_BYREF_VT_I2  = this.VT_BYREF|this.VT_I2;//0x00004002;
  	this.VT_BYREF_VT_I4  = this.VT_BYREF|this.VT_I4;//0x00004003;
  	this.VT_BYREF_VT_R4  = this.VT_BYREF|this.VT_R4;//0x00004004;
  	this.VT_BYREF_VT_R8  = this.VT_BYREF|this.VT_R8;//0x00004005;
  	this.VT_BYREF_VT_BOOL 	  = this.VT_BYREF|this.VT_BOOL;//0x0000400b;
  	this.VT_BYREF_VT_ERROR 	  = this.VT_BYREF|this.VT_ERROR;//0x0000400a;
  	this.VT_BYREF_VT_CY 	 	  = this.VT_BYREF|this.VT_CY;//0x00004006;
  	this.VT_BYREF_VT_DATE 	  = this.VT_BYREF|this.VT_DATE;//0x00004007;
  	this.VT_BYREF_VT_BSTR 	  = this.VT_BYREF|this.VT_BSTR;//0x00004008;
  	this.VT_BYREF_VT_UNKNOWN  = this.VT_BYREF|this.VT_UNKNOWN;//0x0000400d;
  	this.VT_BYREF_VT_DISPATCH = this.VT_BYREF|this.VT_DISPATCH;//0x00004009;
  	this.VT_BYREF_VT_ARRAY 	  = this.VT_BYREF|this.VT_ARRAY;//0x00006000;
  	this.VT_BYREF_VT_VARIANT  = this.VT_BYREF|this.VT_VARIANT;//0x0000400c;

  	this.VT_I1 				 = 0x00000010;
  	this.VT_UI2 			 = 0x00000012;
  	this.VT_UI4 			 = 0x00000013;
  	this.VT_I8				 = 0x00000014;
  	this.VT_INT 			 = 0x00000016;
    this.VT_UINT 			 = 0x00000017;
    this.VT_BYREF_VT_DECIMAL  = this.VT_BYREF|this.VT_DECIMAL;//0x0000400e;
  	this.VT_BYREF_VT_I1  	 	  = this.VT_BYREF|this.VT_I1;//0x00004010;
  	this.VT_BYREF_VT_UI2 	 = this.VT_BYREF|this.VT_UI2;//0x00004012;
  	this.VT_BYREF_VT_UI4 	 = this.VT_BYREF|this.VT_UI4;//0x00004013;
  	this.VT_BYREF_VT_I8		 = this.VT_BYREF|this.VT_I8;//0x00004014;
  	this.VT_BYREF_VT_INT 	 = this.VT_BYREF|this.VT_INT;//0x00004016;
  	this.VT_BYREF_VT_UINT  = this.VT_BYREF|this.VT_UINT;//0x00004017;

  	this.FADF_AUTO       = 0x0001;  /* array is allocated on the stack */
  	this.FADF_STATIC     = 0x0002;  /* array is staticly allocated */
  	this.FADF_EMBEDDED   = 0x0004;  /* array is embedded in a structure */
  	this.FADF_FIXEDSIZE  = 0x0010;  /* may not be resized or reallocated */
  	this.FADF_RECORD     = 0x0020;  /* an array of records */
  	this.FADF_HAVEIID    = 0x0040;  /* with FADF_DISPATCH, FADF_UNKNOWN */
  	                                        /* array has an IID for interfaces */
  	this.FADF_HAVEVARTYPE = 0x0080;  /* array has a VT type */
  	this.FADF_BSTR        = 0x0100;  /* an array of BSTRs */
  	this.FADF_UNKNOWN     = 0x0200;  /* an array of IUnknown* */
  	this.FADF_DISPATCH    = 0x0400;  /* an array of IDispatch* */
  	this.FADF_VARIANT     = 0x0800;  /* an array of VARIANTs */
    this.FADF_RESERVED    = 0xF008; /* reserved bits */

    // array types
    this.VT_BOOL_ARRAY = this.VT_ARRAY | this.VT_BOOL;
    this.VT_BSTR_ARRAY = this.VT_ARRAY | this.VT_BSTR;
    this.VT_DECIMAL_ARRAY = this.VT_ARRAY | this.VT_DECIMAL;
    this.VT_ERROR_ARRAY = this.VT_ARRAY | this.VT_ERROR;
    this.VT_I1_ARRAY = this.VT_ARRAY | this.VT_I1;
    this.VT_I2_ARRAY = this.VT_ARRAY | this.VT_I2;
    this.VT_I4_ARRAY = this.VT_ARRAY | this.VT_I4;
    this.VT_R4_ARRAY = this.VT_ARRAY | this.VT_R4;
    this.VT_R8_ARRAY = this.VT_ARRAY | this.VT_R8;
    this.VT_UI1_ARRAY = this.VT_ARRAY | this.VT_UI1;
    this.VT_UI2_ARRAY = this.VT_ARRAY | this.VT_UI2;
    this.VT_UI4_ARRAY = this.VT_ARRAY | this.VT_UI4;
    this.VT_UINT_ARRAY = this.VT_ARRAY | this.VT_UINT;
    this.VT_UNKNOWN_ARRAY = this.VT_ARRAY | this.VT_UNKNOWN;
    this.VT_VARIANT_ARRAY = this.VT_ARRAY | this.VT_VARIANT;

    this.supportedTypes = new HashMap();
    this.supportedTypes_classes = new HashMap();
    this.outTypeMap = new HashMap();

    // populate those hashes
    this.outTypeMap.set(Number, new Number(0));
    this.outTypeMap.set(Boolean, false);
    this.outTypeMap.set(String, "");
    // TO-DO: find a way to do this.outTypeMap.set(Currency, new Currency("0.0"));
    this.outTypeMap.set(Date, new Date());

    // TO-DO: evaluate the necessity of unsigned byte, short, and integer (all Number here)
    // TO-DO: same for long, which would require an external module since no suport in JS

    this.supportedTypes.set(Object, this.VT_VARIANT);
    this.supportedTypes.set(types.VARIANT, this.VT_VARIANT);
    this.supportedTypes.set(types.BOOLEAN, this.VT_BOOL);
    this.supportedTypes.set(types.COMSTRING, this.VT_BSTR);
    this.supportedTypes.set(types.EMPTY, this.VT_EMPTY);
    this.supportedTypes.set(types.SCODE, this.VT_ERROR);
    this.supportedTypes.set(types.NULL, this.VT_NULL);
    this.supportedTypes.set(types.ARRAY, this.VT_ARRAY);
    this.supportedTypes.set(types.DATE, this.VT_DATE);
    this.supportedTypes.set(types.INTEGER, this.VT_I4);
    this.supportedTypes.set(types.FLOAT, this.VT_R4);
    this.supportedTypes.set(types.DOUBLE, this.VT_R8);
    this.supportedTypes.set(types.SHORT, this.VT_I2);
    this.supportedTypes.set(types.BYTE, this.VT_I1);
    this.supportedTypes.set(types.CHARACTER, this.VT_I1);
    this.supportedTypes.set(types.COMARRAY, this.VT_ARRAY);
    this.supportedTypes.set(types.LONG, this.VT_I8);
    this.supportedTypes.set(types.CURRENCY, this.VT_CY);
    this.supportedTypes.set(types.UNSIGNEDSHORT, this.VT_UI1);
    this.supportedTypes.set(types.UNSIGNEDINTEGER, this.VT_UI2);
    this.supportedTypes.set(types.UNSIGNEDLONG, this.VT_UI4);
    // TO-DO: find a way to dothis.supportedTypes(Currency, new Number(this.VT_CY));

    // TO-DO: evaluate what should be done with the missing types
    // and if it will impact on the lib when interacting with a COM server
    this.supportedTypes_classes.set(new Number(this.VT_DATE), new ComValue(null, types.DATE));
    // TO-DO: find a way to do this.supportedTypes_classes.set(new Number(this.VT_CY), Currency); properly
    this.supportedTypes_classes.set(new Number(this.VT_CY), new ComValue(null, types.CURRENCY));
    this.supportedTypes_classes.set(new Number(this.VT_VARIANT), new ComValue(null, types.VARIANT));
    this.supportedTypes_classes.set(new Number(this.VT_I4), new ComValue(null, types.LONG));
    this.supportedTypes_classes.set(new Number(this.VT_INT), new ComValue(null, types.INTEGER));
    this.supportedTypes_classes.set(new Number(this.VT_R4), new ComValue(null, types.FLOAT));
    this.supportedTypes_classes.set(new Number(this.VT_BOOL), new ComValue(null, types.BOOLEAN));
    this.supportedTypes_classes.set(new Number(this.VT_I2), new ComValue(null, types.SHORT));
    this.supportedTypes_classes.set(new Number(this.VT_I1), new ComValue(null, types.BYTE));
    this.supportedTypes_classes.set(new Number(this.VT_BSTR), new ComValue(null, types.COMSTRING));
    this.supportedTypes_classes.set(new Number(this.VT_ERROR), SCODE);
    this.supportedTypes_classes.set(new Number(this.VT_EMPTY), EMPTY);
    this.supportedTypes_classes.set(new Number(this.VT_NULL), NULL);
    this.supportedTypes_classes.set(new Number(this.VT_ARRAY), new ComValue(null, types.ARRAY));
    this.supportedTypes_classes.set(new Number(this.VT_UNKNOWN), new ComValue(null, types.COMOBJECT));
    this.supportedTypes_classes.set(new Number(this.VT_DISPATCH), new ComValue(null, types.COMOBJECT));
    this.supportedTypes_classes.set(new Number(this.VT_UI1),new ComValue(null, types.UNSIGNEDBYTE));
    this.supportedTypes_classes.set(new Number(this.VT_UI2),new ComValue(null, types.UNSIGNEDSHORT));
    this.supportedTypes_classes.set(new Number(this.VT_UI4),new ComValue(null, types.UNSIGNEDINTEGER));
    this.supportedTypes_classes.set(new Number(this.VT_I8), new ComValue(null, types.INTEGER));
    this.supportedTypes_classes.set(new Number(this.VT_R8), new ComValue(null, types.DOUBLE));
    this.supportedTypes_classes.set(new Number(this.VT_BOOL_ARRAY), new ComValue(types.VT_ARRAY));
    this.supportedTypes_classes.set(new Number(this.VT_BSTR_ARRAY), new ComValue(types.VT_ARRAY));
    this.supportedTypes_classes.set(new Number(this.VT_DECIMAL_ARRAY), new ComValue(types.VT_ARRAY));
    this.supportedTypes_classes.set(new Number(this.VT_ERROR_ARRAY), new ComValue(types.VT_ARRAY));
    this.supportedTypes_classes.set(new Number(this.VT_I1_ARRAY), new ComValue(types.VT_ARRAY));
    this.supportedTypes_classes.set(new Number(this.VT_I2_ARRAY), new ComValue(types.VT_ARRAY));
    this.supportedTypes_classes.set(new Number(this.VT_I4_ARRAY), new ComValue(types.VT_ARRAY));
    this.supportedTypes_classes.set(new Number(this.VT_R4_ARRAY), new ComValue(types.VT_ARRAY));
    this.supportedTypes_classes.set(new Number(this.VT_R8_ARRAY), new ComValue(types.VT_ARRAY));
    this.supportedTypes_classes.set(new Number(this.VT_U1_ARRAY), new ComValue(types.VT_ARRAY));
    this.supportedTypes_classes.set(new Number(this.VT_U2_ARRAY), new ComValue(types.VT_ARRAY));
    this.supportedTypes_classes.set(new Number(this.VT_U4_ARRAY), new ComValue(types.VT_ARRAY));
    this.supportedTypes_classes.set(new Number(this.VT_UINT_ARRAY), new ComValue(types.VT_ARRAY));
    this.supportedTypes_classes.set(new Number(this.VT_UNKNOWN_ARRAY), new ComValue(types.VT_ARRAY));
    this.supportedTypes_classes.set(new Number(this.VT_VARIANT_ARRAY), new ComValue(types.VT_ARRAY));

    // init Arrays
    this.arryInits = new Array();
    this.arryInits.push(types.COMSTRING);
    this.arryInits.push(types.POINTER);
    this.arryInits.push(types.COMOBJECT);
    // TO-DO: if IDispatch support is desired: this.arryInits.push(Dispatch);
    // this.arryInits.push(Unknown);

    if (value) {
      switch(value.getType()){
        case types.INTEGER:
        case types.FLOAT:
        case types.LONG:
        case types.DOUBLE:
        case types.SHORT:
          this.init(value, isByref? isByref : false);
        case types.BOOLEAN:
          this.init(value, isByref? isByref : false);
        case types.CHARACTER:
          this.init(value, isByref? isByref : false);
        case types.STRING:
          this.init(value, isByref? isByref : false);
        case types.COMSTRING:
          this.init(value, isByref? isByref : false);
        case types.COMOBJECT:
          this.init(value, isByref? isByref : false);
          // TO-DO: if IDispatch com is desired it must be implemented here to set the correct flag
        case types.DATE:
          this.init(value, isByref? isByref : false);
        case types.CURRENCY:
          this.init(value, isByref? isByref : false);
        case types.COMARRAY:
          this.initArrays(value, isByref? isByref : false, FLAG? FLAG : Flags.FLAG_NULL);
      }
    }
  }

  _init(){
    if (inited) return;
    ErrorCodes = require('../common/errorcodes.js');
    System = require('../common/system.js');
    HashMap = require('hashmap');
    Flags = require('./flags.js');
    ComString = require('./string');
    ComArray = require('./comarray');
    ComObject = require('./comobject');
    ComObjectImpl = require('./comobjcimpl');
    types = require('./types');
    ComValue = require('./comvalue');
    MarshalUnMarshalHelper = require('./marshalunmarshalhelper');
    Pointer = require('./pointer');
    Struct = require('./struct');
    InterfacePointer = require('./interfacepointer');
    inited = true;
  }

  OUTPARAMforType(c, isArray)
  {
    var variant = null;
    if (!isArray) {
      variant = this.makeVariant(outTypeMap.get(c), true);

      if (c instanceof ComObject) {
        return this.OUT_UNKNOWN();
      } else if (c instanceof Variant) {
        return this.EMPTY_BYREF();
      } else if (c instanceof String) {
        return new Variant("", true);
      }
    } else {
      var oo = this.outTypeMap.get(c);
      if (oo != null) {
        var x = new Array(1);
        x[0] = oo;
        variant = new Variant(new ComArray(x, true), true);
      }

      if (c instanceof ComObject) {
        var arry = [new ComObjectImpl(null, new InterfacePointer(null, -1, null))];
        variant = new Variant(new ComArray(arry, true), true);
        variant.setFlag(FLags.FLAG_REPRESENTATION_UNKNOWN_NULL_FOR_OUT |
          Flags.FLAG_REPRESENTATION_SET_INTERFACEPTR_NULL_FOR_VARIANT);
      } else if (c instanceof Variant) {
        return VARIANTARRAY();
      } else if (c instanceof ComString || c instanceof String) {
        return BSTRARRAY();
      }
    }
    return variant;
  }

  makeVariant(o, isByref)
  {
    isByref = (isByref == undefined) ? false : isByref;

    if (o == null || o instanceof Object) {
      if (isByref) {
        return Variant.EMPTY_BYREF();
      } else {
        return Variant.EMPTY();
      }
    }

    var c  = typeof o;
    if (c instanceof Array) {
      throw new Error("Illegal Argument.");
    }

    if (c instanceof Variant) {
      return new Variant(o);
    }

    // here is the catch, on j-interop they use reflections and
    // heavly use function overloading. Since JS do not support function overloading
    // this piece of code is sipmlified. If any problem arises, remember to check
    // if the problem isnt here
    try {
      return new Variant(o, isByref);
    } catch (e){}

    return null;
  }

  getSupportedClass(type)
  {
    return this.supportedTypes_classes.get(type);
  }

  getSupportedType(c, FLAG)
  {
    var retVal = this.supportedTypes.get(c.getType());

    if (retVal == null && c == types.COMOBJECT) {
      retVal = this.VT_UNKNOWN;
    }

    if (retVal == this.VT_I4 && (FLAG & Flags.FLAG_REPRESENTATION_VT_INT) ==
      Flags.FLAG_REPRESENTATION_VT_INT) {
      retVal = this.VT_INT;
    } else if (retVal == this.VT_UI4 &&
      (FLAG & Flags.FLAG_REPRESENTATION_VT_UINT) == Flags.FLAG_REPRESENTATION_VT_UINT) {
      retVal = this.VT_UINT;
    }

    return retVal;
  }

  getSupportedTypeObj(o, defaultType)
  {
    var c = o.constructor;
    var retVal = this.supportedTypes.get(c);

    if (retVal == null && o instanceof ComObject) {
      retval = new Number(this.VT_UNKNOWN);
    }

    return retval;
  }

  EMPTY()
  {
    return new Variant(new EMPTY());
  }

  EMPTY_BYREF()
  {
    return new Variant(this.EMPTY());
  }

  OUT_UNKNOWN()
  {
    var retVal = new Variant(new ComValue(new ComObjectImpl(null, new InterfacePointer(null, -1, null)), types.COMOBJECT), true);
    retval.setFlag(Flags.FLAG_REPRESENTATION_UNKNOWN_NULL_FOR_OUT |
      Flags.FLAG_REPRESENTATION_SET_INTERFACEPTR_NULL_FOR_VARIANT);
      return retval;
  }

  OUT_DISPATCH()
  {
    var retVal = new Variant(new ComObjectImpl(null, new InterfacePointer(null, -1, null)), true);
    retVal.setFlag(Flags.FLAG_REPRESENTATION_DISPATCH_NULL_FOR_OUT |
      FLags.FLAG_REPRESENTATION_SET_INTERFACEPTR_NULL_FOR_VARIANT);
    return retval;
  }

  NULL()
  {
    return new Variant(new NULL());
  }

  OPTIONAL_PARAM()
  {
    return new Variant(Variant.SCODE, new ErrorCodes().DISP_E_PARAMNOTFOUND);
  }

  BSTRARRAY()
  {
    return new Variant(new IArray([""], true), true);
  }

  VARIANTARRAY()
  {
    return new Variant(new IArray([Variant.EMPTY()], true), true);
  }

  /**
   * 
   * @param {ComValue} obj 
   * @param {Boolean} isByref 
   */
  init(obj, isByref)
  {
    isByref = (isByref == undefined) ? false : isByref;

    if (obj != null && obj.getType() == types.ARRAY) {
      throw new Error("Ilegal Argument: " + new ErrorCodes().VARIANT_ONLY_JIARRAY_EXCEPTED);
    }

    if (obj != null && obj.getType() == types.INTERFACEPOINTER) {
      throw new Error("Ilegal Argument:" + new ErrorCodes().VARIANT_TYPE_INCORRECT);
    }

    if (obj.getType() == types.VARIANTBODY) {
      this.member = new ComValue(new Pointer(obj), types.POINTER);
    }else {
      var variantBody = new VariantBody(1, {obj, isByref});
      this.member = new ComValue(new Pointer(new ComValue(variantBody, types.VARIANTBODY)), types.POINTER);
    }
    this.member.getValue().setReferent(0x72657355);
  }

  setDeffered(deffered)
  {
    if (this.member != null && !this.member.getValue().isReference()) {
      this.member.getValue().setDeferred(deffered);
    }
  }

  setFlag(FLAG)
  {
    var variantBody = this.member.getReferent();
    variantBody.FLAG |= FLAG;
  }

  getFlag()
  {
    var variantBody = this.member.getReferent();
    return variantBody.FLAG;
  }

  isNull()
  {
    if (this.member == null) {
      return true;
    }
    var variantBody = this.member.getReferent();
    return variantBody == null ? true : variantBody.isNull();
  }

  functions(fs)
  {
    var self = {};
    fs.forEach(function(f){
      self[f.length] = f
    });
    return function(){
      self[arguments.length].apply(this, arguments);
    };
  }

  Variant(){
    this.functions([

    ]);
  }

  VariantValBool(value, isByref, errorCode){
    isByref = (isByref == undefined) ? false : isByref;
    errorCode = (errorCode == undefined) ? false: errorCode;

    if (value instanceof Number)
    {
      this.init(new Number(value), isByref);
    }
    else if (value instanceof Boolean)
    {
      this.init(new Boolean(value), isByref);
    }
    else if (value instanceof IString)
     {
      this.init(value, isByref);
    }
    else if (value instanceof String)
     {
      this.init(new IString(value), isByref);
    }
    else if (value instanceof Date)
    {
      this.init(value, isByref);
    }
    else if (value instanceof Currency)
    {
      this.init(value, isByref);
    }
    else if (value instanceof SCODE)
    {
      this.init(new VariantBody(VariantBody.SCODE, errorCode, false));
    }
    else if (value instanceof EMPTY)
    {
      this.init(null);
    }
    else if (value instanceof NULL)
    {
      this.init(new VariantBody(VariantBody.NULL));
    }
    else if (value instanceof ComObject)
    {
      this.init(value, isByref);
      this.setFlag(Flags.FLAG_REPRESENTATION_UNKNOWN_IID);
    }
  }

  VariantArray(array, isByref, FLAG)
  {
    isByref = (isByref == undefined) ? false : isByref;
    FLAG = (FLAG == undefined) ? Flags.FLAG_NULL : FLAG;
    this.initArrays(array, isByref, FLAG);
  }


  //TO-DO: this will take some time, postpone it until it is needed
  initArrays(array, isByref, FLAG)
  {
    var variant2 = null;
    var array2 = null;
    var c = NULL;
    var newArrayObj = null;
    var is2Dim = false;

    if (array == null) {
      this.init(null, false);
      return;
    }

    var dimension = 1;
    if (array.getValue().getDimensions() == 1 && (array.getValue().memberArray[0] instanceof Array)) {
      dimension = 2;
    }

    switch (array.getValue().getDimensions()) {
      case 1:
        var obj = array.getValue().getArrayInstance();
        newArrayObj = (obj.length == 0)? null : obj;
        c = (obj[0])? obj[0].getType() : 9;
        break;
      case 2:
        var obj2 = array.getValue().getArrayInstance();

        var name = typeof obj2[0][0].getType();
        var subArray = obj2;
        name = name.substring(1);

        let firstDim = subArray.length;
        subArray = subArray[0];
        let secondDim = subArray.length;

        let k = 0;
        newArrayObj = new Array(array.getNumElementsInAllDimensions());
				for (let i = 0; i < secondDim; i++)	{
					for (let j = 0;j < firstDim; j++)	{
						newArrayObj[k++] = obj2[j][i];
					}
				}

				c = subArray[0].getType();
				is2Dim = true;
        break;
      default:
          throw new Error(new ErrorCodes().JI_VARIANT_VARARRAYS_2DIMRES);
    }
    array2 = new ComArray(new ComValue(newArrayObj, c),true); //should always be conformant since this is part of a safe array.
    let safeArray = new Struct();
    try {
      safeArray.addMember(new ComValue(array.getValue().getDimensions(), types.SHORT));//dim
      let elementSize = -1;
      let flags = new Variant().FADF_HAVEVARTYPE;
      if (c == types.VARIANT) {
        flags = (flags | new Variant().FADF_VARIANT);
        elementSize = 16; //(Variant is pointer whose size is 16)
      }
      else if (this.arryInits.includes(c)) {
        if (c == types.COMSTRING) {
          flags = (flags | new Variant().FADF_BSTR);
        } else if (c == types.COMOBJECT) {
          flags = (flags | new Variant().FADF_UNKNOWN);
          FLAG |= Flags.FLAG_REPRESENTATION_USE_IUNKNOWN_IID;
        } else
          elementSize = 4; //Since all these are pointers inherently
      } else {
        //JStruct and JIUnions are expected to be encapsulated within pointers...they usually are :)
        elementSize = MarshalUnMarshalHelper.getLengthInBytes(new ComValue(null, c), null, c == types.BOOLEAN ? Flags.FLAG_REPRESENTATION_VARIANT_BOOL : Flags.FLAG_NULL); //All other types, basic types
      }

      let safeArrayBound = null;

      let upperBounds = array.getValue().getUpperBounds();
      let arrayOfSafeArrayBounds = new Array(array.getValue().getDimensions());
      for (let i = 0; i < array.getValue().getDimensions(); i++) {
        safeArrayBound = new Struct();
        safeArrayBound.addMember(upperBounds[i]);
        safeArrayBound.addMember(new ComValue(0, types.INTEGER)); //starts at 0
        arrayOfSafeArrayBounds[i] = new ComValue(safeArrayBound, types.STRUCT);
      }

      let arrayOfSafeArrayBounds2 = new ComArray(new ComValue(arrayOfSafeArrayBounds, types.STRUCT),true);

      safeArray.addMember(new ComValue(flags, types.SHORT));//flags
      if (elementSize > 0) {
        safeArray.addMember(new ComValue(elementSize, types.INTEGER));
      } else {
        elementSize = MarshalUnMarshalHelper.getLengthInBytes(obj[0], null, FLAG);
        safeArray.addMember(new ComValue(elementSize, types.INTEGER));//size
      }

      safeArray.addMember(new ComValue(0, types.SHORT));//locks
      safeArray.addMember(new ComValue(new Variant().getSupportedType(new ComValue(null, c), FLAG), types.SHORT));//variant array, safearrayunion
      //peculiarity here, windows seems to be sending the signed type in VarType32...
      if (c == types.BOOLEAN) {
        safeArray.addMember(new Variant().getSupportedType(new ComValue(null, types.SHORT),FLAG));//safearrayunion
      } else if (c == types.LONG) {
        safeArray.addMember(new Variant().getSupportedType(new ComValue(null, types.LONG),FLAG));//safearrayunion
      } else {
        safeArray.addMember(new Variant().getSupportedType(new ComValue(null, c),FLAG));//safearrayunion
      }
      safeArray.addMember(new ComValue(array2.getNumElementsInAllDimensions(), types.INTEGER));//size in safearrayunion
      let  ptr2RealArray = new Pointer(new ComValue(array2, types.COMARRAY));
      safeArray.addMember(new ComValue(ptr2RealArray, types.POINTER));
      safeArray.addMember(new ComValue(arrayOfSafeArrayBounds2, types.COMARRAY));
    } catch (e) {
      throw new Error(e);
    }
    variant2 = new VariantBody(3, 
      {safeArray: new ComValue(safeArray,types.STRUCT), nestedClass: new ComValue(null, c),is2Dimensional: is2Dim,isByref: isByref,FLAG: FLAG});
    this.init(new ComValue(variant2, types.VARIANTBODY),false);
  }

  getObject()
  {
    this.checkValidity();
    return (this.member.getReferent());
  }

  getObjectAsInt(){
    this.checkValidity();
    return (this.member.getReferent()).getObjectAsInt();
  }

  getObjectAsFloat(){
    this.checkValidity();
    return (this.member.getReferent()).getObjectAsFloat();
  }

  getObjectAsCODE(){
    this.checkValidity();
    return (this.member.getReferent()).getObjectAsCODE();
  }

  getObjectAsDouble(){
    this.checkValidity();
    return (this.member.getReferent()).getObjectAsDouble();
  }

  getObjectAsShort(){
    this.checkValidity();
    return (this.member.getReferent()).getObjectAsShort();
  }

  getObjectAsBoolean(){
    this.checkValidity();
    return (this.member.getReferent()).getObjectAsBoolean();
  }

  getObjectAsString(){
    this.checkValidity();
    return (this.member.getReferent()).getObjectAsString();
  }

  //TO-DO: asString2

  getObjectAsDate(){
    this.checkValidity();
    return (this.member.getReferent()).getObjectAsDate();
  }

  getObjectAsComObject(){
    this.checkValidity();
    return (this.member.getReferent()).getObjectAsComObject();
  }

  getObjectAsVariant(){
    this.checkValidity();
    return (this.member.getReferent()).getObjectAsVariant();
  }

  getObjectAsArray(){
    this.checkValidity();
    return (this.member.getReferent()).getObjectAsArray();
  }

  getObjectAsLong(){
    this.checkValidity();
    return (this.member.getReferent()).getObjectAsLong();
  }

  encode(ndr, defferedPointers, FLAG)
  {
    this.member.setDeferred(true);
    //TO-DO: serializing
  }

  decode(ndr, defferedPointers, FLAG, addionalData)
  {
    var variant = new Variant();
    var ref = new Pointer(new ComValue(null, types.VARIANTBODY));
    ref.setDeffered(true);
    variant.member = MarshalUnMarshalHelper.deSerialize(ndr, new ComValue(ref, types.POINTER), defferedPointers, FLAG, addionalData);
    return new ComValue(variant, types.VARIANT);
  }

  isArray()
  {
    this.checkValidity;
    return (this.member.getReferent()).isArray();
  }

  getLengthInBytes(FLAG)
  {
    this.checkValidity();
    //// TODO: MARSHALING GET LENGTH IN BYTES
  }

  isByRefFlagSet()
  {
    this.checkValidity();
    return (this.member.getReferent()).isByref();
  }

  getType()
  {
    this.checkValidity();
    return (this.member.getReferent()).getType();
  }

  checkValidity()
  {
    if (this.member == null || this.member.isNull()) {
      throw new Error(new ErrorCodes().VARIANT_IS_NULL);
    }
  }

  toString()
  {
    return this.member == null ? "[null]" : String('[' + this.member.toString() + ']');
  }
};

class VariantBody
{
  constructor(constructor,args)
  {
    this.serialVersionUID = -8484108480626831102;
  	this.VT_PTR = 0x1A;
  	this.VT_SAFEARRAY = 0x1B;
  	this.VT_CARRAY = 0x1C;
    this.VT_USERDEFINED = 0x1D;

    this.EMPTY = EMPTY;
    this.NULL = NULL;
    this.SCODE = SCODE;

    this.is2Dimensional = false;
    this.obj = null;
    this.type = -1;
    this.safeArrayStruct = null;
    this.isArray = false;
    this.isScode = false;
    this.isNUll = false;
    this.nestedArrayRealClass = null;
    this.type3 = new Array();
    this.isByref = false;
    this.FLAG = Flags.FLAG_NULL;

    // easier workaround for lack of function overloading
    if (constructor == 1) {
      this.VariantBodyObj(args);
    } else if (constructor == 2) {
      this.VariantBodyValue(args);
    } else if (constructor == 3) {
      this.VariantBodyArray(args);
    }

    // populate type3
    this.type3.push(Number);
    this.type3.push(Boolean);
    this.type3.push(String);
    this.type3.push(EMPTY);
    this.type3.push(NULL);
    this.type3.push(SCODE);
  }

  VariantBodyObj(args){
    var dataType = (args.dataType == undefined) ? -1 : args.dataType;
    
    this.obj = (args.referent == null) ? VariantBody.EMPTY : args.referent;

    if (this.obj.getType() == types.COMSTRING && (this.obj.getValue().getType() != Flags.FLAG_REPRESENTATION_STRING_BSTR)) {
      throw new Error(new ErrorCodes().VARIANT_BSTR_ONLY);
    }

    if (this.obj.getType() == types.BOOLEAN) {
      this.FLAG = Flags.FLAG_REPRESENTATION_VARIANT_BOOL;
    }

    this.isByref = args.isByRef;

    var typo = new Variant().getSupportedType(this.obj, dataType);
    if (typo != null) {
      this.types = Number.parseInt(typo) | (args.isByRef ? Variant.VT_BYREF:0);
    } else {
      throw new Error(new ErrorCodes().VARIANT_UNSUPPORTED_TYPE);
    }

    if (dataType == Variant.VT_NULL) {
      this.isNull = true;
      this.obj = new Number(0);
    }
  }

  VariantBodyValue(args)
  {
    if (args.value instanceof NULL) {
      this.VariantBodyObj(1, {referent: new Number(0), isByref: false, dataType: -1});
      this.isNull = true;
      this.type = Varian.VT_NULL;
    }

    this.VariantBodyObj(1, {referent: new Number(args.errorCode), isByref: args.isByRef, dataType: -1});
    this.isScode = true;
    this.type = Variant.VT_ERROR;
  }

  VariantBodyArray(args)
  {
    this.FLAG = args.FLAG;
    this.safeArrayStruct = args.safeArray;
    this.isArray = true;
    if (this.safeArrayStruct == null) {
      this.isNull = true;

    }

    this.nestedArrayRealClass = args.nestedClass;
    this.is2Dimensional = args.is2Dimensional;

    this.isByRef = args.isByref;

    var types = Number.parseInt(new Variant().getSupportedType(args.nestedClass, this.FLAG));
    if (types != null) {
      this.type = types | (args.isByRef ? new Variant().VT_BYREF:0);
    } else {
      throw new Error(new ErrorCodes().VARIANT_UNSUPPORTED_TYPE);
    }
  }

  getObject()
  {
    return (this.obj == null) ? this.getArray() : this.obj;
  }

  getArray()
  {
    var retVal = null;

    if (this.safeArrayStruct != null) {
      retVal = this.safeArrayStruct.getValue().getMember(7).getValue().getReferent();

      if (this.is2Dimensional) {
        var obj3 = retVal.getArrayInstance();
        var safeArrayBound = this.safeArrayStruct.getValue().getMember(8).getValue();

        // TODO: IMPLEMENT THE REST WITH BI-DIMENSIONAL Array
        // IM POSTPONING THIS FOR NOW BUT IT WILL BE NEEDED LATER
      }
    }
    return retVal;
  }

  getObjectAsInt()
  {
    try {
      return Number.parseInt(this.obj);
    }catch(e){};
  }

  getObjectAsLong()
  {
    try {
      return Number.parseInt(this.obj);
    }catch(e){};
  }

  getObjectAsSCODE()
  {
    try {
      return this.obj.errorCode;
    }catch(e){};
  }

  getObjectAsFloat()
  {
    try {
      return Number(this.obj);
    }catch(e){};
  }

  getObjectAsDouble()
  {
    try {
      return Number(this.obj);
    }catch(e){};
  }

  getObjectAsShort()
  {
    try {
      return Number.parseInt(this.obj);
    }catch(e){};
  }

  getObjectAsBoolean()
  {
    try {
      return Boolean(this.obj);
    }catch(e){};
  }

  getObjectAsString()
  {
    try {
      return String(this.obj);
    }catch(e){};
  }

  getObjectAsDate()
  {
    try {
      return Date(this.obj);
    }catch(e){};
  }

  getObjectAsVariant()
  {
    try {
      return Variant(this.obj);
    }catch(e){};
  }

  getObjectAsComObject()
  {
    try {
      return ComObject(this.obj);
    }catch(e){};
  }

  encode(ndr, defferedPointers, FLAG)
  {
    this.FLAG |= FLAG;
    var index = new Number(ndr.getBuffer().getIndex());
    if (index%8.0 != 0) {
      var i = (i=Math.round(index%8.0)) == 0 ? 0 : 8 - i;
      ndr.writeOctetArray(new Array[Number.parseInt(i)], 0, Number.parseInt(i));
    }

    var start = ndr.getBuffer.getIndex();

    ndr.writeUnsignedLong(0xFFFFFFFF);
    ndr.writeUnsignedLong(0);

    var varType = this.getVarType(obj != null ? obj.constructor : this.nestedArrayRealClass, obj);

    if ((FLAG & FLags.FLAG_REPRESENTATION_DISPATCH_NULL_FOR_OUT) ==
      Flags.FLAG_REPRESENTATION_DISPATCH_NULL_FOR_OUT) {
      varType = isByRef ? 0x4000 | Variant.VT_DISPATCH : Variant.VT_DISPATCH;
    }

    ndr.writeUnsignedShort(varType);

    ndr.writeUnsignedSmall(0xCC);
		ndr.writeUnsignedSmall(0xCC);
		ndr.writeUnsignedSmall(0xCC);
		ndr.writeUnsignedSmall(0xCC);
		ndr.writeUnsignedSmall(0xCC);
    ndr.writeUnsignedSmall(0xCC);

    if (obj != null) {
      ndr.writeUnsignedLong(varType);
    } else {
      if (!isByRef) {
        ndr.writeUnsignedLong(new Variant().VT_ARRAY);
      } else {
        ndr.writeUnsignedLong(new Variant().VT_BYREF_VT_ARRAY);
      }
    }

    if (isByRef) {
      var flag = -1;
      if (this.isArray) {
        flag = -4;
      } else {
        switch (this.type) {
          case Variant.VT_BYREF_VT_VARIANT:
            flag = 0x10;
            break;
          case VT_BYREF_VT_DATE:
          case VT_BYREF_VT_CY:
            flag = 8;
            break;
          default:
            flag = 4;
        }
      }
      ndr.writeUnsignedLong(flag);
    }

    var varDefferedPointers = new Array();

    this.setValue(ndr, obj, varDefferedPointers, FLAG);

    var x = 0;
    while (x < varDefferedPointers.length) {
      var newList = new Array();
      MarshalUnMarshalHelper.serialize(ndr, Pointer, varDefferedPointers[x],
        newList, FLAG);
      x++;
      var aux = newList.slice(0, newList.length);
      var aux_i = x;
      while (aux.length > 0) {
        varDefferedPointers.splice(x, 0, aux.shift());
      }
    }

    var currentIndex = 0;
    var length = (currentIndex = ndr.getBuffer(0).getIndex()) - start;
    var value = Number.parseInt(length/8);
    if (length%8.0 != 0) {
      value++;
    }

    ndr.getBuffer().setIndex(start);
    ndr.writeUnsignedLong(value);
    ndr.getBuffer().setIndex(currentIndex);
  }

  getMaxLength(c, obj)
  {
    var length = 0;
    if (type3.includes(c)) {
      length = MarshalUnMarshalHelper.getLengthInBytes(c, obj, FLAG);
    } else if (c instanceof Number || c instanceof Date || c instanceof Currency) {
      length = 8;
    } else if (c instanceof IString) {
      length = MarshalUnMarshalHelper.getLengthInBytes(c, obj, FLAG);
    } else if (obj instanceof ComObject) {
      var value = obj.internal_getInterfacePointer().getLength();
      value = value + 4 + 4 + 4;
    }

    return length;
  }

  decode(ndr, defferedPointers, FLAG, additionalData){
		let index = new Number(ndr.getBuffer().getIndex());
		if (index % 8.0 != 0)
		{
      let i = Math.round(index%8.0);
      i = (i == 0)? 0 : 8 - i ;
			ndr.readOctetArray(new Array(i), 0, i);
		}

		let start = ndr.getBuffer().getIndex();
		let length = ndr.readUnsignedLong(); //read the potential length
		ndr.readUnsignedLong(); //read the reserved byte

		let variantType = ndr.readUnsignedShort(); //varType

		//read reserved bytes
		ndr.readUnsignedShort();
		ndr.readUnsignedShort();
		ndr.readUnsignedShort();

		ndr.readUnsignedLong(); //32 bit varType

		let variant = null;

		var varDefferedPointers = new Array();
		if((variantType & new Variant().VT_ARRAY) == 0x2000)
		{
			var isByRef = (variantType & new Variant().VT_BYREF) == 0 ? false : true;
			//the struct may be null if the array has nothing
			let safeArray = this.getDecodedValueAsArray(ndr,varDefferedPointers,variantType & ~new Variant().VT_ARRAY,isByRef,additionalData,FLAG);
			let type2 = variantType;
			if (isByRef)
			{
				type2 = type2 & ~new Variant().VT_BYREF; //so that actual type can be determined
			}

			type2 = type2 & 0x0FFF ;
			let flagofFlags = FLAG;
			if (type2 == new Variant().VT_INT)
			{
				flagofFlags |= Flags.FLAG_REPRESENTATION_VT_INT;
			}
			else
			if (type2 == new Variant().VT_UINT)
			{
				flagofFlags |= Flags.FLAG_REPRESENTATION_VT_UINT;
			}
			else
			if (type2 == new Variant().VT_BOOL)
			{
				FLAG = flagofFlags |= Flags.FLAG_REPRESENTATION_VARIANT_BOOL;
			}

			if(safeArray != null)
			{
        variant = new VariantBody(3, {safeArray: safeArray, nestedClass: new Variant().getSupportedClass(new Number(type2 
          & ~new Variant().VT_ARRAY)),is2Dimensional: (safeArray.getValue().getMember(8).getValue().getArrayInstance()).length > 1 ? true : false ,
          isByref: isByRef, FLAG: flagofFlags});
			}
			else
			{
        variant = new VariantBody(3, {safeArray: null, nestedClass: new Variant().getSupportedClass(new Number(type2 & ~new Variant().VT_ARRAY)),
          is2Dimensional: false,isByref: isByRef, FLAG: flagofFlags});
			}

			variant.FLAG = flagofFlags;

		}
		else
		{
      var isByRef = (variantType & new Variant().VT_BYREF) == 0 ? false : true;
      let ref = this.getDecodedValue(ndr,varDefferedPointers,variantType,isByRef,additionalData,FLAG);
      variant = new VariantBody(1, {referent: ref,
        isByRef: isByRef, dataType: variantType});
			let type2 = variantType & 0x0FFF ;
			if (type2 == new Variant().VT_INT)
			{
				variant.FLAG = Flags.FLAG_REPRESENTATION_VT_INT;
			}
			else
			if (type2 == new Variant().VT_UINT)
			{
				variant.FLAG = Flags.FLAG_REPRESENTATION_VT_UINT;
			}
		}


		let x = 0;
		while (x < varDefferedPointers.length)
		{

			let newList = new Array();
			let replacement = MarshalUnMarshalHelper.deSerialize(ndr,new ComValue(varDefferedPointers[x], types.POINTER),newList,FLAG,additionalData);
			varDefferedPointers[x].replaceSelfWithNewPointer(replacement); //this should replace the value in the original place.
      x++;
      let aux = newList;
      let maxLength = newList.length;
      let i = 0;
      let aux_index = x;
      let begin = varDefferedPointers.slice(0, x);
      let end = varDefferedPointers.slice(x, varDefferedPointers.length);
      let middle = newList;
      varDefferedPointers = begin.concat(middle.concat(end));
      /*while(i++ < maxLength)
			  varDefferedPointers.splice(aux_index++, 0, aux.shift());*/
		}

		if (variant.isArray && variant.safeArrayStruct != null)
		{
			//SafeArray have the alignment rule , that all Size <=4 are aligned by 4 and size 8 is aligned by 8.
			//Variant is aligned by 4, Interface pointers are aligned by 4 as well.
			//but this should not exceed the length
			index = new Number(ndr.getBuffer().getIndex());
			length = length * 8 + start;
			if (index < length) {
				let safeArray = variant.safeArrayStruct;
				let size = safeArray.getValue().getMember(2);
				let i = 0;
				if (size == 8) {
					if (index%8.0 != 0) {
            i = Math.round(index%8.0);
            i = (i) == 0 ? 0 : 8 - i ;
						if (index + i <= length) {
							ndr.readOctetArray(new Array(i), 0, i);
						}	else {
							ndr.readOctetArray(new Array(length - index), 0, (length - index));
						}
					}
				}	else {
					//align by 4...
					//TODO this needs to be tested for Structs and Unions.
					if (index%4.0 != 0) {
						i = (i=Math.round(index%4.0)) == 0 ? 0 : 4 - i ;
						if (index + i <= length) {
							ndr.readOctetArray(new Array(i), 0, i);
						} else {
							ndr.readOctetArray(new Array(length - index), 0, (length - index));
						}
					}
				}
			}

			//SafeArray is complete
			let array = null;
			try {
				array = variant.getArray();
			} catch (e) {
				throw new Error(e);
			}
			let variantMain = new Variant(new ComValue(array, types.COMARRAY),variant.isByref,variant.FLAG);
			variant = variantMain.member.getValue().getReferent();
		}

		return variant;
  }

  getDecodedValue(ndr, defferedPointers, type, isByRef, additionalData, FLAG)
	{

		let obj = null;
		let c = this.getVarClass(type);
		if (c != null)
		{
			if (isByRef)
			{
				ndr.readUnsignedLong(); //Read the Pointer
			}

			if (c == new VariantBody().SCODE)
			{
				obj = MarshalUnMarshalHelper.deSerialize(ndr,new ComValue(null, types.INTEGER),null,FLAG,additionalData);
        /*let scode = new VariantBody().SCODE;
        scode.errorCode = obj;
        obj = scode;*/
				type = new Variant().VT_ERROR;
			}else
			if (c  == new VariantBody().NULL)
			{
				//have read 20 bytes
				//JIMarshalUnMarshalHelper.deSerialize(ndr,Integer.class,null,JIFlags.FLAG_NULL);//read the last 4 bytes, since there could be parameters before this.
				obj = NULL;
				type = new Variant().VT_NULL;
			}else
			if (c == new VariantBody().EMPTY) //empty is 20 bytes
			{
				obj = new ComValue(new VariantBody().EMPTY,types.EMPTY);
				type = new Variant().VT_EMPTY;
			}else
			if (c.getType()  == types.COMSTRING)
			{
				obj = new ComString(Flags.FLAG_REPRESENTATION_STRING_BSTR);
				obj = (obj).decode(ndr,null,FLAG,additionalData);
			}
			else
				if (c.getType()  == types.BOOLEAN) {
					obj = MarshalUnMarshalHelper.deSerialize(ndr, new ComValue(false, types.BOOLEAN),defferedPointers,FLAG | Flags.FLAG_REPRESENTATION_VARIANT_BOOL,additionalData);
				} else {
					obj = MarshalUnMarshalHelper.deSerialize(ndr, c,defferedPointers,FLAG,additionalData);
				}
		}
		return obj;
  }
  
  getVarClass(type)
	{
		let c = null;
		//now first to check if this is a pointer or not.
		type = type & 0x0FFF ; //0x4XXX & 0x0FFF = real type
		switch(type)
		{
			case 0:  //VT_EMPTY , Not specified.
				c = EMPTY;
				break;
			case 1:	// VT_NULL , Null.
				c = NULL;
				break;
			case 10:
				c = SCODE; //VT_ERROR,Scodes.
				break;
			default:
				c = new Variant().getSupportedClass(new Number(type));
				if (c == null)
				{
					//TODO log this , what has come that i don't support.
				}
			    break;
		}

		return c;
  }
  
  getDecodedValueAsArray(ndr, defferedPointers, type, isByRef, additionalData, FLAG)
	{
		//int newFLAG = FLAG;
		if (isByRef)
		{
			ndr.readUnsignedLong();//read the pointer
			type = type & ~new Variant().VT_BYREF; //so that actual type can be determined
		}

		if (ndr.readUnsignedLong() == 0)//read pointer referent id
		{
			return null;
		}

		ndr.readUnsignedLong();//1

		let safeArray = new Struct();
		try {
			safeArray.addMember(new ComValue(null, types.SHORT));//dim

			let safeArrayBound = new Struct();
			safeArrayBound.addMember(new ComValue(null, types.INTEGER));
			safeArrayBound.addMember(new ComValue(null, types.INTEGER)); //starts at 0

			safeArray.addMember(new ComValue(null, types.SHORT));//flags
			safeArray.addMember(new ComValue(null, types.INTEGER));//size
			safeArray.addMember(new ComValue(null, types.SHORT));//locks
			safeArray.addMember(new ComValue(null, types.SHORT));//locks
			safeArray.addMember(new ComValue(null, types.INTEGER));//safearrayunion
			safeArray.addMember(new ComValue(null, types.INTEGER));//size in safearrayunion

			let c = new Variant().supportedTypes_classes.get(new Number(type));
			if (c == null)
			{
				//not available , lets try with JIVariant.
				//This is a bug, I should have the type.
				c = new ComValue(null, types.VARIANT);
			}

			if (c.getType() == types.BOOLEAN)
			{
				FLAG |= Flags.FLAG_REPRESENTATION_VARIANT_BOOL;
      }
			let values = null;
			if (c.getType() == types.COMSTRING)
			{
				values = new ComArray(new ComValue(new ComString(Flags.FLAG_REPRESENTATION_STRING_BSTR), types.COMSTRING),null,1,true);
				safeArray.addMember(new ComValue(new Pointer(new ComValue(values, types.COMARRAY)), types.POINTER));//single dimension array, will convert it into the
				//[] or [][] after inspecting dimension read.
			}
			else
			{
				values = new ComArray(c,null,1,true);
				safeArray.addMember(new ComValue(new Pointer(new ComValue(values, types.COMARRAY)), types.POINTER));//single dimension array, will convert it into the
																						//[] or [][] after inspecting dimension read.
			}

			safeArray.addMember(new ComValue(new ComArray(new ComValue(safeArrayBound, types.STRUCT),null,1,true), types.COMARRAY));

			safeArray = MarshalUnMarshalHelper.deSerialize(ndr,new ComValue(safeArray, types.STRUCT),defferedPointers,FLAG,additionalData);

			//now set the right class after examining the flags , only set for JIVariant.class now., the BSTR would already be set previously.
			let features = safeArray.getValue().getMember(1);
			//this condition is being kept in the front since the feature flags can be a combination of FADF_VARIANT and the
			//other flags , in which case the Variant takes priority (since they will all be wrapped as variants).
			if ((features & new Variant().FADF_VARIANT) == new Variant().FADF_VARIANT)
			{
				values.updateClazz(new ComValue(null, types.VARIANT));
			}
			else if (((features & new Variant().FADF_DISPATCH) == new Variant().FADF_DISPATCH) ||
					((features & new Variant().FADF_UNKNOWN) == new Variant().FADF_UNKNOWN))
			{
				values.updateClazz(new ComValue(nul, types.COMOBJECT));
			}
			//For JIStrings , it will be done before these above conditions are examined.


		} catch (e) {
			throw new Error(e);
		}


		return safeArray;
	}
}

module.exports = {
  Variant,
  VariantBody
}
