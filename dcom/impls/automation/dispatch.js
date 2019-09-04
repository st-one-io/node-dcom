var ComObject = require('../../core/comobject.js');
var ComObjectImpl = require('../../core/comobjcimpl.js');
var Variant = require('module');
var ErrorCodes = require('../../common/errorcodes.js');
var System = require('../../common/system.js');
var IArray = require('../../core/iarray.js');
var CallBuilder = require('../../core/callbuilder.js');
var Flags = require('../../core/flags.js');
var FrameWorkHelper = require('../../core/frameworkhelper.js');
var Pointer = require('../../core/pointer.js');
var IString =require('../../core/istring.js');
var Struct = require('../../core/struct.js');
var Variant = require('../../core/variant.js');
var ObjectFactory = require('../impls/objectfactory.js');
var UUID = require('../../rpc/core/uuid.js');
var HashMap = require('hashmap');
var ExcepInfo = require();

class Dispatch extends ComObjectImpl
{
  constructor(ComObject){
    this.serialVersionUID = "4908149252176353846L";
    this.cacheOfDispIds = new HashMap();
    super(comObject);
    this.lastExcepInfo = new ExcepInfo();
    this.FLAG_TYPEINFO_SUPPORTED = 1;
    this.FLAG_TYPEINFO_NOTSUPPORTED = 0;
  }

  getCOMObject()
  {
    return this.comObject;
  }

  getTypeInfoCount()
  {
    var obj = new CallBuilder(true);
    obj.setOpnum(0);
    obj.addInParamAsInt(0, Flags.FLAG_NULL);
    obj.addOutParamAsType(Number, Flags.FLAG_NULL);
    var result = this.comObject.call(obj);
    return Number.parseInt(result[0]);
  }

  getIDsOfName(apiName)
  {
    if (apiName instanceof String) {
      if (apiName == null || apiName.trim() == "") {
        throw new Error("Illegal Argument: " + String(ErrorCode.DISP_INCORRECT_VALUE_FOR_GETIDNAMES));
      }

      var innerMap = this.cacheOfDispIds.get(apiName);
      if (innerMap != null) {
        var dispId = Number(innerMap.get(apiName));
        return dispId;
      }


      var obj = new CallBuilder(true);
      obj.setOpnum(2);

      var name = new IString(apiName.trim(), Flags.FLAG_REPRESENTATION_STRING_LPWSTR);
      var array = new IArray([new Pointer(name)], true);
      obj.addInParamAsUUI(UUID.NIL_UUID, Flags.FLAG_NULL);
      obj.addInParamAsArray(array, Flags.FLAG_NULL);
      obj.addInParamAsInt(1, Flags.FLAG_NULL);
      obj.addInParamAsInt(0x800, Flags.FLAG_NULL);
      obj.addOutParamAsObject(new IArray(Number, null, 1, true), Flags.FLAG_NULL);

      var result = this.comObject.call(obj);
      if (result == null && obj.isError()) {
        throw new Error(String(obj.getHRESULT()));
      }

      innerMap = new HashMap();
      innerMap.put(apiName, result[0].getArrayInstance());
      this.cacheOfDispIds.put(apiName, innerMap);

      return Number(result[0].getArrayInstance(0))[0];
    } else if (apiName instanceof Array) {
      if (apiName == null || apiName.length == 0) {
        throw new Error("Illegal Argument: " + String(new ErrorCodes().DISP_INCORRECT_VALUE_FOR_GETIDNAMES));
      }

      var sendForAll = false;
      var innerMap = this.cacheOfDispIds.get(apiName[0]);
      if (innerMap != null) {
        var values = new Array(innerMap.size());
        for (var i = 0; i < apiName.length; i++) {
          var dispId = Number(innerMap.get(apiName[1]));
          if (dispId == null) {
            sendForAll = true;
            break;
          } else {
            values[i] = Number(dispId);
          }
        }
        if (!sendForAll) {
          return values;
        }
      }
    }
    var obj = new CallBuilder(true);
    obj.setOpnum(2);

    var pointers = new Array(apiName.length);
    for (var i = 0; i < apiName.length; i++) {
      if (apiName[i] == null || apiName[i].trim() == "") {
        throw new Error("Ilegal Arguments: " + String(new ErrorCodes().DISP_INCORRECT_VALUE_FOR_GETIDNAMES));
      }
      pointers[i] = new Pointer(new IString(apiName[i].trim(), Flags.FLAG_REPRESENTATION_STRING_LPWSTR));
    }

    var arry = new IArray(pointers, true);
    var arrayOut = new IArray(Number, null, 1, true);
    obj.addInParamAsUUID(UUID.NIL_UUID, Flags.FLAG_NULL);
    obj.addInParamAsArray(array, Flags.FLAG_NULL);
    obj.addInParamAsInt(apiName.length, Flags.FLAG_NULL);
    obj.addInParamAsInt(0x800, Flags.FLAG_NULL);

    obj.addOutParamAsObject(arrayOut, Flags.FLAG_NULL);

    var result = this.comObject.call(obj);

    if (obj.getHRESUL() != 0) {
      throw new Error("Exception:" + String(obj.getHRESULT()));
    }

    var arrayOfResults = result[0];
    var arrayOfDispIds = Number(arrayOfResults.getArrayInstance());
    var retVal = new Array(apiName.length);

    innerMap = (innerMap == null) ? new HashMap() : innerMap;
    for (var i = 0; i < apiName.length; i++) {
      retVal[i] = Number(arrayOfDispIds[i]);
      innerMap.put(apiName[0], innerMap);
    }
    return retVal;
  }

  getTypeInfo(typeInfo){
    var obj = new CallBuilder(true);
    obj.setOpnum(1);
    obj.addInParamAsInt(typeInfo, Flags.FLAG_NULL);
    obj.addInParamAsInt(0x400, Flags.FLAG_NULL);
    obj.addOutParamAsType(ComObject, Flags.FLAG_NULL);

    var result = this.comObject.call(obj);
    return ObjectFactory.narrowObjects(result[0]);
  }

  invoke(dispId, dispatchFlags, arrayofVariantsInparams, arrayOfNamedDispIds, outParamType)
  {
    this.lastExcepInfo.clearAll();
    var obj = new CallBuilder(true);
    obj.setOpnum(3);

    var dispParams = new Struct();

    var listOfVariantsPtrs = new Array();
    var listofPositions = new Array();
    var variants = null;
    var lengthVar = 0;

    if (arrayofVariantsInparams != null) {
      lengthVar = FrameWorkHelper.reverseArrayForDispatch(arrayofVariantsInparams);
      variants = arrayoVariantsInparams.getArrayInstance();
      for (var i = 0; i < variants.length; i++) {
        var variant = variants[i];
        if (variant.isByRefFlagSet()) {
          listOfVariantsPtrs.push(variant);
          listofPositions.push(Number(i));
          variants[i] = Variant.EMPTY();
        }
      }
    }

    var lengthPtr = 0;
    if (arrayOfNamedDispIds != null) {
      lengthPtr = FrameWorkHelper.reverseArrayForDispatch(arrayOfNamedDispIds);
    }

    dispParams.addMember(new Pointer(arrayofVariantsInparams));
    dispParams.addMember(new Pointer(arrayOfNamedDispIds));
    dispParams.addMember(new Number(lengthVar));
    dispParams.addMember(new Number(lengthPtr));


    obj.addInParamAsInt(dispId, Flags.FLAG_NULL);
    obj.addInParamAsUUID(UUID.NIL_UUID, Flags.FLAG_NULL);
    obj.addInParamAsInt(0x800, Flags.FLAG_NULL);
    obj.addInParamAsInt(dispatchFlags^0xFFFFFFF0, Flags.FLAG_NULL);
    obj.addInParamAsStruct(dispParams, Flags.FLAG_REPRESENTATION_DISPATCH_INVOKE);

    if (listOfVariantsPtrs.size() > 0) {
      obj.addInParamAsInt(listofPositions.size(), Flags.FLAG_NULL);
      obj.addInParamAsArray(new IArray(listofPositions.toArray([listofPositions.size()], true)),
        Flags.FLAG_NULL);
      obj.addInParamAsArray(new IArray(listOfVariantsPtrs.toArray([listOfVariantsPtrs.size()], true))
        Flags.FLAG_NULL);
    }

    obj.addInParamAsObject(null, Flags.FLAG_NULL);//result
    obj.addInParamAsObject(null, Flags.FLAG_NULL);//excepinfo
    obj.addInParamAsObject(null, Flags.FLAG_NULL);//aguerr

    var outparams = new Array(4);
    if (outParamType == null) {
      outparams[0] = Variant;
    } else {
      outparams[0] = outParamType;
    }

    outparams[1] = this.excepInfo;
    outparams[2] = new Pointer(Number, true);
    outparams[3] = new IArray(Variant, null, 1, true);

    obj.setOutParams(outparams,Flags.FLAG_REPRESENTATION_IDISPATCH_INVOKE);

    var result = null;
    try {
      result = this.comObject.call(obj);
    } catch (e) {
      var results = obj.getResultsInCaseOfException();
      if (results != null) {
        var excepInfoRet = results[1];
        var text1 = IString(excepInfoRet.getMember(2)) + " ";
        var text2 = IString(excepInfoRet.getMember(3)) + " [ ]";
        var text3 = IString(excepInfoRet.getmember(4)) + " ] ";
        this.lastExcepInfo.excepDesc = text2;
        this.lastExcepInfo.excepHelpfile = text3;
        this.excepSource = text1;
        this.errorCode = (Number(excepInfoRet.getMember(0) != 0)) ?
          Number(excepInfoRet.getMember(0)) : Number(excepInfoRet.getMember(8));
      }
    }
    var array = result[3];
    var byrefVariants = array.getArrayInstance();

    var retVal = [1 + byrefVariants.length];
    retVal[0] = result[0];

    var aux = byrefVariants.slice(0, byrefVariants.length);
    var aux_i = 1;
    while (aux.length > 0)
      retVal.splice(aux_i++, 0, aux.shift());

    return retVal;
  }

  put(dispId, inparams, isRef){
    // lack of function overload - begin
    if (dispId instanceof String) {
      dispId = this.getIDsOfName(dispId);
    }

    inparams = (imparams instanceof Array) ? [inparams] : inparams;
    isRef = (isRef == undefined) ? false : isRef;
    // lack of function overload - end

    var propertyFlag = isRef ? Dispatch.DISPATCHPROPERTYPUTREF : Dispatch.DISPATCH_PROPERTYPUT;
    var objectParams = inparams;
    if (objectParams == null) {
      objectParams = [0];
    }

    var variants = [objectParams.length];
    var variant = null;
    for var obj = (var i = 0; i < objectParams.length; i++) {
      if (!(obj instanceof Variant)) {

      }
      var variant = null;
      var obj = objectParams[i];
      if (!(obj instanceof Variant)) {
        if (obj instanceof IArray) {
          variant = new Variant(obj.isRef);
        } else {
          varian = Variant.makeVariant(obj, isRef);
        }
      } else {
        variant = obj;
      }
      variants[i] = variant;
    }
    this.invoke(dispId, propertyFlag, new IArray(variants, true),
      new Array([this.DISPATCH_DISPID_PUTPUTREF], true), null);
  };

  putRef(dispId, inparam){
    var parameter = true;
    if (dispId instanceof String) {
      this.put(dispId,inparam);
    }else{
      this.put(dispId, inparam, parameter);
    }
  }

  get(dispId, inparams);
  {
    if (dispId instanceof String) {
      dispId = this.getIDsOfName(name);
    }

    if (inparams == undefined) {
      return this.invoke(dispId, this.DISPATCH_PROPERTYGET, null, null, null)[0];
    } else {
      return callMethodA(dispId, inparams, this.DISPATCH_PROPERTYGET);
    }
  }

  callMethod(name);
  callMethod(dispId);
  callMethod(name, inparams);
  callMethod(dispId, inparams);
  callMethod(name, inparams, dispIds);
  callMethod(dispId, inparams, dispIds);
  callMethod(dispId, inparams, dispIds);
  callMethod(name, inparams, paramNames);


  callMethodA(name);
  callMethodA(dispId);
  callMethodA(name, inparams);
  callMethodA(dispId, insparams, FLAG);
  callMethodA(name, inparams, dispIds);
  callMethodA(dispId, inparams, dispIds);
  callMethodA(name, inparams, paramNames);
}
