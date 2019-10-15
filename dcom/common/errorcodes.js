class ErrorCodes{
  constructor(){
    this.ERROR_INVALID_FUNCTION = 0x00000001;

    this.ERROR_FILE_NOT_FOUND = 0x00000002;

    this.ERROR_PATH_NOT_FOUND = 0x00000003;

    this.ERROR_INVALID_NAME =0x0000007B;

    this.ERROR_ALREADY_EXISTS = 0x000000B7;

    this.ERROR_NO_MORE_ITEMS = 0x00000103;

    // class not registered
    this.REGDB_E_CLASSNOTREG = 0x80040154;

    // interface not registered
    this.REGDB_E_IIDNOTREG = 0x80040155;

    this.ERROR_ACCESS_DENIED = 0x00000005;

    // catastrophic failure
    this.E_UNEXPECTED = 0x8000FFFF;

    // not implemented
    this.E_NOTIMPL = 0x80004001;

    this.E_OUTOFMEMORY = 0x8007000E;

    // parameter incorrect
    this.E_INVALIDARG = 0x80070057;

    this.RPC_SERVER_UNAVAILABLE = 0x800706BA;

    // no interface supported
    this.E_NOINTERFACE = 0x80004002;

    this.E_ACCESSDENIED = 0x80070005;

    // remote activation was necessary but server name provided was invalid
    this.CO_E_BAD_SERVER_NAME = 0x80004014;

    // server process could not be started
    this.CO_E_CREATEPROCESS_FAILURE = 0x80004018;

    // server proccess could not be started with the current config
    this.CO_E_RUNAS_CREATEPROCESS_FAILURE = 0x80004019;

    // configured identify incorrect
    this.CO_E_RUNAS_LOGON_FAILURE = 0x8000401A;

    //The client is not allowed to launch this server.
    this.CO_E_LAUNCH_PERMSSION_DENIED = 0x8000401B;

    //Server execution failed.
    this.CO_E_SERVER_EXEC_FAILURE = 0x80080005;

    // System call failed. You might need to restart the server machine.
    this.RPC_E_SYS_CALL_FAILED = 0x80010100;

    // Unknown interface.
    this.DISP_E_UNKNOWNINTERFACE = 0x80020001;

    // Member not found.
    this.DISP_E_MEMBERNOTFOUND = 0x80020003;

    // Parameter not found.
    this.DISP_E_PARAMNOTFOUND = 0x80020004;

    // Type mismatch.
    this.DISP_E_TYPEMISMATCH = 0x80020005;

    // No named arguments.
    this.DISP_E_NONAMEDARGS = 0x80020007;

    // Bad variable type.
    this.DISP_E_BADVARTYPE = 0x80020008;

    // Exception occurred.
    this.DISP_E_EXCEPTION = 0x80020009;

    // Invalid index.
    this.DISP_E_BADINDEX = 0x8002000B;

    // Invalid number of parameters.
    this.DISP_E_BADPARAMCOUNT = 0x8002000E;

    // Parameter not optional.

    this.DISP_E_PARAMNOTOPTIONAL = 0x8002000F;

    // The requested object or interface does not exist.
    this.RPC_E_INVALID_IPID = 0x80010113;

    // The requested object does not exist.
    this.RPC_E_INVALID_OBJECT = 0x80010114;

    // The marshaled interface data packet (OBJREF) has an invalid or unknown format.
    this.RPC_E_INVALID_OBJREF = 0x8001011D;

    // An internal error occurred.
    this.RPC_E_UNEXPECTED = 0x8001FFFF;

    // Call was rejected by callee.
    this.RPC_E_CALL_REJECTED = 0x80010001;

    // Unknown name.
    this.DISP_E_UNKNOWNNAME = 0x80020006;

    // Wrong module kind for the operation.
    this.TYPE_E_BADMODULEKIND  = 0x800288BD;

    // Element not found.
    this.TYPE_E_ELEMENTNOTFOUND  = 0x8002802B;

    // COM server could not establish call back connection.
    this.E_NOINTERFACE_CALLBACK = 0x80040202;

    // The object exporter was not found.
    this.RPC_E_INVALID_OXID = 0x80070776;

    // The stub recieved bad data. . Please check whether the API has been called in the right way, with correct parameter formation.
    this.RPC_E_INVALID_DATA = 0x800706F7;

    // The procedure number is out of range.
    this.RPC_S_PROCNUM_OUT_OF_RANGE2 = 0x800706D1;

    // The procedure number is out of range.
    this.RPC_S_PROCNUM_OUT_OF_RANGE = 0xC002002E;

    // Access Violation.
    this.RPC_S_ACCESS_VIOLATION = 0xC0000005;

    // The server threw an exception.
    this.RPC_E_SERVERFAULT  = 0x80010105;

    // Invalid Callee.
    this.DISP_E_BADCALLEE = 0x80020010;

    //  The object invoked has disconnected from its clients.
    this.RPC_E_DISCONNECTED = 0x80010108;

    // The version of OLE on the client and server machines does not match.
    this.RPC_E_VERSION_MISMATCH = 0x80010110;

    // Space for tools is not available.
    this.INPLACE_E_NOTOOLSPACE  = 0x800401A1;

    // The attempted logon is invalid. This is either due to a bad username or authentication information.
    this.WIN_AUTH_FAILURE  = 0xC000006D;

    // Unspecified Error.
    this.E_FAIL = 0x80004005;

    /////System's Own ...start from 0x00001001 to 0x00002001

    // Object is already instantiated.
    this.OBJECT_ALREADY_INSTANTIATED = 0x00001001;

    // This API cannot be invoked right now, further operations are required before the system is ready to
    // give out results through this API.
    this.API_INCORRECTLY_CALLED = 0x00001002;

    // Session is already established, please initiate a new session for new Stub.
    this.SESSION_ALREADY_ESTABLISHED= 0x00001003;

    // Discriminant cannot be null
    this.UNION_NULL_DISCRMINANT = 0x00001004;

    // Discriminant class type mismatch, please provide object of the same class as discriminant.
    this.UNION_DISCRMINANT_MISMATCH = 0x00001005;

    // Only 1 discriminant allowed for serialization, please remove the rest or no discriminant has been added at all.
    this.UNION_DISCRMINANT_SERIALIZATION_ERROR = 0x00001006;

    // No discriminant value has been added at all.
    this.UNION_DISCRMINANT_DESERIALIZATION_ERROR = 0x00001007;

    // Incorrect Value of FLAG sent for this API. This FLAG is not valid here.
    this.UTIL_FLAG_ERROR = 0x00001008;

    // Internal Library Error. This method should not have been called. Please check the parameters which you have passed to CallBuilder.
    // They have been sent incorrectly.
    this.UTIL_INCORRECT_CALL = 0x00001009;

    // Outparams cannot have more than 1 parameter here. It should be a Variant class parameter.
    this.DISP_INCORRECT_OUTPARAM = 0x0000100A;

    // Parameters inparams and dispId\paramNames arrays should have same length.
    this.DISP_INCORRECT_PARAM_LENGTH = 0x0000100B;

    // This in parameter cannot have null or "" values.
    this.DISP_INCORRECT_VALUE_FOR_GETIDNAMES = 0x0000100C;

    // progId\clsid,address,session cannot be empty or null.
    this.COMSTUB_ILLEGAL_ARGUMENTS = 0x0000100D;

    // Could not retrieve Clsid from ProgId via Windows Remote Registry Service
    this.COMSTUB_RR_ERROR = 0x0000100E;

    // Internal Library Error, the serializer\deserializer was not found for {0}. Please check the parameters passed to CallBuilder.
    this.UTIL_SERDESER_NOT_FOUND = 0x0000100F;

    // Authentication information was not supplied.
    this.AUTH_NOT_SUPPLIED = 0x00001010;

    // Incorrect or Invalid Parameter(s) specified.
    this.COMFACTORY_ILLEGAL_ARG = 0x00001011;

    // The template cannot be null.
    this.ARRAY_TEMPLATE_NULL = 0x00001012;

    // Only Arrays Accepted as parameter.
    this.ARRAY_PARAM_ONLY = 0x00001013;

    // Arrays of Primitive Data Types are not accepted
    this.ARRAY_PRIMITIVE_NOTACCEPT = 0x00001014;

    // Can only accept Struct, Union, Pointer and String as parameters for template.
    this.ARRAY_INCORRECT_TEMPLATE_PARAM = 0x00001015;

    // IPID cannot be null.
    this.OBJ_NULL_IPID = 0x00001016;

    // Discriminant can only be of the type Integer,Short,Boolean or Character.
    this.UNION_INCORRECT_DISC = 0x00001017;

    // Referent ID for <code>VARIANT</code> not found.
    this.VARIANT_NO_REFERENT_ID = 0x00001018;

    // This is a programming error, this API should not be called.
    this.ILLEGAL_CALL = 0x00001019;

    // The parameters cannot be null.
    this.COM_RUNTIME_INVALID_CONTAINER_INFO = 0x0000101A;

    // An array has already been added as member and it has to be the last member of this Struct. Please insert this member elsewhere.
    this.STRUCT_ARRAY_AT_END = 0x0000101B;

    // An array can be added only as a last member in a structure and not inbetween.
    this.STRUCT_ARRAY_ONLY_AT_END = 0x0000101C;

    // This struct already has an array and the member (which also happens to be a Struct) has an array too. This member can only be present in the second last position of this new Struct.
    this.STRUCT_INCORRECT_NESTED_STRUCT_POS = 0x0000101D;

    // Member(which happens to be a Struct) has an array and hence can only be added to the end of this Struct , not in between.
    this.STRUCT_INCORRECT_NESTED_STRUCT_POS2 = 0x0000101E;

    // Authentication failure for the credentials sent by the COM server for performing call back. The identity is checked via a call back to the source COM server using SMB.
    this.CALLBACK_AUTH_FAILURE = 0x0000101F;

    // SMB connection failure, please check whether SERVER service is running on Target machine (where COM server) is hosted.
    this.CALLBACK_SMB_FAILURE = 0x00001020;

    // Illegal here to invoke this API.
    this.CALLBACK_COMOBJECT_STATE_FAILURE = 0x00001021;

    // Variants can only take BSTR Strings and no other String Type.
    this.VARIANT_BSTR_ONLY = 0x00001022;

    // Overloaded APIs are not allowed.
    this.CALLBACK_OVERLOADS_NOTALLOWED = 0x00001023;

    // Variants cannot take object[] having Variants themselves as indices.
    this.VARIANT_VARARRAYS_NOTALLOWED = 0x00001024;

    // fractionalUnits cannot be negative.
    this.CURRENCY_FRAC_NEGATIVE = 0x00001025;

    // Variant is null.
    this.VARIANT_IS_NULL = 0x00001026;

    // Library currently accepts only upto 2 dimension for the Variant
    this.VARIANT_VARARRAYS_2DIMRES = 0x00001027;

    // The upperbounds is to be specified for all dimensions or not specified at all.
    this.ARRAY_UPPERBNDS_DIM_NOTMATCH = 0x00001028;

    // Please use the Array to pass arrays.
    this.VARIANT_ONLY_ARRAY_EXCEPTED = 0x00001029;

    // Unsupported type for VARIANT.
    this.VARIANT_UNSUPPORTED_TYPE = 0x00001030;

    // Unable to access Windows Registry, please check whether the SERVER service is running on the Target Workstation.
    this.WINREG_EXCEPTION = 0x00001031;

    // Invalid Identifier, or there is no Connection Info associated with this identifer on this comObject.
    this.CALLBACK_INVALID_ID = 0x00001032;

    // Could not set the correct encoding for password field.
    this.WINREG_EXCEPTION2 = 0x00001033;

    // Unknown hostname\ip was supplied for obtaining handle to WinReg
    this.WINREG_EXCEPTION3 = 0x00001034;

    // Type not supported for setting\getting value in\from registry.
    this.WINREG_EXCEPTION4 = 0x00001035;

    // Illegal values sent as parameters, please check "data".
    this.WINREG_EXCEPTION5 = 0x00001036;

    // LocalMethodDescriptor is being added to a LocalInterfaceDefinition supporting dispInterface, but it itself does not have a
    // dispId.
    this.METHODDESC_DISPID_MISSING = 0x00001037;

    // No parameters can be null or "".
    this.CALLBACK_INVALID_PARAMS = 0x00001038;

    // Unsupported charset supplied while encoding or decoding String.
    this.UTIL_STRING_DECODE_CHARSET = 0x00001039;

    // Unsigned numbers cannot be negative or null.
    this.UNSIGNED_NEGATIVE = 0x00001040;

    // Class not supportted for unsigned operations. Only Long,Short,Integer allowed.
    this.UNSIGNED_INCORRECT_TYPE = 0x00001041;

    // "Object.class" arrays are not accepted. Only properly typed arrays accepted.
    this.ARRAY_TYPE_INCORRECT = 0x00001042;

    // This LocalCoClass has already been exported with one interface pointer, please use a new instance of this class with InterfacePointer.getInterfacePointer(...) api.
    this.JAVACOCLASS_ALREADY_EXPORTED = 0x00001043;

    // InterfacePointer is not a valid parameter, please use Variant(IComObject,...).
    this.VARIANT_TYPE_INCORRECT = 0x00001044;

    // Direct Marshalling, UnMarshalling of Strings are not allowed, please use String instead.
    this.UTIL_STRING_INVALID = 0x00001045;

    // createInstance() cannot be called since the ComServer(Session, InterfacePointer, String) ctor was used to create this COM server instance, please use getInstance() instead.
    this.COMSTUB_WRONGCALLCREATEINSTANCE = 0x00001046;

    // getInstance() cannot be called since the ComServer(Session, InterfacePointer, String) ctor was NOT used to create this COM server instance, please use createInstance() instead.
    this.COMSTUB_WRONGCALLGETINSTANCE = 0x00001047;

    // A session is already attached with this COM object.
    this.SESSION_ALREADY_ATTACHED = 0x00001048;

    // This API cannot be invoked on local references.
    this.COMOBJ_LOCAL_REF = 0x00001049;

    // A session is not attached with this object , use ObjectFactory.buildObject(Session, IComObject) to attach a session with this object.
    this.SESSION_NOT_ATTACHED = 0x00001050;

    // The associated session is being destroyed. Current call to COM server has been terminated.
    this.SESSION_DESTROYED = 0x00001051;

    // The associated session is being destroyed. Current call to COM server has been terminated.
    this.WIN_ONLY = 0x00001052;

    // S.S.O cannot be used with ProgId based ctors.
    this.COMSTUB_ILLEGAL_ARGUMENTS2 = 0x00001053;
  }
}

module.exports = ErrorCodes;
