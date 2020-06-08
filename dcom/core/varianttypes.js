const HashMap = require('hashmap');
const types = require('./types');
const ComValue = require('./comvalue');

var variantTypes = {};
variantTypes.VT_NULL = 0x00000001;
variantTypes.VT_EMPTY = 0x00000000;
variantTypes.VT_I4 = 0x00000003;
variantTypes.VT_UI1 = 0x00000011;
variantTypes.VT_I2 = 0x00000002;
variantTypes.VT_R4 = 0x00000004;
variantTypes.VT_R8 = 0x00000005;
variantTypes.VT_VARIANT			 = 0x0000000c;
variantTypes.VT_BOOL = 0x0000000b;
variantTypes.VT_ERROR 			 = 0x0000000a;
variantTypes.VT_CY = 0x00000006;
variantTypes.VT_DATE = 0x00000007;
variantTypes.VT_BSTR = 0x00000008;
variantTypes.VT_UNKNOWN 		 = 0x0000000d;
variantTypes.VT_DECIMAL 		 = 0x0000000e;
variantTypes.VT_DISPATCH 		 = 0x00000009;
variantTypes.VT_ARRAY = 0x00002000;
variantTypes.VT_BYREF = 0x00004000;
variantTypes.VT_BYREF_VT_UI1 =variantTypes.VT_BYREF| variantTypes.VT_UI1;// 0x00004011;
variantTypes.VT_BYREF_VT_I2 = variantTypes.VT_BYREF| variantTypes.VT_I2;// 0x00004002;
variantTypes.VT_BYREF_VT_I4 = variantTypes.VT_BYREF| variantTypes.VT_I4;// 0x00004003;
variantTypes.VT_BYREF_VT_R4 = variantTypes.VT_BYREF| variantTypes.VT_R4;// 0x00004004;
variantTypes.VT_BYREF_VT_R8 = variantTypes.VT_BYREF| variantTypes.VT_R8;// 0x00004005;
variantTypes.VT_BYREF_VT_BOOL = variantTypes.VT_BYREF| variantTypes.VT_BOOL;// 0x0000400b;
variantTypes.VT_BYREF_VT_ERROR = variantTypes.VT_BYREF| variantTypes.VT_ERROR;// 0x0000400a;
variantTypes.VT_BYREF_VT_CY = variantTypes.VT_BYREF| variantTypes.VT_CY;// 0x00004006;
variantTypes.VT_BYREF_VT_DATE = variantTypes.VT_BYREF| variantTypes.VT_DATE;// 0x00004007;
variantTypes.VT_BYREF_VT_BSTR = variantTypes.VT_BYREF| variantTypes.VT_BSTR;// 0x00004008;
variantTypes.VT_BYREF_VT_UNKNOWN = variantTypes.VT_BYREF| variantTypes.VT_UNKNOWN;// 0x0000400d;
variantTypes.VT_BYREF_VT_DISPATCH = variantTypes.VT_BYREF| variantTypes.VT_DISPATCH;// 0x00004009;
variantTypes.VT_BYREF_VT_ARRAY = variantTypes.VT_BYREF| variantTypes.VT_ARRAY;// 0x00006000;
variantTypes.VT_BYREF_VT_VARIANT = variantTypes.VT_BYREF| variantTypes.VT_VARIANT;// 0x0000400c;

variantTypes.VT_I1 				 = 0x00000010;
variantTypes.VT_UI2 			 = 0x00000012;
variantTypes.VT_UI4 			 = 0x00000013;
variantTypes.VT_I8				 = 0x00000014;
variantTypes.VT_INT 			 = 0x00000016;
variantTypes.VT_UINT 			 = 0x00000017;
variantTypes.VT_BYREF_VT_DECIMAL = variantTypes.VT_BYREF| variantTypes.VT_DECIMAL;// 0x0000400e;
variantTypes.VT_BYREF_VT_I1 = variantTypes.VT_BYREF| variantTypes.VT_I1;// 0x00004010;
variantTypes.VT_BYREF_VT_UI2 	 = variantTypes.VT_BYREF| variantTypes.VT_UI2;// 0x00004012;
variantTypes.VT_BYREF_VT_UI4 	 = variantTypes.VT_BYREF| variantTypes.VT_UI4;// 0x00004013;
variantTypes.VT_BYREF_VT_I8		 = variantTypes.VT_BYREF| variantTypes.VT_I8;// 0x00004014;
variantTypes.VT_BYREF_VT_INT 	 = variantTypes.VT_BYREF| variantTypes.VT_INT;// 0x00004016;
variantTypes.VT_BYREF_VT_UINT = variantTypes.VT_BYREF| variantTypes.VT_UINT;// 0x00004017;

variantTypes.FADF_AUTO = 0x0001; /* array is allocated on the stack */
variantTypes.FADF_STATIC = 0x0002; /* array is staticly allocated */
variantTypes.FADF_EMBEDDED = 0x0004; /* array is embedded in a structure */
variantTypes.FADF_FIXEDSIZE = 0x0010; /* may not be resized or reallocated */
variantTypes.FADF_RECORD = 0x0020; /* an array of records */
variantTypes.FADF_HAVEIID = 0x0040; /* with FADF_DISPATCH, FADF_UNKNOWN */
                                        /* array has an IID for interfaces */
variantTypes.FADF_HAVEVARTYPE = 0x0080; /* array has a VT type */
variantTypes.FADF_BSTR = 0x0100; /* an array of BSTRs */
variantTypes.FADF_UNKNOWN = 0x0200; /* an array of IUnknown* */
variantTypes.FADF_DISPATCH = 0x0400; /* an array of IDispatch* */
variantTypes.FADF_VARIANT = 0x0800; /* an array of VARIANTs */
variantTypes.FADF_RESERVED = 0xF008; /* reserved bits */

// array types
variantTypes.VT_BOOL_ARRAY = variantTypes.VT_ARRAY | variantTypes.VT_BOOL;
variantTypes.VT_BSTR_ARRAY = variantTypes.VT_ARRAY | variantTypes.VT_BSTR;
variantTypes.VT_DECIMAL_ARRAY = variantTypes.VT_ARRAY | variantTypes.VT_DECIMAL;
variantTypes.VT_ERROR_ARRAY = variantTypes.VT_ARRAY | variantTypes.VT_ERROR;
variantTypes.VT_I1_ARRAY = variantTypes.VT_ARRAY | variantTypes.VT_I1;
variantTypes.VT_I2_ARRAY = variantTypes.VT_ARRAY | variantTypes.VT_I2;
variantTypes.VT_I4_ARRAY = variantTypes.VT_ARRAY | variantTypes.VT_I4;
variantTypes.VT_R4_ARRAY = variantTypes.VT_ARRAY | variantTypes.VT_R4;
variantTypes.VT_R8_ARRAY = variantTypes.VT_ARRAY | variantTypes.VT_R8;
variantTypes.VT_UI1_ARRAY = variantTypes.VT_ARRAY | variantTypes.VT_UI1;
variantTypes.VT_UI2_ARRAY = variantTypes.VT_ARRAY | variantTypes.VT_UI2;
variantTypes.VT_UI4_ARRAY = variantTypes.VT_ARRAY | variantTypes.VT_UI4;
variantTypes.VT_UINT_ARRAY = variantTypes.VT_ARRAY | variantTypes.VT_UINT;
variantTypes.VT_UNKNOWN_ARRAY = variantTypes.VT_ARRAY | variantTypes.VT_UNKNOWN;
variantTypes.VT_VARIANT_ARRAY = variantTypes.VT_ARRAY | variantTypes.VT_VARIANT;
variantTypes.VT_DATE_ARRAY = variantTypes.VT_ARRAY | variantTypes.VT_DATE;

var supportedTypes = new HashMap();
var supportedTypes_classes = new HashMap();
    
// TO-DO: evaluate the necessity of unsigned byte, short, and integer (all Number here)
// TO-DO: same for long, which would require an external module since no suport in JS
supportedTypes.set(Object, variantTypes.VT_VARIANT);
supportedTypes.set(types.VARIANT, variantTypes.VT_VARIANT);
supportedTypes.set(types.BOOLEAN, variantTypes.VT_BOOL);
supportedTypes.set(types.COMSTRING, variantTypes.VT_BSTR);
supportedTypes.set(types.EMPTY, variantTypes.VT_EMPTY);
supportedTypes.set(types.SCODE, variantTypes.VT_ERROR);
supportedTypes.set(types.NULL, variantTypes.VT_NULL);
supportedTypes.set(types.ARRAY, variantTypes.VT_ARRAY);
supportedTypes.set(types.DATE, variantTypes.VT_DATE);
supportedTypes.set(types.INTEGER, variantTypes.VT_I4);
supportedTypes.set(types.FLOAT, variantTypes.VT_R4);
supportedTypes.set(types.DOUBLE, variantTypes.VT_R8);
supportedTypes.set(types.SHORT, variantTypes.VT_I2);
supportedTypes.set(types.BYTE, variantTypes.VT_I1);
supportedTypes.set(types.CHARACTER, variantTypes.VT_I1);
supportedTypes.set(types.COMARRAY, variantTypes.VT_ARRAY);
supportedTypes.set(types.LONG, variantTypes.VT_I8);
supportedTypes.set(types.CURRENCY, variantTypes.VT_CY);
supportedTypes.set(types.UNSIGNEDBYTE, variantTypes.VT_UI1);
supportedTypes.set(types.UNSIGNEDSHORT, variantTypes.VT_UI2);
supportedTypes.set(types.UNSIGNEDINTEGER, variantTypes.VT_UI4);
// TO-DO: find a way to dothis.supportedTypes(Currency, new Number( variantTypes.VT_CY));

// TO-DO: evaluate what should be done with the missing types
// and if it will impact on the lib when interacting with a COM server
supportedTypes_classes.set(new Number( variantTypes.VT_DATE), new ComValue(null, types.DATE));
// TO-DO: find a way to do this.supportedTypes_classes.set(new Number(variantTypes.VT_CY), Currency); properly
supportedTypes_classes.set(new Number( variantTypes.VT_CY), new ComValue(null, types.CURRENCY));
supportedTypes_classes.set(new Number( variantTypes.VT_VARIANT), new ComValue(null, types.VARIANT));
supportedTypes_classes.set(new Number( variantTypes.VT_I4), new ComValue(null, types.INTEGER));
supportedTypes_classes.set(new Number( variantTypes.VT_INT), new ComValue(null, types.INTEGER));
supportedTypes_classes.set(new Number( variantTypes.VT_R4), new ComValue(null, types.FLOAT));
supportedTypes_classes.set(new Number( variantTypes.VT_BOOL), new ComValue(null, types.BOOLEAN));
supportedTypes_classes.set(new Number( variantTypes.VT_I2), new ComValue(null, types.SHORT));
supportedTypes_classes.set(new Number( variantTypes.VT_I1), new ComValue(null, types.BYTE));
supportedTypes_classes.set(new Number( variantTypes.VT_BSTR), new ComValue(null, types.COMSTRING));
supportedTypes_classes.set(new Number( variantTypes.VT_ERROR), variantTypes.SCODE);
supportedTypes_classes.set(new Number( variantTypes.VT_EMPTY), variantTypes.EMPTY);
supportedTypes_classes.set(new Number( variantTypes.VT_NULL), variantTypes.NULL);
supportedTypes_classes.set(new Number( variantTypes.VT_ARRAY), new ComValue(null, types.ARRAY));
supportedTypes_classes.set(new Number( variantTypes.VT_UNKNOWN), new ComValue(null, types.COMOBJECT));
supportedTypes_classes.set(new Number( variantTypes.VT_DISPATCH), new ComValue(null, types.COMOBJECT));
supportedTypes_classes.set(new Number( variantTypes.VT_UI1),new ComValue(null, types.UNSIGNEDBYTE));
supportedTypes_classes.set(new Number( variantTypes.VT_UI2),new ComValue(null, types.UNSIGNEDSHORT));
supportedTypes_classes.set(new Number( variantTypes.VT_UI4),new ComValue(null, types.UNSIGNEDINTEGER));
supportedTypes_classes.set(new Number( variantTypes.VT_I8), new ComValue(null, types.INTEGER));
supportedTypes_classes.set(new Number( variantTypes.VT_R8), new ComValue(null, types.DOUBLE));
supportedTypes_classes.set(new Number( variantTypes.VT_BOOL_ARRAY), new ComValue(types.VT_ARRAY));
supportedTypes_classes.set(new Number( variantTypes.VT_BSTR_ARRAY), new ComValue(types.VT_ARRAY));
supportedTypes_classes.set(new Number( variantTypes.VT_DECIMAL_ARRAY), new ComValue(types.VT_ARRAY));
supportedTypes_classes.set(new Number( variantTypes.VT_ERROR_ARRAY), new ComValue(types.VT_ARRAY));
supportedTypes_classes.set(new Number( variantTypes.VT_I1_ARRAY), new ComValue(types.VT_ARRAY));
supportedTypes_classes.set(new Number( variantTypes.VT_I2_ARRAY), new ComValue(types.VT_ARRAY));
supportedTypes_classes.set(new Number( variantTypes.VT_I4_ARRAY), new ComValue(types.VT_ARRAY));
supportedTypes_classes.set(new Number( variantTypes.VT_R4_ARRAY), new ComValue(types.VT_ARRAY));
supportedTypes_classes.set(new Number( variantTypes.VT_R8_ARRAY), new ComValue(types.VT_ARRAY));
supportedTypes_classes.set(new Number( variantTypes.VT_UI1_ARRAY), new ComValue(types.VT_ARRAY));
supportedTypes_classes.set(new Number( variantTypes.VT_UI2_ARRAY), new ComValue(types.VT_ARRAY));
supportedTypes_classes.set(new Number( variantTypes.VT_UI4_ARRAY), new ComValue(types.VT_ARRAY));
supportedTypes_classes.set(new Number( variantTypes.VT_UINT_ARRAY), new ComValue(types.VT_ARRAY));
supportedTypes_classes.set(new Number( variantTypes.VT_UNKNOWN_ARRAY), new ComValue(types.VT_ARRAY));
supportedTypes_classes.set(new Number( variantTypes.VT_VARIANT_ARRAY), new ComValue(types.VT_ARRAY));

module.exports = {
  supportedTypes,
  supportedTypes_classes,
  variantTypes
};