/* eslint-disable no-tabs */
/* eslint-disable indent */
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

const CURRENTSESSION = "CURRENTSESSION";
const COMOBJECTS = "COMOBJECTS";


/**
 * The CallBuilder object is responsible for
 * creating server calls from existing comObjects.
 */
class CallBuilder extends NdrObject {
    /**
     * Constructs a builder object.
	 * @param {Boolean} dispatchNotSupported
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
	 * Reinitializes all members of this object.
	 * After reinit, except parent, nothing is available.
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
     * Add in parameter as ComObject at the end of the Parameter list.
     * @param {ComObject} comObject
     * @param {number} flags
     */
	addInParamAsComObject(comObject, flags) {
		this.insertInParamAsComObjectAt(this.inParams.length, comObject, flags);
	}

    /**
     * Add in parameter as int at the end of the Parameter list.
     * @param {number} value
     * @param {number} flags
     */
	addInParamAsInt(value, flags) {
		this.insertInParamAsIntAt(this.inParams.length, value, flags);
	}

	/** Add in parameter as Unsigned at the end of the Parameter list.
	 *
	 * @param {number} value
	 * @param {number} flags from Flags (if need be)
	 */
	addInParamAsUnsigned(value, flags) {
		this.insertInParamAsUnsignedAt(this.inParams.length, value, flags);
	}

	/** Add in parameter as float at the end of the Parameter list.
	 *
	 * @param {number} value
	 * @param {number} flags from Flags (if need be)
	 */
	addInParamAsFloat(value, flags) {
		this.insertInParamAsFloatAt(this.inParams.length, value, flags);
	}

	/** Add in parameter as boolean at the end of the Parameter list.
	 *
	 * @param {boolean} value
	 * @param {number} flags from Flags (if need be)
	 */
	addInParamAsBoolean(value, flags) {
		this.insertInParamAsBooleanAt(this.inParams.length, value, flags);
	}

	/** Add in parameter as short at the end of the Parameter list.
	 *
	 * @param {number} value
	 * @param {number} flags from Flags (if need be)
	 */
	addInParamAsShort(value, flags) {
		this.insertInParamAsShortAt(this.inParams.length, value, flags);
	}

	/** Add in parameter as double at the end of the Parameter list.
	 *
	 * @param {number} value
	 * @param {number} flags from Flags (if need be)
	 */
	addInParamAsDouble(value, flags) {
		this.insertInParamAsDoubleAt(this.inParams.length, value, flags);
	}

	/** Add in parameter as char at the end of the Parameter list.
	 *
	 * @param {string} value
	 * @param {number} flags from Flags (if need be)
	 */
	addInParamAsCharacter(value, flags) {
		this.insertInParamAsCharacterAt(this.inParams.length, value, flags);
	}

	/** Add in parameter as String at the end of the Parameter list.
	 *
	 * @param {string} value
	 * @param {number} flags
	 */
	addInParamAsString(value, flags) {
		this.insertInParamAsStringAt(this.inParams.length, value, flags);
	}

	/** Add in parameter as Variant at the end of the Parameter list.
	 *
	 * @param {Variant} value
	 * @param {number} flags from Flags (if need be).
	 */
	addInParamAsVariant(value, flags) {
		this.insertInParamAsVariantAt(this.inParams.length, value, flags);
	}

	/** Add in parameter as Object at the end of the Parameter list.
	 *
	 * @param {object} value
	 * @param {number} flags from Flags (if need be).
	 */
	addInParamAsObject(value, flags) {
		this.insertInParamAsObjectAt(this.inParams.length, value, flags);
	}

	/** Add in parameter as String representation of UUID at the end of the Parameter list.
	 *
	 * @param {string} value
	 * @param {number} flags from Flags (if need be).
	 */
	addInParamAsUUID(value, flags) {
		this.insertInParamAsUUIDAt(this.inParams.length, value, flags);
	}

	/** Add in parameter as Pointer at the end of the Parameter list.
	 *
	 * @param {Pointer} value
	 * @param {number} flags from Flags (if need be).
	 */
	addInParamAsPointer(value, flags) {
		this.insertInParamAsPointerAt(this.inParams.length, value, flags);
	}

	/** Add in parameter as Struct at the end of the Parameter list.
	 *
	 * @param {Struct} value
	 * @param {number} flags from Flags (if need be).
	 */
	addInParamAsStruct(value, flags) {
		this.insertInParamAsStructAt(this.inParams.length, value, flags);
	}

	/** Add in parameter as ComArray at the end of the Parameter list.
	 *
	 * @param {ComArray} value
	 * @param {number} flags from Flags (if need be).
	 */
	addInParamAsArray(value, flags) {
		this.insertInParamAsArrayAt(this.inParams.length, value, flags);
	}

	/** Add in parameter as an array of object[] at the end of the Parameter list.The array is iterated and
	 * all members appended to the list.
	 *
	 * @param {ComValue[]} values
	 * @param {number} flags
	 */
	setInParams(values, flags) {
		for (const value of values) {
			this.inParams.push(value);
			this.inparamFlags.push(flags);
		}
	}

	/** Add in parameter as ComObject at the specified index in the Parameter list.
	 *
	 * @param {number} index 0 based index
	 * @param {ComObject} value
	 * @param {number} flags from Flags (if need be).
	 */
	insertInParamAsComObjectAt(index, value, flags) {
		this.inParams[index] = new ComValue(value, types.COMOBJECT);
		this.inparamFlags[index] = flags;
	}

	/** Add in parameter as int at the specified index in the Parameter list.
	 *
	 * @param {number} index 0 based index
	 * @param {number} value
	 * @param {number} flags from Flags (if need be).
	 */
	insertInParamAsIntAt(index, value, flags) {
		this.inParams[index] = new ComValue(value, types.INTEGER);
		this.inparamFlags[index] = flags;
	}

	/** Add in parameter as unsigned at the specified index in the Parameter list.
	 *
	 * @param {number} index 0 based index
	 * @param {number} value
	 * @param {number} flags from Flags (if need be).
	 */
	insertInParamAsUnsignedAt(index, value, flags) {
		this.inParams[index] = new ComValue(value, types.UNSIGNEDINTEGER);
		this.inparamFlags[index] = flags;
	}

	/** Add in parameter as float at the specified index in the Parameter list.
	 *
	 * @param {number} index 0 based index
	 * @param {number} value
	 * @param {number} flags from Flags (if need be).
	 */
	insertInParamAsFloatAt(index, value, flags) {
		this.inParams[index] = new ComValue(value, types.FLOAT);
		this.inparamFlags[index] = flags;
	}

	/** Add in parameter as boolean at the specified index in the Parameter list.
	 *
	 * @param {number} index 0 based index
	 * @param {boolean} value
	 * @param {number} flags from Flags (if need be).
	 */
	insertInParamAsBooleanAt(index, value, flags) {
		this.inParams[index] = new ComValue(value, types.BOOLEAN);
		this.inparamFlags[index] = flags;
	}

	/** Add in parameter as short at the specified index in the Parameter list.
	 *
	 * @param {number} index 0 based index
	 * @param {number} value
	 * @param {number} flags from Flags (if need be).
	 */
	insertInParamAsShortAt(index, value, flags) {
		this.inParams[index] = new ComValue(value, types.SHORT);
		this.inparamFlags[index] = flags;
	}

	/** Add in parameter as double at the specified index in the Parameter list.
	 *
	 * @param {number} index 0 based index
	 * @param {number} value
	 * @param {number} flags from Flags (if need be).
	 */
	insertInParamAsDoubleAt(index, value, flags) {
		this.inParams[index] = new ComValue(value, types.DOUBLE);
		this.inparamFlags[index] = flags;
	}

	/** Add in parameter as char at the specified index in the Parameter list.
	 *
	 * @param {number} index 0 based index
	 * @param {string} value
	 * @param {number} flags from Flags (if need be).
	 */
	insertInParamAsCharacterAt(index, value, flags) {
		this.inParams[index] = new ComValue(value, types.CHARACTER);
		this.inparamFlags[index] = flags;
	}

	/** Add in parameter as String  at the specified index in the Parameter list.
	 *
	 * @param {number} index 0 based index
	 * @param {string} value
	 * @param {number} flags from Flags (These <i>HAVE</i> to be the <b>String</b> Flags).
	 */
	insertInParamAsStringAt(index, value, flags) {
		this.inParams[index] = new ComValue(new ComString(value, flags), types.COMSTRING);
		this.inparamFlags[index] = Flags.FLAG_NULL;
	}

	/** Add in parameter as Variant at the specified index in the Parameter list.
	 *
	 * @param {number} index 0 based index
	 * @param {Variant} value
	 * @param {number} flags from Flags (if need be).
	 */
	insertInParamAsVariantAt(index, value, flags) {
		this.inParams[index] = new ComValue(value, types.VARIANT);
		this.inparamFlags[index] = Flags.FLAG_NULL;
	}

	/** Add in parameter as Object at the specified index in the Parameter list.
	 *
	 * @param {number} index 0 based index
	 * @param {ComValue} value
	 * @param {number} flags from Flags (if need be).
	 */
	insertInParamAsObjectAt(index, value, flags) {
		this.inParams[index] = value;
		this.inparamFlags[index] = flags;
	}

	/** Add in parameter as String representation of UUID at the specified index in the Parameter list.
	 *
	 * @param {number} index 0 based index
	 * @param {string} value
	 * @param {number} flags from Flags (if need be).
	 */
	insertInParamAsUUIDAt(index, value, flags) {
		this.inParams[index] = new ComValue(new UUID(value), types.UUID);
		this.inparamFlags[index] = flags;
	}

	/** Add in parameter as pointer at the specified index in the Parameter list.
	 *
	 * @param {number} index 0 based index
	 * @param {Pointer} value
	 * @param {number} flags from Flags (if need be).
	 */
	insertInParamAsPointerAt(index, value, flags) {
		this.inParams[index] = new ComValue(value, types.POINTER);
		this.inparamFlags[index] = flags;
	}

	/** Add in parameter as struct at the specified index in the Parameter list.
	 *
	 * @param {number} index 0 based index
	 * @param {Struct} value
	 * @param {number} flags from Flags (if need be).
	 */
	insertInParamAsStructAt(index, value, flags) {
		this.inParams[index] = new ComValue(value, types.STRUCT);
		this.inparamFlags[index] = flags;
	}

	/** Add in parameter as comarray at the specified index in the Parameter list.
	 *
	 * @param {number} index 0 based index
	 * @param {ComArray} value
	 * @param {number} flags from Flags (if need be).
	 */
	insertInParamAsArrayAt(index, value, flags) {
		this.inParams[index] = new ComValue(value, types.COMARRAY);
		this.inparamFlags[index] = flags;
	}

	/** Removes in parameter at the specified index from the Parameter list.
	 *
	 * @param {number} index 0 based index
	 */
	removeInParamAt(index) {
		this.inParams.splice(index, 1);
		this.inparamFlags.splice(index, 1);
	}

	/** Returns in parameter at the specified index from the Parameter list.
	 *
	 * @param {number} index 0 based index
	 * @return {ComValue} Primitives are returned as there Derieved types.
	 */
	getInParamAt(index) {
		return this.inParams[index];
	}

	/** Add out parameter of the type clazz at the end of the out parameter list.
	 *
	 * @param {number} clazz Class
	 * @param {number} flags
	 */
	addOutParamAsType(clazz, flags) {
		this.insertOutParamAt(this.outParams.length, new ComValue(null, clazz), flags);
	}

	/** Add out parameter at the end of the out parameter list
	 *
	 * @param {ComValue} outparam
	 * @param {number} flags
	 */
	addOutParamAsObject(outparam, flags) {
		this.insertOutParamAt(this.outParams.length, outparam, flags);
	}

	/** insert an out parameter at the specified index in the out parameter list.
	 *
	 * @param {number} index
	 * @param {ComValue} classOrInstance
	 * @param {number} flags
	 */
	insertOutParamAt(index, classOrInstance, flags) {
		this.outParams[index] = classOrInstance;
		this.outparamFlags[index] = flags;
	}

	/** Retrieves the out param at the index in the out parameters list.
	 *
	 * @param {number} index 0 based index
	 * @return {ComValue}
	 */
	getOutParamAt(index) {
		return this.outParams[index];
	}

	/** Removes out parameter at the specified index from the out parameters list.
	 *
	 * @param {number} index 0 based index
	 */
	removeOutParamAt(index) {
		this.outParams.splice(index, 1);
		this.outparamFlags.splice(index, 1);
	}

	/** Add out parameter as Object[] at the end of the Parameter list. The array is iterated and
	 * all members appended to the list.
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

	/**
	 * Returns the results as an Object[]. This array has to be iterated over to get the individual values.
	 * @return {Array}
	 */
	getResults() {
		// this.checkIfCalled();
		return this.outParams;
	}

	/**
	 * @param {Number} index
	 * @return {Object}
	 */
	getResultAt(index) {
		this.checkIfCalled();
		return this.results[index]; // don't do any type check
	}


	/** Returns the results incase an exception occured.
	 *
	 * @return {Object}
	 */
	getResultsInCaseOfException() {
		// this.checkIfCalled();
		return this.resultsOfException;
	}

	/** Returns the HRESULT of this operation. This should be zero for successful calls and
	 * non-zero for failures.
	 *
	 * @return {Number}
	 */
	getHRESULT() {
		return this.hresult;
	}

	/**
	 * Checks if the API was correctly called
	 */
	checkIfCalled() {
		if (!this.executed) {
			throw new Error("API Incorrectly called");
		}
	}

	/** Returns the entire in parameters list.
	 *
	 * @return {Array}
	 */
	getInParams() {
		return this.inParams.slice(); // slicing to return a copy, not the original
	}

	/** Returns the entire out parameters list.
	 *
	 * @return {Array}
	 */
	getOutParams() {
		return this.outParams.slice(); // slicing to return a copy, not the original
	}

	/** Returns the In Param flag.
	 *
	 * @return {Array}
	 */
	getInparamFlags() {
		return this.inparamFlags.slice(); // slicing to return a copy, not the original
	}

	/** Returns the Out Param flag.
	 *
	 * @return {Array}
	 */
	getOutparamFlags() {
		return this.outparamFlags.slice(); // slicing to return a copy, not the original
	}

	/** Returns the opnum of the API which will be invoked at the COM server.
	 * @return {Number}
	 */
	getOpnum() {
		// opnum is 3 as this is a COM interface and 0,1,2 are occupied by IUnknown
		// TODO remember this for extending com components also.
		return this.opnum;
	}

	/**
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
     * @param {NetworkDataRepresentation} ndr
     */
	write(ndr) {
		// reset buffer size here...
		// calculate rough length required length + 16 for the last bytes
		// plus adding 30 more for the verifier etc.
		ndr.getBuffer().buf = Buffer.from(new Array(this.bufferLength() + 16));

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
     * @param {NetworkDataRepresentation} ndr
     */
	writePacket(ndr) {
		if (this.session == null) {
			throw new Error("Programming Error ! Session not attached with this call ! ... Please rectify ! ");
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
					MarshalUnMarshalHelper.serialize(ndr, new ComValue(listOfDefferedPointers[x], types.POINTER), newList, this.inparamFlags[index]);
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
				OrpcThat.decode(ndr);
				await this.readPacket(ndr, false);
				//this.readResult(ndr);
			}
		}

		// last has to be the result.
		this.hresult = ndr.readUnsignedLong();
	}

	/**
	 * called by only runtime and NO ONE ELSE.
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
			throw new Error("Programming Error ! Session not attached with this call ! ... Please rectify ! ");
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
					/*
					let begin = listOfDefferedPointers.slice(0, x);
					let end = listOfDefferedPointers.slice(x, listOfDefferedPointers.length);
					let middle = newList;
					listOfDefferedPointers = begin.concat(middle.concat(end));
					*/
					listOfDefferedPointers.splice(x, 0, ...newList);
				}
				index++;
			}


			// now create the right COM Objects, it is required here only and no place else.
			for (let i = 0; i < comObjects.length; i++) {

				let comObjectImpl = comObjects[i];
				let comObject = null;
				if (fromCallback) {
					// this is a new IP , so make a new ComServer for this.
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
     * @return {number}
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
     * @param {Session} session
     */
	attachSession(session) {
		this.session = session;
	}

    /**
     * @return {Session}
     */
	getSession() {
		return this.session;
	}

	setReadOnlyHRESULT() {
		this.readOnlyHRESULT = true;
	}

	internal_COMVersion() {
		this.splCOMVersion = true;
	}

    /**
     * @returns {ComVersion}
     */
	internal_getComVersion() {
		return this.serverAlive2;
	}
}

// emulate static members
CallBuilder.COMOBJECTS = COMOBJECTS;
CallBuilder.CURRENTSESSION = CURRENTSESSION;

module.exports = CallBuilder;