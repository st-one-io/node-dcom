var ErrorCodes = require('../common/errorcodes.js');
var System = require('../common/system.js');
var HashMap = require('hashmap');
var Flags = require('./flags.js');

class Variant
{
  constructor()
  {
    this.EMPTY = new Variant(new EMPTY());
    this.EMPTY_BYREF = new Variant(this.EMPTY);
    this.NULL = new Variant(new NULL()):
    this.OPTIONAL_PARAM = new Variant(Variant.SCODE, ErrorCodes.DISP_E_PARAMNOTFOUND):
    this.SCODE = new SCODE();
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
  	this.VT_BYREF_VT_UI1 = VT_BYREF|VT_UI1;//0x00004011;
  	this.VT_BYREF_VT_I2  = VT_BYREF|VT_I2;//0x00004002;
  	this.VT_BYREF_VT_I4  = VT_BYREF|VT_I4;//0x00004003;
  	this.VT_BYREF_VT_R4  = VT_BYREF|VT_R4;//0x00004004;
  	this.VT_BYREF_VT_R8  = VT_BYREF|VT_R8;//0x00004005;
  	this.VT_BYREF_VT_BOOL 	  = VT_BYREF|VT_BOOL;//0x0000400b;
  	this.VT_BYREF_VT_ERROR 	  = VT_BYREF|VT_ERROR;//0x0000400a;
  	this.VT_BYREF_VT_CY 	 	  = VT_BYREF|VT_CY;//0x00004006;
  	this.VT_BYREF_VT_DATE 	  = VT_BYREF|VT_DATE;//0x00004007;
  	this.VT_BYREF_VT_BSTR 	  = VT_BYREF|VT_BSTR;//0x00004008;
  	this.VT_BYREF_VT_UNKNOWN  = VT_BYREF|VT_UNKNOWN;//0x0000400d;
  	this.VT_BYREF_VT_DISPATCH = VT_BYREF|VT_DISPATCH;//0x00004009;
  	this.VT_BYREF_VT_ARRAY 	  = VT_BYREF|VT_ARRAY;//0x00006000;
  	this.VT_BYREF_VT_VARIANT  = VT_BYREF|VT_VARIANT;//0x0000400c;

  	this.VT_I1 				 = 0x00000010;
  	this.VT_UI2 			 = 0x00000012;
  	this.VT_UI4 			 = 0x00000013;
  	this.VT_I8				 = 0x00000014;
  	this.VT_INT 			 = 0x00000016;
  	this.VT_UINT 			 = 0x00000017;
  	this.VT_BYREF_VT_DECIMAL  = VT_BYREF|VT_DECIMAL;//0x0000400e;
  	this.VT_BYREF_VT_I1  	 	  = VT_BYREF|VT_I1;//0x00004010;
  	this.VT_BYREF_VT_UI2 	 = VT_BYREF|VT_UI2;//0x00004012;
  	this.VT_BYREF_VT_UI4 	 = VT_BYREF|VT_UI4;//0x00004013;
  	this.VT_BYREF_VT_I8		 = VT_BYREF|VT_I8;//0x00004014;
  	this.VT_BYREF_VT_INT 	 = VT_BYREF|VT_INT;//0x00004016;
  	this.VT_BYREF_VT_UINT  = VT_BYREF|VT_UINT;//0x00004017;

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

    this.supportedTypes = new HashMap();
    this.supportedTypes_classes = new HashMap();
    this.outTypeMap = new HashMap();

    // populate those hashes
    this.outTypeMap.put(Number, new Number(0));
    this.outTypeMap.put(Boolean, false);
    this.outTypeMap.put(String, "");
    this.outTypeMap.put(Currency, new Currency("0.0"));
    this.outTypeMap.put(Date, new Date());

    // TO-DO: evaluate the necessity of unsigned byte, short, and integer (all Number here)
    // TO-DO: same for long, which would require an external module since no suport in JS

    this.supportedTypes(Object, new Number(this.VT_VARIANT));
    this.supportedTypes(Variant, new Number(this.VT_VARIANT));
    this.supportedTypes(Boolean, new Number(this.VT_BOOL));
    this.supportedTypes(IString, new Number(this.VT_BSTR));
    this.supportedTypes(EMPTY, new Number(this.VT_EMPTY));
    this.supportedTypes(SCODE, new Number(this.VT_ERROR));
    this.supportedTypes(NULL, new Number(this.VT_NULL));
    this.supportedTypes(Array, new Number(this.VT_ARRAY));
    this.supportedTypes(Date, new Number(this.VT_DATE));
    this.supportedTypes(Currency, new Number(this.VT_CY));

    // TO-DO: evaluate what should be done with the missing types
    // and if it will impact on the lib when interacting with a COM server
    this.supportedTypes_classes(new Number(this.VT_DATE), Date);
    this.supportedTypes_classes(new Number(this.VT_CY), Currency);
    this.supportedTypes_classes(new Number(this.VT_VARIANT), Variant);
    this.supportedTypes_classes(new Number(this.VT_I4), Number);
    this.supportedTypes_classes(new Number(this.VT_INT), Number);
    this.supportedTypes_classes(new Number(this.VT_R4), Number);
    this.supportedTypes_classes(new Number(this.VT_BOOL), Boolean);
    this.supportedTypes_classes(new Number(this.VT_I2), Number);
    this.supportedTypes_classes(new Number(this.VT_I1), String);
    this.supportedTypes_classes(new Number(this.VT_BSTR), String);
    this.supportedTypes_classes(new Number(this.VT_ERROR), SCODE);
    this.supportedTypes_classes(new Number(this.VT_EMPTY), EMPTY);
    this.supportedTypes_classes(new Number(this.VT_NULL), NULL);
    this.supportedTypes_classes(new Number(this.VT_ARRAY), Array);
    this.supportedTypes_classes(new Number(this.VT_UNKNOWN), ComObject);
    this.supportedTypes_classes(new Number(this.VT_DISPATCH), ComObject);

    // init Arrays
    this.arryInits = new Array();
    this.arryInits.push(IString);
    this.arryInits.push(IPointer);
    this.arryInits.push(ComObjectImpl);
    this.arryInits.push(Dispatch);
    this.arryInits.push
  }

  OUTPARAMforType(c isArray)
  {
    var variant = null;
    if (!isArray) {
      variant = this.makeVariant(outTypeMap.get(c), true);

      if (c instanceof Dispatch) {
        return this.OUT_DISPATCH();
      } else if (c instanceof ComObject) {
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
        variant = new Variant(new IArray(x, true), true);
      }

      if (c instanceof Dispatch) {
        var arry = [new ComObjectImpl(null, new InterfacePointer(null, -1, null))];
        variant = new Variant(new IArray(arry, true), true);
        variant.setFlag(Flags.FLAG_REPRESENTATION_DISPATCH_NULL_FOR_OUT |
          Flags.FLAG_REPRESENTATION_SET_INTERFACEPTR_NULL_FOR_VARIANT);
      } else if (c instanceof ComObject) {
        var arry = [new ComObjectImpl(null, new InterfacePointer(null, -1, null))];
        variant = new Variant(new IArray(arry, true), true);
        variant.setFlag(FLags.FLAG_REPRESENTATION_UNKNOWN_NULL_FOR_OUT |
          Flags.FLAG_REPRESENTATION_SET_INTERFACEPTR_NULL_FOR_VARIANT);
      } else if (c instanceof Variant) {
        return VARIANTARRAY();
      } else if (c instanceof IString || c instanceof String) {
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
    var retVal = this.supportedTypes.get(c);

    if (retVal == null && c instanceof ComObject) {
      retVal = new Number(this.VT_UNKNOWN);
    }

    if (retVal == null && c instanceof Dispatch) {
      retVal = new Number(this.VT_DISPATCH);
    }

    if (retVl == this.VT_I4 && (FLAG & Flags.FLAG_REPRESENTATION_VT_INT) ==
      Flags.FLAG_REPRESENTATION_VT_INT) {
      retVal = new Number(this.VT_INT);
    } else if (retVal == this.VT_UI4 &&
      (FLAG & Flags.FLAG_REPRESENTATION_VT_UINT) == Flags.FLAG_REPRESENTATION_VT_UINT) {
      retVal = new Number(this.VT_UINT);
    }

    return retVal;
  }

  getSupportedTypeObj(o, defaultType)
  {
    var c = o.constructor;
    var retVal = this.supportedTypes.get(c);

    if (retVal == null && o instanceof Dispatch) {
      retval = new Number(this.VT_DISPATCH);
    }

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
    var retVal = new Variant(new ComObjectImpl(null, new InterfacePointer(null, -1, null)), true);
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
    return new Variant(Variant.SCODE, ErrorCodes.DISP_E_PARAMNOTFOUND);
  }

  BSTRARRAY()
  {
    return new Variant(new IArray([""], true), true);
  }

  VARIANTARRAY()
  {
    return new Variant(new IArray([Variant.EMPTY()], true), true);
  }

  init(obj, isByref))
  {
    isByref = (isByref == undefined) ? false : isByref;

    if (obj != null && obj instanceof Array) {
      throw new Error("Ilegal Argument: " + ErrorCodes.VARIANT_ONLY_JIARRAY_EXCEPTED);
    }

    if (obj != null && obj instancof InterfacePointer) {
      throw new Error("Ilegal Argument:" + ErrorCodes.VARIANT_TYPE_INCORRECT);
    }

    if (obj instanceof VariantBody) {
      this.member = new Pointer(obj);
    }else {
      var variantBody = new VariantBody(obj, isByref);
      this.member = new Pointer(variantBody);
    }
    this.member.setReferent(0x72657355);
  }

  setDeferred(deffered)
  {
    if (this.member != null && !this.member.isReference()) {
      this.member.setDeferred(deffered);
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
    errorCode = (erroCode == undefined) ? false: errorCode;

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
      if (value instanceof Dispatch) {
        this.setFlag(Flags.FLAG_REPRESENTATION_USE_DISPATCH_IID);
      } else {
        this.setFlag(Flags.FLAG_REPRESENTATION_UNKNOWN_IID);
      }
    } else if () {

    }
  }

  VariantArray(array, isByref, FLAG)
  {
    isByref = (isByref == undefined) ? false : isByref;
    FLAG = (FLAG == undefined) ? Flags.FLAG_NULL : FLAG;
    this.init(array, isByref, FLAG);
  }
};

class EMPTY{};
class SCODE{};
class NULL{};
