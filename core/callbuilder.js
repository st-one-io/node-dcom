//@ts-check
const NdrObject = require('../ndr/ndrobject.js');
const UUID = require('../rpc/core/uuid.js');
const MarshalUnMarshalHelper = require('./marshalunmarshalhelper.js');
const Flags = require('./flags.js');
const OrpcThis = require('./orpcthis');
const OrpcThat = require('./orpcthat');
const Session = require('./session');
const ComServer = require('./comserver');
const FrameworkHelper = require('./frameworkhelper');
const ComVersion = require('../common/comversion');
const ErrorCodes = require('../common/errorcodes.js');
const NetworkDataRepresentation = require('../ndr/networkdatarepresentation');

const ComArray = require('./comarray');
const ComObject = require('./comobject');
const ComString = require('./string');
const Pointer = require('./pointer');
const Struct = require('./struct');
const Variant = require('./variant');

const types = require('./types');
const ComValue = require('./comvalue');

const CURRENTSESSION = "CURRENTSESSION";
const COMOBJECTS = "COMOBJECTS";


class CallBuilder extends NdrObject {

    /**
     * Constructs a builder object.
     * 
     * @param {boolean} dispatchNotSupported <code>true</code> if <code>IDispatch</code> is
	 * not supported by the <code>IJIComObject</code> on which this builder would
	 * act. Use {@link IJIComObject#isDispatchSupported()} to find out if
	 * dispatch is supported on the COM Object.
     */
	constructor(dispatchNotSupported) {
		super();

		this.opnum = -1; //int
		this.results = null; //Object[]
		this.dispatchNotSupported = dispatchNotSupported || false; //boolean
		this.enclosingParentsIPID = null; //String
		this.inparamFlags = []; //ArrayList
		this.outparamFlags = []; //ArrayList
		/** @type {ComValue[]} */
		this.inParams = [];
		/** @type {ComValue[]} */
		this.outParams = []; //ArrayList
		this.hresult = 0; //int
		this.executed = false; //boolean
		this.resultsOfException = null; //Object[]
		this.session = null; //Session
		this.fromDestroySession = dispatchNotSupported || false; //fromDestroySession
		this.readOnlyHRESULT = false; //boolean
		this.splCOMVersion = false; //boolean
		this.serverAlive2 = null; //ComVersion
	}

	/**
	 * Reinitializes all members of this object. It is ready to be used again on a 
	 * fresh <code>{@link IJIComObject#call}</code> after this step. 
	 *
	 */
	//after reinit, except parent, nothing is available.
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

	/**Add <code>[in]</code> parameter as <code>Unsigned</code> at the end of the Parameter list.
	 * 
	 * @param {number} value
	 * @param {number} flags from Flags (if need be)
	 */
	addInParamAsUnsigned(value, flags) {
		this.insertInParamAsUnsignedAt(this.inParams.length, value, flags);
	}

	/**Add <code>[in]</code> parameter as <code>float</code> at the end of the Parameter list.
	 * 
	 * @param {number} value
	 * @param {number} flags from Flags (if need be)
	 */
	addInParamAsFloat(value, flags) {
		this.insertInParamAsFloatAt(this.inParams.length, value, flags);
	}

	/**Add <code>[in]</code> parameter as <code>boolean</code> at the end of the Parameter list.
	 * 
	 * @param {boolean} value
	 * @param {number} flags from Flags (if need be)
	 */
	addInParamAsBoolean(value, flags) {
		this.insertInParamAsBooleanAt(this.inParams.length, value, flags);
	}

	/**Add <code>[in]</code> parameter as <code>short</code> at the end of the Parameter list.
	 * 
	 * @param {number} value
	 * @param {number} flags from Flags (if need be)
	 */
	addInParamAsShort(value, flags) {
		this.insertInParamAsShortAt(this.inParams.length, value, flags);
	}

	/**Add <code>[in]</code> parameter as <code>double</code> at the end of the Parameter list.
	 * 
	 * @param {number} value
	 * @param {number} flags from Flags (if need be)
	 */
	addInParamAsDouble(value, flags) {
		this.insertInParamAsDoubleAt(this.inParams.length, value, flags);
	}

	/**Add <code>[in]</code> parameter as <code>char</code> at the end of the Parameter list.
	 * 
	 * @param {string} value
	 * @param {number} flags from Flags (if need be)
	 */
	addInParamAsCharacter(value, flags) {
		this.insertInParamAsCharacterAt(this.inParams.length, value, flags);
	}

	/**Add <code>[in]</code> parameter as <code>String</code> at the end of the Parameter list.
	 * 
	 * @param {string} value
	 * @param {number} flags from Flags (These <i>HAVE</i> to be the <b>String</b> Flags).
	 */
	//flags have to be String flags
	addInParamAsString(value, flags) {
		this.insertInParamAsStringAt(this.inParams.length, value, flags);
	}

	/**Add <code>[in]</code> parameter as <code>Variant</code> at the end of the Parameter list.
	 * 
	 * @param {Variant} value
	 * @param {number} flags from Flags (if need be).
	 */
	addInParamAsVariant(value, flags) {
		this.insertInParamAsVariantAt(this.inParams.length, value, flags);
	}

	/**Add <code>[in]</code> parameter as <code>Object</code> at the end of the Parameter list.
	 * 
	 * @param {object} value
	 * @param {number} flags from Flags (if need be).
	 */
	addInParamAsObject(value, flags) {
		this.insertInParamAsObjectAt(this.inParams.length, value, flags);
	}

	/**Add <code>[in]</code> parameter as <code>String representation of UUID</code> at the end of the Parameter list.
	 * 
	 * @param {string} value
	 * @param {number} flags from Flags (if need be).
	 */
	addInParamAsUUID(value, flags) {
		this.insertInParamAsUUIDAt(this.inParams.length, value, flags);
	}

	/**Add <code>[in]</code> parameter as <code>Pointer</code> at the end of the Parameter list.
	 * 
	 * @param {Pointer} value
	 * @param {number} flags from Flags (if need be).
	 */
	addInParamAsPointer(value, flags) {
		this.insertInParamAsPointerAt(this.inParams.length, value, flags);
	}

	/**Add <code>[in]</code> parameter as <code>Struct</code> at the end of the Parameter list.
	 * 
	 * @param {Struct} value
	 * @param {number} flags from Flags (if need be).
	 */
	addInParamAsStruct(value, flags) {
		this.insertInParamAsStructAt(this.inParams.length, value, flags);
	}

	/**Add <code>[in]</code> parameter as <code>JIArray</code> at the end of the Parameter list.
	 * 
	 * @param {ComArray} value
	 * @param {number} flags from Flags (if need be).
	 */
	addInParamAsArray(value, flags) {
		this.insertInParamAsArrayAt(this.inParams.length, value, flags);
	}

	/**Add <code>[in]</code> parameter as <code>Object[]</code> at the end of the Parameter list.The array is iterated and
	 * all members appended to the list.
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

	/**Add <code>[in]</code> parameter as <code>IJIComObject</code> at the specified index in the Parameter list.
	 * 
	 * @param {number} index 0 based index
	 * @param {ComObject} value
	 * @param {number} flags from Flags (if need be). 
	 */
	insertInParamAsComObjectAt(index, value, flags) {
		this.inParams[index] = new ComValue(value, types.COMOBJECT);
		this.inparamFlags[index] = flags;
	}

	/**Add <code>[in]</code> parameter as <code>int</code> at the specified index in the Parameter list.
	 * 
	 * @param {number} index 0 based index
	 * @param {number} value
	 * @param {number} flags from Flags (if need be). 
	 */
	insertInParamAsIntAt(index, value, flags) {
		this.inParams[index] = new ComValue(value, types.INTEGER);
		this.inparamFlags[index] = flags;
	}

	/**Add <code>[in]</code> parameter as <code>IJIUnsigned</code> at the specified index in the Parameter list.
	 * 
	 * @param {number} index 0 based index
	 * @param {number} value
	 * @param {number} flags from Flags (if need be). 
	 */
	insertInParamAsUnsignedAt(index, value, flags) {
		this.inParams[index] = new ComValue(value, types.UNSIGNEDINTEGER);
		this.inparamFlags[index] = flags;
	}

	/**Add <code>[in]</code> parameter as <code>float</code> at the specified index in the Parameter list.
	 *
	 * @param {number} index 0 based index
	 * @param {number} value
	 * @param {number} flags from Flags (if need be). 
	 */
	insertInParamAsFloatAt(index, value, flags) {
		this.inParams[index] = new ComValue(value, types.FLOAT);
		this.inparamFlags[index] = flags;
	}

	/**Add <code>[in]</code> parameter as <code>boolean</code> at the specified index in the Parameter list.
	 * 
	 * @param {number} index 0 based index
	 * @param {boolean} value
	 * @param {number} flags from Flags (if need be). 
	 */
	insertInParamAsBooleanAt(index, value, flags) {
		this.inParams[index] = new ComValue(value, types.BOOLEAN);
		this.inparamFlags[index] = flags;
	}

	/**Add <code>[in]</code> parameter as <code>short</code> at the specified index in the Parameter list.
	 * 
	 * @param {number} index 0 based index
	 * @param {number} value
	 * @param {number} flags from Flags (if need be). 
	 */
	insertInParamAsShortAt(index, value, flags) {
		this.inParams[index] = new ComValue(value, types.SHORT);
		this.inparamFlags[index] = flags;
	}

	/**Add <code>[in]</code> parameter as <code>double</code> at the specified index in the Parameter list.
	 * 
	 * @param {number} index 0 based index
	 * @param {number} value
	 * @param {number} flags from Flags (if need be). 
	 */
	insertInParamAsDoubleAt(index, value, flags) {
		this.inParams[index] = new ComValue(value, types.DOUBLE);
		this.inparamFlags[index] = flags;
	}

	/**Add <code>[in]</code> parameter as <code>char</code> at the specified index in the Parameter list.
	 * 
	 * @param {number} index 0 based index
	 * @param {string} value
	 * @param {number} flags from Flags (if need be). 
	 */
	insertInParamAsCharacterAt(index, value, flags) {
		this.inParams[index] = new ComValue(value, types.CHARACTER);
		this.inparamFlags[index] = flags;
	}

	/**Add <code>[in]</code> parameter as <code>String</code>  at the specified index in the Parameter list.
	 * 
	 * @param {number} index 0 based index
	 * @param {string} value
	 * @param {number} flags from Flags (These <i>HAVE</i> to be the <b>String</b> Flags).
	 */
	//flags have to be String flags
	insertInParamAsStringAt(index, value, flags) {
		this.inParams[index] = new ComValue(new ComString(value, flags), types.COMSTRING);
		this.inparamFlags[index] = Flags.FLAG_NULL;
	}

	/**Add <code>[in]</code> parameter as <code>Variant</code> at the specified index in the Parameter list.
	 *
	 * @param {number} index 0 based index
	 * @param {Variant} value
	 * @param {number} flags from Flags (if need be). 
	 */
	insertInParamAsVariantAt(index, value, flags) {
		this.inParams[index] = new ComValue(value, types.VARIANT);
		this.inparamFlags[index] = Flags.FLAG_NULL;
	}

	/**Add <code>[in]</code> parameter as <code>Object</code> at the specified index in the Parameter list.
	 * 
	 * @param {number} index 0 based index
	 * @param {ComValue} value
	 * @param {number} flags from Flags (if need be). 
	 */
	//this is for dispatch, etc...more or less will never be used.
	insertInParamAsObjectAt(index, value, flags) {
		this.inParams[index] = value;
		this.inparamFlags[index] = flags;
	}

	/**Add <code>[in]</code> parameter as <code>String representation of UUID</code> at the specified index in the Parameter list.
	 * 
	 * @param {number} index 0 based index
	 * @param {string} value
	 * @param {number} flags from Flags (if need be). 
	 */
	insertInParamAsUUIDAt(index, value, flags) {
		this.inParams[index] = new ComValue(new UUID(value), types.UUID);
		this.inparamFlags[index] = flags;
	}

	/**Add <code>[in]</code> parameter as <code>JIPointer</code> at the specified index in the Parameter list.
	 * 
	 * @param {number} index 0 based index
	 * @param {Pointer} value
	 * @param {number} flags from Flags (if need be). 
	 */
	insertInParamAsPointerAt(index, value, flags) {
		this.inParams[index] = new ComValue(value, types.POINTER);
		this.inparamFlags[index] = flags;
	}

	/**Add <code>[in]</code> parameter as <code>JIStruct</code> at the specified index in the Parameter list.
	 * 
	 * @param {number} index 0 based index
	 * @param {Struct} value
	 * @param {number} flags from Flags (if need be). 
	 */
	insertInParamAsStructAt(index, value, flags) {
		this.inParams[index] = new ComValue(value, types.STRUCT);
		this.inparamFlags[index] = flags;
	}

	/**Add <code>[in]</code> parameter as <code>JIArray</code> at the specified index in the Parameter list.
	 * 
	 * @param {number} index 0 based index
	 * @param {ComArray} value
	 * @param {number} flags from Flags (if need be). 
	 */
	insertInParamAsArrayAt(index, value, flags) {
		this.inParams[index] = new ComValue(value, types.COMARRAY);
		this.inparamFlags[index] = flags;
	}

	/**Removes <code>[in]</code> parameter at the specified index from the Parameter list.
	 * 
	 * @param {number} index 0 based index
	 */
	removeInParamAt(index) {
		this.inParams.splice(index, 1);
		this.inparamFlags.splice(index, 1);
	}

	/**Returns <code>[in]</code> parameter at the specified index from the Parameter list.
	 * 
	 * @param {number} index 0 based index 
	 * @return {ComValue} Primitives are returned as there Derieved types. 
	 */
	//Will just provide 1 getter, for outParams there would be overloads like inParam setters.
	getInParamAt(index) {
		return this.inParams[index];
	}

	/** Add <code>[out]</code> parameter of the type <code>clazz</code> at the end of the out parameter list.
	 * 
	 * @param {number} clazz Class
	 * @param {number} flags
	 */
	addOutParamAsType(clazz, flags) {
		this.insertOutParamAt(this.outParams.length, new ComValue(null, clazz), flags);
	}

	/** Add <code>[out]</code> parameter at the end of the out parameter list. Typically callers are <br> 
	 * composite in nature JIStruct, JIUnions, JIPointer and JIString . 
	 * 
	 * @param {ComValue} outparam
	 * @param {number} flags
	 */
	addOutParamAsObject(outparam, flags) {
		this.insertOutParamAt(this.outParams.length, outparam, flags);
	}

	/** insert an <code>[out]</code> parameter at the specified index in the out parameter list. 
	 * 
	 * @param {number} index 0 based index
	 * @param {ComValue} classOrInstance can be either a Class or an Object
	 * @param {number} flags
	 */
	insertOutParamAt(index, classOrInstance, flags) {
		this.outParams[index] = classOrInstance;
		this.outparamFlags[index] = flags;
	}

	/** Retrieves the <code>[out]</code> param at the index in the out parameters list.
	 * 
	 * @param {number} index 0 based index
	 * @returns {ComValue}
	 */
	getOutParamAt(index) {
		return this.outParams[index];
	}

	/**Removes <code>[out]</code> parameter at the specified index from the out parameters list.
	 * 
	 * @param {number} index 0 based index
	 */
	removeOutParamAt(index) {
		this.outParams.splice(index, 1);
		this.outparamFlags.splice(index, 1);
	}

	/**Add <code>[out]</code> parameter as <code>Object[]</code> at the end of the Parameter list. The array is iterated and
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

	//now for the results

	/**
	 * Returns the results as an <code>Object[]</code>. This array has to be iterated over to get the individual values.
	 */
	//	only valid before the interpretation of read, after that has actual values
	getResults() {
		//this.checkIfCalled();
		return this.outParams;
	}

	getResultAt(index) {
		this.checkIfCalled();
		return this.results[index]; //don't do any type check
	}


	/** Returns the results incase an exception occured. 
	 * 
	 * @return
	 */
	getResultsInCaseOfException() {
		//this.checkIfCalled();
		return this.resultsOfException;
	}

	/** Returns the <code>HRESULT</code> of this operation. This should be zero for successful calls and
	 * non-zero for failures.
	 * 
	 * @return
	 */
	getHRESULT() {
		return this.hresult;
	}

	checkIfCalled() {
		console.log("azul", this.executed);
		if (!this.executed) {
			throw new Error("API Incorrectly called");
		}
	}

	/** Returns the entire <code>[in]</code> parameters list. 
	 * 
	 * @return
	 */
	getInParams() {
		return this.inParams.slice(); //slicing to return a copy, not the original
	}

	/** Returns the entire <code>[out]</code> parameters list. 
	 * 
	 * @return
	 */
	getOutParams() {
		return this.outParams.slice(); //slicing to return a copy, not the original
	}

	/** Returns the In Param flag.
	 * 
	 * @return
	 */
	getInparamFlags() {
		return this.inparamFlags.slice();  //slicing to return a copy, not the original
	}

	/** Returns the Out Param flag.
	 * 
	 * @return
	 */
	getOutparamFlags() {
		return this.outparamFlags.slice();  //slicing to return a copy, not the original
	}

	/** Returns the opnum of the API which will be invoked at the <code>COM</code> server. 
	 * 
	 */
	getOpnum() {
		//opnum is 3 as this is a COM interface and 0,1,2 are occupied by IUnknown
		//TODO remember this for extending com components also.
		return this.opnum;
	}

	//All Methods are 0 index based
	/**
	 *  Sets the opnum of the API which will be invoked at the <code>COM</code> server. This is a 0 based index.
	 *  Refer to the IDL of the <code>COM server</code> for this, all APIs are listed in a sequential order starting from 0. Please ignore the 
	 *  <code>"Id"</code> they might be having and count the index of the API being called here from the beginning of the interface starting from 
	 *  0 as the first index. Also note that if this interface derieves from anything other than <code>IUnknown</code> or <code>IDispatch</code>, your start
	 *  index will change from 0 to the cumulative(if that interface is also a derieved one) count of the super interface. For e.g if A(3 apis) derieves from B
	 *  (10 apis), then first API of A is at Opnum of 3, second at 4 and so on.
	 *  
	 *   
	 *   
	 *   Alternatively, you can use the IJIDispatch interface, if the object supports it.
	 */
	setOpnum(num) {
		let dispatch = 0;
		if (!this.dispatchNotSupported) {
			dispatch = 4; //4 apis.
		}
		this.opnum = dispatch + num + 3; //0,1,2, Q.I
	}

	/**
     * 
     * @param {NetworkDataRepresentation} ndr
     */
	write2(ndr) {
		//reset buffer size here...
		//calculate rough length required length + 16 for the last bytes
		//plus adding 30 more for the verifier etc. 
		ndr.getBuffer().buf = Buffer.alloc(this.bufferLength() + 16 + 30);
		OrpcThat.encode(ndr);
		this.writePacket(ndr);
	}

    /**
     * 
     * @param {NetworkDataRepresentation} ndr
     */
	write(ndr) {

		//reset buffer size here...
		//calculate rough length required length + 16 for the last bytes
		//plus adding 30 more for the verifier etc. 
		ndr.getBuffer().buf = new Array(this.bufferLength() + 16);

		let orpcthis = new OrpcThis();
		orpcthis.encode(ndr);

		this.writePacket(ndr);

		//when it ends add 16 zeros.
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


				//				thought of this today morning...change the logic here...the defeered pointers need to be 
				//				completely serialized here. If they are also having nested deffered pointers then  those pointers
				//				should be "inserted" just after the current pointer itself.
				//				change the logic below to send out a new list and insert that list after the current x.
				//				consider the case when there is a Struct having a nested pointer to another struct and this struct
				//				itself having a pointer.
				//				
				//				Inparams order:- for 2 params.
				//				int f,Struct{int i;			 
				//							 Struct *ptr;
				//							 Struct *ptr2;
				//							 int j;
				//							}
				//				
				//				while serializing this struct the pointer 1 will get deffered and so will pointer 2. Now while writing
				//				the deffered pointers , we will find that the pointer 1 is pointing to a struct which has another deffered pointer (pointer to another struct maybe)
				//				in such case, the current logic will add the deffered pointer to the end of the listOfDefferedPointers list, effectively serializing it
				//				after the pointer 2 referent. But that is what is against the rules of DCERPC, in this case the referent of pointer 1 (struct with the pointer to another struct)
				//				should be serialized in place (following th rules of the struct serialization ofcourse) and should not go to the end of the list.
				while (x < listOfDefferedPointers.length) {
					//JIMarshalUnMarshalHelper.serialize(ndr,JIPointer.class,(JIPointer)listOfDefferedPointers.get(x),listOfDefferedPointers,inparamFlags);
					let newList = [];
					MarshalUnMarshalHelper.serialize(ndr, new ComValue(listOfDefferedPointers[x], types.POINTER), newList, this.inparamFlags[index]);
					x++; //incrementing index
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
	read(ndr) {
		//interpret based on the out params flags
		if (!this.readOnlyHRESULT) {
			if (this.splCOMVersion) {
				//during handshake and no other time. Kept for OxidResolver methods.
				this.serverAlive2 = new ComVersion(ndr.readUnsignedShort(), ndr.readUnsignedShort());
				let dualStringPtr = new ComValue(new Pointer(new ComValue(null, types.DUALSTRINGARRAY)), types.POINTER);
				new Pointer(dualStringPtr).decode(ndr, [], Flags.FLAG_NULL, new Map());
				ndr.readUnsignedLong();
			} else {
				let orpcThat = OrpcThat.decode(ndr);
				this.readPacket(ndr, false);
			}
		}
		this.readResult(ndr);
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
	readPacket(ndr, fromCallback) {

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
		//user has nothing to return.
		if (outparams != null && outparams.length > 0) {

			while (index < outparams.length) {
				let listOfDefferedPointers = [];
				results.push(MarshalUnMarshalHelper.deSerialize(ndr, outparams[index], listOfDefferedPointers, this.outparamFlags[index], additionalData));
				let x = 0;

				while (x < listOfDefferedPointers.length) {
					let newList = [];
					let replacement = MarshalUnMarshalHelper.deSerialize(ndr, new ComValue(listOfDefferedPointers[x], types.POINTER), newList, this.outparamFlags[index], additionalData);
					listOfDefferedPointers[x].replaceSelfWithNewPointer(replacement); //this should replace the value in the original place.	
					x++;
					listOfDefferedPointers.splice(x, 0, ...newList);
				}
				index++;
			}


			//now create the right COM Objects, it is required here only and no place else. 
			for (let i = 0; i < comObjects.length; i++) {

				let comObjectImpl = comObjects[i];
				let comObject = null;
				if (fromCallback) {
					//this is a new IP , so make a new JIComServer for this.
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

				comObjectImpl.replaceMembers(comObject);
				FrameworkHelper.addComObjectToSession(comObjectImpl.getAssociatedSession(), comObjectImpl);
				comObjectImpl.addRef();
			}

			comObjects.length = 0;
		}

		this.results = results;
		this.executed = true;
	}

    /**
     * 
     * @param {NetworkDataRepresentation} ndr
     */
	readResult(ndr) {
		//last has to be the result.
		this.hresult = ndr.readUnsignedLong();

		if (this.hresult != 0) {
			//something exception occured at server, set up results
			this.resultsOfException = this.results;
			this.results = null;
			throw new Error(ErrorCodes.errorDesc[this.hresult] || this.hresult);
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

		return length + 2048; //2K extra for alignments, if any.
	}

	/**Returns true incase the Call resulted in an exception, use getHRESULT to get the error code.
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