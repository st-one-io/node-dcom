// @ts-check
const NdrObject = require('../ndr/ndrobject.js');
let initted = false;
let UUID;
let MarshalUnMarshalHelper;
let Flags;
let OrpcThis;
let OrpcThat;
let Session;
let ComServer;
let FrameworkHelper;
let ComVersion;
let ErrorCodes;
let NetworkDataRepresentation;

let ComArray;
let ComObject;
let ComString;
let Pointer;
let Struct;
let Variant;

let types;
let ComValue;

const CURRENTSESSION = 'CURRENTSESSION';
const COMOBJECTS = 'COMOBJECTS';

/**
 * The CallBuilder object is responsible for the creatin of objects and
 * connectionsneeded for DCERPC requests on specific addresses.
 */
class CallBuilder extends NdrObject {
  /**
  * Constructs a builder object.
  *
  * @param {boolean} dispatchNotSupported
  */
  constructor(dispatchNotSupported) {
    super();
    this._init();
    this.opnum = -1; // int
    this.results = null; // Object[]
    this.dispatchNotSupported = dispatchNotSupported || false; // boolean
    this.enclosingParentsIPID = null; // String
    this.inparamFlags = []; // ArrayList
    this.outparamFlags = []; // ArrayList
    /** @type {ComValue[]} */
    this.inParams = [];
    /** @type {ComValue[]} */
    this.outParams = []; // ArrayList
    this.hresult = 0; // int
    this.executed = false; // boolean
    this.resultsOfException = null; // Object[]
    this.session = null; // Session
    this.fromDestroySession = dispatchNotSupported || false; // fromDestroySession
    this.readOnlyHRESULT = false; // boolean
    this.splCOMVersion = false; // boolean
    this.serverAlive2 = null; // ComVersion
  }

  /**
  * requires all libs
  */
  _init() {
    if (initted) return;
    UUID = require('../rpc/core/uuid.js');
    MarshalUnMarshalHelper = require('./marshalunmarshalhelper.js');
    Flags = require('./flags.js');
    OrpcThis = require('./orpcthis');
    OrpcThat = require('./orpcthat');
    Session = require('./session');
    ComServer = require('./comserver');
    FrameworkHelper = require('./frameworkhelper');
    ComVersion = require('../common/comversion');
    ErrorCodes = require('../common/errorcodes.js');
    NetworkDataRepresentation = require('../ndr/networkdatarepresentation');

    ComArray = require('./comarray');
    ComObject = require('./comobject');
    ComString = require('./string');
    Pointer = require('./pointer');
    Struct = require('./struct');
    Variant = require('./variant');

    types = require('./types');
    ComValue = require('./comvalue');
    initted = true;
  }

  /**
  * Reinitializes all members of this object. It is ready to be used again on a
  * fresh <code>{@link IJIComObject#call}</code> after this step.
  *
  */
  reInit() {
    this.opnum = -1;
    this.inParams = [];
    this.inparamFlags = [];
    this.outParams = [];
    this.outparamFlags = [];
    this.hresult = -1;
    this.results = null;
    this.executed = false;
  }

  /**
     *
     * @param {string} IPIDofParent
     */
  setParentIpid(IPIDofParent) {
    this.enclosingParentsIPID = IPIDofParent;
  }

  /**
   * @return {String}
   */
  getParentIpid() {
    return this.enclosingParentsIPID;
  }

  /**
  * Add <code>[in]</code> parameter as <code>ComObject</code> at the end of the Parameter list.
  * @param {ComObject} comObject
  * @param {number} flags
  */
  addInParamAsComObject(comObject, flags) {
    this.insertInParamAsComObjectAt(this.inParams.length, comObject, flags);
  }

  /**
  * Add <code>[in]</code> parameter as <code>int</code> at the end of the Parameter list.
  * @param {number} value
  * @param {number} flags
  */
  addInParamAsInt(value, flags) {
    this.insertInParamAsIntAt(this.inParams.length, value, flags);
  }

  /** Add <code>[in]</code> parameter as <code>Unsigned</code> at the end of the Parameter list.
  *
  * @param {number} value
  * @param {number} flags from Flags (if need be)
  */
  addInParamAsUnsigned(value, flags) {
    this.insertInParamAsUnsignedAt(this.inParams.length, value, flags);
  }

  /** Add <code>[in]</code> parameter as <code>float</code> at the end of the Parameter list.
  *
  * @param {number} value
  * @param {number} flags from Flags (if need be)
  */
  addInParamAsFloat(value, flags) {
    this.insertInParamAsFloatAt(this.inParams.length, value, flags);
  }

  /** Add <code>[in]</code> parameter as <code>boolean</code> at the end of the Parameter list.
  *
  * @param {boolean} value
  * @param {number} flags from Flags (if need be)
  */
  addInParamAsBoolean(value, flags) {
    this.insertInParamAsBooleanAt(this.inParams.length, value, flags);
  }

  /** Add <code>[in]</code> parameter as <code>short</code> at the end of the Parameter list.
  *
  * @param {number} value
  * @param {number} flags from Flags (if need be)
  */
  addInParamAsShort(value, flags) {
    this.insertInParamAsShortAt(this.inParams.length, value, flags);
  }

  /** Add <code>[in]</code> parameter as <code>double</code> at the end of the Parameter list.
  *
  * @param {number} value
  * @param {number} flags from Flags (if need be)
  */
  addInParamAsDouble(value, flags) {
    this.insertInParamAsDoubleAt(this.inParams.length, value, flags);
  }

  /** Add <code>[in]</code> parameter as <code>char</code> at the end of the Parameter list.
  *
  * @param {string} value
  * @param {number} flags from Flags (if need be)
  */
  addInParamAsCharacter(value, flags) {
    this.insertInParamAsCharacterAt(this.inParams.length, value, flags);
  }

  /** Add <code>[in]</code> parameter as <code>String</code> at the end of the Parameter list.
  *
  * @param {string} value
  * @param {number} flags from Flags (These <i>HAVE</i> to be the <b>String</b> Flags).
  */
  addInParamAsString(value, flags) {
    this.insertInParamAsStringAt(this.inParams.length, value, flags);
  }

  /**
  *
  * @param {Variant} value
  * @param {number} flags from Flags (if need be).
  */
  addInParamAsVariant(value, flags) {
    this.insertInParamAsVariantAt(this.inParams.length, value, flags);
  }

  /**
  *
  * @param {object} value
  * @param {number} flags from Flags (if need be).
  */
  addInParamAsObject(value, flags) {
    this.insertInParamAsObjectAt(this.inParams.length, value, flags);
  }

  /**
  *
  * @param {string} value
  * @param {number} flags from Flags (if need be).
  */
  addInParamAsUUID(value, flags) {
    this.insertInParamAsUUIDAt(this.inParams.length, value, flags);
  }

  /**
  *
  * @param {Pointer} value
  * @param {number} flags from Flags (if need be).
  */
  addInParamAsPointer(value, flags) {
    this.insertInParamAsPointerAt(this.inParams.length, value, flags);
  }

  /**
  *
  * @param {Struct} value
  * @param {number} flags from Flags (if need be).
  */
  addInParamAsStruct(value, flags) {
    this.insertInParamAsStructAt(this.inParams.length, value, flags);
  }

  /**
  *
  * @param {ComArray} value
  * @param {number} flags from Flags (if need be).
  */
  addInParamAsArray(value, flags) {
    this.insertInParamAsArrayAt(this.inParams.length, value, flags);
  }

  /**
  *
  * @param {ComValue[]} values
  * @param {number} flags from Flags (if need be).
  */
  setInParams(values, flags) {
    for (const value of values) {
      this.inParams.push(value);
      this.inparamFlags.push(flags);
    }
  }

  /** 
  *
  * @param {number} index 0 based index
  * @param {ComObject} value
  * @param {number} flags from Flags (if need be).
  */
  insertInParamAsComObjectAt(index, value, flags) {
    this.inParams[index] = new ComValue(value, types.COMOBJECT);
    this.inparamFlags[index] = flags;
  }

  /** 
  *
  * @param {number} index 0 based index
  * @param {number} value
  * @param {number} flags from Flags (if need be).
  */
  insertInParamAsIntAt(index, value, flags) {
    this.inParams[index] = new ComValue(value, types.INTEGER);
    this.inparamFlags[index] = flags;
  }

  /** 
  *
  * @param {number} index 0 based index
  * @param {number} value
  * @param {number} flags from Flags (if need be).
  */
  insertInParamAsUnsignedAt(index, value, flags) {
    this.inParams[index] = new ComValue(value, types.UNSIGNEDINTEGER);
    this.inparamFlags[index] = flags;
  }

  /** Add <code>[in]</code> parameter as <code>float</code> at the specified index in the Parameter list.
  *
  * @param {number} index 0 based index
  * @param {number} value
  * @param {number} flags from Flags (if need be).
  */
  insertInParamAsFloatAt(index, value, flags) {
    this.inParams[index] = new ComValue(value, types.FLOAT);
    this.inparamFlags[index] = flags;
  }

  /** Add <code>[in]</code> parameter as <code>boolean</code> at the specified index in the Parameter list.
  *
  * @param {number} index 0 based index
  * @param {boolean} value
  * @param {number} flags from Flags (if need be).
  */
  insertInParamAsBooleanAt(index, value, flags) {
    this.inParams[index] = new ComValue(value, types.BOOLEAN);
    this.inparamFlags[index] = flags;
  }

  /** Add <code>[in]</code> parameter as <code>short</code> at the specified index in the Parameter list.
  *
  * @param {number} index 0 based index
  * @param {number} value
  * @param {number} flags from Flags (if need be).
  */
  insertInParamAsShortAt(index, value, flags) {
    this.inParams[index] = new ComValue(value, types.SHORT);
    this.inparamFlags[index] = flags;
  }

  /** Add <code>[in]</code> parameter as <code>double</code> at the specified index in the Parameter list.
  *
  * @param {number} index 0 based index
  * @param {number} value
  * @param {number} flags from Flags (if need be).
  */
  insertInParamAsDoubleAt(index, value, flags) {
    this.inParams[index] = new ComValue(value, types.DOUBLE);
    this.inparamFlags[index] = flags;
  }

  /** Add <code>[in]</code> parameter as <code>char</code> at the specified index in the Parameter list.
  *
  * @param {number} index 0 based index
  * @param {string} value
  * @param {number} flags from Flags (if need be).
  */
  insertInParamAsCharacterAt(index, value, flags) {
    this.inParams[index] = new ComValue(value, types.CHARACTER);
    this.inparamFlags[index] = flags;
  }

  /** Add <code>[in]</code> parameter as <code>String</code>  at the specified index in the Parameter list.
  *
  * @param {number} index 0 based index
  * @param {string} value
  * @param {number} flags from Flags (These <i>HAVE</i> to be the <b>String</b> Flags).
  */
  insertInParamAsStringAt(index, value, flags) {
    this.inParams[index] = new ComValue(new ComString(value, flags), types.COMSTRING);
    this.inparamFlags[index] = Flags.FLAG_NULL;
  }

  /** Add <code>[in]</code> parameter as <code>Variant</code> at the specified index in the Parameter list.
  *
  * @param {number} index 0 based index
  * @param {Variant} value
  * @param {number} flags from Flags (if need be).
  */
  insertInParamAsVariantAt(index, value, flags) {
    this.inParams[index] = new ComValue(value, types.VARIANT);
    this.inparamFlags[index] = Flags.FLAG_NULL;
  }

  /** Add <code>[in]</code> parameter as <code>Object</code> at the specified index in the Parameter list.
  *
  * @param {number} index 0 based index
  * @param {ComValue} value
  * @param {number} flags from Flags (if need be).
  */
  insertInParamAsObjectAt(index, value, flags) {
    this.inParams[index] = value;
    this.inparamFlags[index] = flags;
  }

  /** Add <code>[in]</code> parameter as <code>String representation of UUID</code> at the specified index in the Parameter list.
  *
  * @param {number} index 0 based index
  * @param {string} value
  * @param {number} flags from Flags (if need be).
  */
  insertInParamAsUUIDAt(index, value, flags) {
    this.inParams[index] = new ComValue(new UUID(value), types.UUID);
    this.inparamFlags[index] = flags;
  }

  /**
  *
  * @param {number} index 0 based index
  * @param {Pointer} value
  * @param {number} flags from Flags (if need be).
  */
  insertInParamAsPointerAt(index, value, flags) {
    this.inParams[index] = new ComValue(value, types.POINTER);
    this.inparamFlags[index] = flags;
  }

  /**
  *
  * @param {number} index 0 based index
  * @param {Struct} value
  * @param {number} flags from Flags (if need be).
  */
  insertInParamAsStructAt(index, value, flags) {
    this.inParams[index] = new ComValue(value, types.STRUCT);
    this.inparamFlags[index] = flags;
  }

  /**
  *
  * @param {number} index 0 based index
  * @param {ComArray} value
  * @param {number} flags from Flags (if need be).
  */
  insertInParamAsArrayAt(index, value, flags) {
    this.inParams[index] = new ComValue(value, types.COMARRAY);
    this.inparamFlags[index] = flags;
  }

  /** Removes <code>[in]</code> parameter at the specified index from the Parameter list.
  *
  * @param {number} index 0 based index
  */
  removeInParamAt(index) {
    this.inParams.splice(index, 1);
    this.inparamFlags.splice(index, 1);
  }

  /**
  *
  * @param {number} index 0 based index
  * @return {ComValue} Primitives are returned as there Derieved types.
  */
  getInParamAt(index) {
    return this.inParams[index];
  }

  /**
  *
  * @param {number} clazz Class
  * @param {number} flags
  */
  addOutParamAsType(clazz, flags) {
    this.insertOutParamAt(this.outParams.length, new ComValue(null, clazz), flags);
  }

  /**
  *
  * @param {ComValue} outparam
  * @param {number} flags
  */
  addOutParamAsObject(outparam, flags) {
    this.insertOutParamAt(this.outParams.length, outparam, flags);
  }

  /**
  *
  * @param {number} index 0 based index
  * @param {ComValue} classOrInstance can be either a Class or an Object
  * @param {number} flags
  */
  insertOutParamAt(index, classOrInstance, flags) {
    this.outParams[index] = classOrInstance;
    this.outparamFlags[index] = flags;
  }

  /**
  *
  * @param {number} index 0 based index
  * @returns {ComValue}
  */
  getOutParamAt(index) {
    return this.outParams[index];
  }

  /**
  *
  * @param {number} index 0 based index
  */
  removeOutParamAt(index) {
    this.outParams.splice(index, 1);
    this.outparamFlags.splice(index, 1);
  }

  /**
  *
  * @param {ComValue[]} values
  * @param {number} flags from Flags (if need be).
  */
  setOutParams(values, flags) {
    for (const value of values) {
      this.outParams.push(value);
      this.outparamFlags.push(flags);
    }
  }

  // now for the results

  /**
  * @return {Array}
  */
  getResults() {
    // this.checkIfCalled();
    return this.outParams;
  }

  /**
   *
   * @param {Number} index
   * @return {Number}
   */
  getResultAt(index) {
    this.checkIfCalled();
    return this.results[index]; // don't do any type check
  }


  /** Returns the results incase an exception occured.
  *
  * @return {Array}
  */
  getResultsInCaseOfException() {
    return this.resultsOfException;
  }

  /**
  *
  * @return {Number}
  */
  getHRESULT() {
    return this.hresult;
  }

  /**
   * Throw an error if something is called in an unexpected way.
   */
  checkIfCalled() {
    if (!this.executed) {
      throw new Error('API Incorrectly called');
    }
  }

  /**
  *
  * @return {Array}
  */
  getInParams() {
    return this.inParams.slice(); // slicing to return a copy, not the original
  }

  /**
  *
  * @return {Array}
  */
  getOutParams() {
    return this.outParams.slice(); // slicing to return a copy, not the original
  }

  /**
  *
  * @return {Array}
  */
  getInparamFlags() {
    return this.inparamFlags.slice(); // slicing to return a copy, not the original
  }

  /**
  *
  * @return {Array}
  */
  getOutparamFlags() {
    return this.outparamFlags.slice(); // slicing to return a copy, not the original
  }

  /**
  * @return {Number}
  */
  getOpnum() {
    // opnum is 3 as this is a COM interface and 0,1,2 are occupied by IUnknown
    // TODO remember this for extending com components also.
    return this.opnum;
  }

  /**
  * Sets the opnum of the API which will be invoked at the COM server.
  * @param {Number} num
  */
  setOpnum(num) {
    let dispatch = 0;
    if (!this.dispatchNotSupported) {
      dispatch = 4; // 4 apis.
    }
    this.opnum = dispatch + num + 3; // 0,1,2, Q.I
  }

  /**
  *
  * @param {NetworkDataRepresentation} ndr
  */
  write2(ndr) {
    // reset buffer size here...
    // calculate rough length required length + 16 for the last bytes
    // plus adding 30 more for the verifier etc.
    ndr.getBuffer().buf = Buffer.alloc(this.bufferLength() + 16 + 30);
    OrpcThat.encode(ndr);
    this.writePacket(ndr);
  }

  /**
  *
  * @param {NetworkDataRepresentation} ndr
  */
  write(ndr) {
    // reset buffer size here...
    // calculate rough length required length + 16 for the last bytes
    // plus adding 30 more for the verifier etc.
    ndr.getBuffer().buf = new Array(this.bufferLength() + 16);

    let orpcthis = new OrpcThis();
    orpcthis.encode(ndr);

    this.writePacket(ndr);

    // when it ends add 16 zeros.
    ndr.writeUnsignedLong(0);
    ndr.writeUnsignedLong(0);
    ndr.writeUnsignedLong(0);
    ndr.writeUnsignedLong(0);
  }

  /**
  *
  * @param {NetworkDataRepresentation} ndr
  */
  writePacket(ndr) {
    if (this.session == null) {
      throw new Error('Programming Error ! Session not attached with this call ! ... Please rectify ! ');
    }

    let inparams = this.inParams;
    let comValueZero = new ComValue(0, types.INTEGER);
    let index = 0;
    if (this.inParams != null) {
      while (index < this.inParams.length) {
        let listOfDefferedPointers = [];
        if (this.inParams[index] === null || this.inParams[index] === undefined) {
          MarshalUnMarshalHelper.serialize(ndr, comValueZero, listOfDefferedPointers, Flags.FLAG_NULL);
        } else {
          MarshalUnMarshalHelper.serialize(ndr, this.inParams[index], listOfDefferedPointers, this.inparamFlags[index]);
        }

        let x = 0;

        while (x < listOfDefferedPointers.length) {
          let newList = [];
			MarshalUnMarshalHelper.serialize(ndr, new ComValue(listOfDefferedPointers[x],
					types.POINTER), newList, this.inparamFlags[index]);
          x++; // incrementing index
          listOfDefferedPointers.splice(x, 0, ...newList);
        }
        index++;
      }
    }
  }

  /**
  * @exclude
  * @param {NetworkDataRepresentation} ndr
  */
  async read(ndr) {
    // interpret based on the out params flags
    if (!this.readOnlyHRESULT) {
      if (this.splCOMVersion) {
        // during handshake and no other time. Kept for OxidResolver methods.
        this.serverAlive2 = new ComVersion(ndr.readUnsignedShort(), ndr.readUnsignedShort());
        let dualStringPtr = new ComValue(new Pointer(new ComValue(null, types.DUALSTRINGARRAY)), types.POINTER);
        new Pointer(dualStringPtr).decode(ndr, [], Flags.FLAG_NULL, new Map());
        ndr.readUnsignedLong();
      } else {
        let orpcThat = OrpcThat.decode(ndr);
        let fromCallback = false;
        if (this.session == null) {
          throw new Error('Programming Error ! Session not attached with this call ! ... Please rectify ! ');
        }

        let index = 0;
        let outparams = this.outParams;
        let comObjects = [];
        let additionalData = new Map();

        additionalData.set(CURRENTSESSION, this.session);
        additionalData.set(COMOBJECTS, comObjects);

        let results = [];
        // user has nothing to return.
        if (outparams != null && outparams.length > 0) {

          while (index < outparams.length) {
            let listOfDefferedPointers = [];
            results.push(MarshalUnMarshalHelper.deSerialize(ndr, outparams[index], listOfDefferedPointers, this.outparamFlags[index], additionalData));
            let x = 0;

            while (x < listOfDefferedPointers.length) {
              let newList = [];
              let replacement = MarshalUnMarshalHelper.deSerialize(ndr, new ComValue(listOfDefferedPointers[x], types.POINTER), newList, this.outparamFlags[index], additionalData);
              listOfDefferedPointers[x].replaceSelfWithNewPointer(replacement); // this should replace the value in the original place.
              x++;
              listOfDefferedPointers.splice(x, 0, ...newList);
            }
            index++;
          }


          // now create the right COM Objects, it is required here only and no place else.
          for (let i = 0; i < comObjects.length; i++) {

            let comObjectImpl = comObjects[i];
            let comObject = null;
            if (fromCallback) {
              // this is a new IP , so make a new JIComServer for this.
              let newsession = Session.createSession(this.session);
              newsession.setGlobalSocketTimeout(this.session.getGlobalSocketTimeout());
              newsession.useSessionSecurity(this.session.isSessionSecurityEnabled());
              newsession.useNTLMv2(this.session.isNTLMv2Enabled());
              let comServer = new ComServer(newsession, comObjectImpl.internal_getInterfacePointer(), null);
              comObject = comServer.getInstance();
              Session.linkTwoSessions(this.session, newsession);
            } else {
              if (comObjectImpl.internal_getInterfacePointer().isCustomObjRef()) {
                continue;
              }
              comObject = FrameworkHelper.instantiateComObject2(this.session, comObjectImpl.internal_getInterfacePointer());
            }

            comObjectImpl.replaceMember(comObject);
            FrameworkHelper.addComObjectToSession(comObjectImpl.getAssociatedSession(), comObjectImpl);
            await comObjectImpl.addRef();
          }

          comObjects.length = 0;
        }

        this.outParams = results;
        this.results = results;
        this.executed = true;
      }
    }

    // last has to be the result.
    this.hresult = ndr.readUnsignedLong();
  }

  /**
  * called by only COMRuntime and NO ONE ELSE.
  *
  * @exclude
  *
  * @param {NetworkDataRepresentation} ndr
  */
  read2(ndr) {
    OrpcThis.decode(ndr);
    this.readPacket(ndr, true);
  }

  /**
  *
  * @param {NetworkDataRepresentation} ndr
  * @param {boolean} fromCallback
  */
  async readPacket(ndr, fromCallback) {

    if (this.session == null) {
      throw new Error('Programming Error ! Session not attached with this call ! ... Please rectify ! ');
    }

    let index = 0;
    let outparams = this.outParams;
    let comObjects = [];
    let additionalData = new Map();

    additionalData.set(CURRENTSESSION, this.session);
    additionalData.set(COMOBJECTS, comObjects);

    let results = [];
    // user has nothing to return.
    if (outparams != null && outparams.length > 0) {

      while (index < outparams.length) {
        let listOfDefferedPointers = [];
        results.push(MarshalUnMarshalHelper.deSerialize(ndr, outparams[index], listOfDefferedPointers, this.outparamFlags[index], additionalData));
        let x = 0;

        while (x < listOfDefferedPointers.length) {
          let newList = [];
          let replacement = MarshalUnMarshalHelper.deSerialize(ndr, new ComValue(listOfDefferedPointers[x], types.POINTER), newList, this.outparamFlags[index], additionalData);
          listOfDefferedPointers[x].replaceSelfWithNewPointer(replacement); // this should replace the value in the original place.
          x++;
          listOfDefferedPointers.splice(x, 0, ...newList);
        }
        index++;
      }


      // now create the right COM Objects, it is required here only and no place else.
      for (let i = 0; i < comObjects.length; i++) {

        let comObjectImpl = comObjects[i];
        let comObject = null;
        if (fromCallback) {
          // this is a new IP , so make a new JIComServer for this.
          let newsession = Session.createSession(this.session);
          newsession.setGlobalSocketTimeout(this.session.getGlobalSocketTimeout());
          newsession.useSessionSecurity(this.session.isSessionSecurityEnabled());
          newsession.useNTLMv2(this.session.isNTLMv2Enabled());
          let comServer = new ComServer(newsession, comObjectImpl.internal_getInterfacePointer(), null);
          comObject = comServer.getInstance();
          Session.linkTwoSessions(this.session, newsession);
        } else {
          if (comObjectImpl.internal_getInterfacePointer().isCustomObjRef()) {
            continue;
          }
          comObject = FrameworkHelper.instantiateComObject2(this.session, comObjectImpl.internal_getInterfacePointer());
        }

        comObjectImpl.replaceMember(comObject);
        FrameworkHelper.addComObjectToSession(comObjectImpl.getAssociatedSession(), comObjectImpl);
        await comObjectImpl.addRef();
      }

      comObjects.length = 0;
    }

    this.outParams = results;
    this.results = results;
    this.executed = true;
  }

  /**
  *
  * @param {NetworkDataRepresentation} ndr
  */
  readResult(ndr) {
    // last has to be the result.
    this.hresult = ndr.readUnsignedLong();

    if (this.hresult != 0) {
      // something exception occured at server, set up results
      this.resultsOfException = this.results;
      this.results = null;
      throw this.hresult;
    }
  }

  /**
  * @returns {number}
  */
  bufferLength() {
    let length = 0;
    let inparams = this.inParams;
    for (let i = 0; i < inparams.length; i++) {
      if (inparams[i] == null) {
        length = length + 4;
        continue;
      }
      let length2 = MarshalUnMarshalHelper.getLengthInBytes(inparams[i], Flags.FLAG_NULL);
      length = length + length2;
    }

    return length + 2048; // 2K extra for alignments, if any.
  }

  /** Returns true incase the Call resulted in an exception, use getHRESULT to get the error code.
  *
  * @return {boolean}
  */
  isError() {
    this.checkIfCalled();
    return this.hresult != 0;
  }

  /**
  *
  * @param {Session} session
  */
  attachSession(session) {
    this.session = session;
  }

  /**
  * @returns {Session}
  */
  getSession() {
    return this.session;
  }

  /**
   * Changes the ReadOnlyHRESULT flag to true
   */
  setReadOnlyHRESULT() {
    this.readOnlyHRESULT = true;
  }

  /**
  * sets the splCOM version flag to true
  */
  internal_COMVersion() {
    this.splCOMVersion = true;
  }

  /**
  * @return {ComVersion}
  */
  internal_getComVersion() {
    return this.serverAlive2;
  }
}

// emulate static members
CallBuilder.COMOBJECTS = COMOBJECTS;
CallBuilder.CURRENTSESSION = CURRENTSESSION;

module.exports = CallBuilder;