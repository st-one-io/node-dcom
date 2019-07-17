//@ts-check
const Struct = require('./struct');
const Union = require('./union');
const Flags = require('./flags');
const Pointer = require('./pointer');
const ComString = require('./string');
const ComObject = require('./comobject');
const System = require('../common/system');
const ErrorCodes = require('../common/errorcodes');
const MarshalUnMarshalHelper = require('./marshalunmarshalhelper');
const NetworkDataRepresentation = require('../ndr/networkdatarepresentation');

const types = require('./types');
const ComValue = require('./comvalue');


/**<p>Represents a C++ array which can display both <i>conformant and standard</i> 
 * behaviors. Since this class forms a wrapper on the actual array, the developer 
 * is expected to provide complete and final arrays (of Objects) to this class. 
 * Modifying the wrapped array afterwards <b>will</b> have unexpected results.
 *  </p> 
 * <p>
 * <i>Please refer to <b>MSExcel</b> examples for more details on how to use this 
 * class.</i>
 *  <p>
 * <b>Note</b>: Wrapped Arrays can be at most two dimensional in nature. Above
 * that is not supported by the library.
 *  
 * @since 1.0
 */
class ComArray {
	
	//case 1: JIArray(Class clazz, int[] upperBounds,int dimension, boolean isConformant)
	//case 2: JIArray(Class clazz, int[] upperBounds,int dimension, boolean isConformant, boolean isVarying)
	//case 3: JIArray(Object template, int[] upperBounds, int dimension, boolean isConformant)
	//case 4: JIArray(Object template, int[] upperBounds, int dimension, boolean isConformant, boolean isVarying)
	//case 5: JIArray(Object array, boolean isConformant)
	//case 6: JIArray(Object array, boolean isConformant, boolean isVarying)
	//case 7: JIArray(Object array)
	/**
	 * 
	 * @param {ComValue} [obj] Class or Object templace or Object Array
	 * @param {number[]} [upperBounds]
	 * @param {number} [dimension]
	 * @param {boolean} [isConformant]
	 * @param {boolean} [isVarying]
	 */
	constructor(obj, upperBounds, dimension, isConformant, isVarying) {

        this.memberArray = null; //Object
        this.clazz = null; //Class
        this.upperBounds = null; //int[]
        this.dimension = -1; //int
        this.numElementsInAllDimensions = 0; //int
        this._isConformant = false; //boolean
        this._isVarying = false; //boolean
        this._isConformantProxy = false; //boolean
        this._isVaryingProxy = false; //boolean
        this.conformantMaxCounts = []; //list of integers //List
        this.template = null; //Object
        this.isArrayOfCOMObjects_5_6_DCOM = false; //boolean
		this.sizeOfNestedArrayInBytes = 0; //used in both encoding and decoding. //int
		
		if (obj === null || obj === undefined){
			return; //returns an unitialized ComArray
		} else if (Array.isArray(obj.value)){ //cases 5, 6, 7
			// @ts-ignore
			isConformant = upperBounds;
			upperBounds = undefined;
			// @ts-ignore
			isVarying = dimension;
			dimension = undefined;

			this._isConformant = isConformant;
			this._isConformantProxy = isConformant;
			this._isVarying = isVarying;
			this._isVaryingProxy = isVarying;

			this.clazz = obj.type;
			this.init(obj.value);

		} else if (obj.value === null || obj.value === undefined) { //cases 1, 2
			this.clazz = obj.type;
			this.init2(upperBounds, dimension, isConformant, !!isVarying);

		} else { //cases 3, 4
			if (!(obj.type == types.STRUCT || obj.type == types.UNION
				|| obj.type == types.POINTER || obj.type == types.COMSTRING)){
				throw new Error("ComArrays with template values must be of type STRUCT, UNION, POINTER or COMSTRING");
			}

			this.clazz = obj.type;
			this.template = obj.value; 
			if (System.getComVersion().getMinorVersion() == 6 && this.template instanceof Pointer && this.template.getReferent() instanceof ComObject) {
				//in this case this pointer will be a reference type pointer and not deffered one.
				//change in MS specs since DCOM 5.4
				this.isArrayOfCOMObjects_5_6_DCOM = true;
				this.template.setIsReferenceTypePtr();
			}

			this.init2(upperBounds, dimension, isConformant, isVarying);
		}
	}
	
	/**
	 * 
	 * @param {number[]} upperBounds
	 * @param {number} dimension 
	 * @param {boolean} isConformant 
	 * @param {boolean} isVarying 
	 */
	init2(upperBounds, dimension, isConformant, isVarying) {
		this.upperBounds = upperBounds;
		this.dimension = dimension;
		this._isConformant = isConformant;
		this._isConformantProxy = isConformant;
		this._isVarying = isVarying;
		this._isVaryingProxy = isVarying;
		
		if (upperBounds) {
			//have to supply the upperbounds for each dimension , no gaps in between
			if (upperBounds.length != dimension) {
				throw new Error("ARRAY_UPPERBNDS_DIM_NOTMATCH" + ErrorCodes.ARRAY_UPPERBNDS_DIM_NOTMATCH);
			}
			
			for (let i = 0; i < upperBounds.length; i++) {
				this.numElementsInAllDimensions += upperBounds[i];
				if (this._isConformant) {
					this.conformantMaxCounts.push(upperBounds[i]);
				}
			}
		}
	}
	
	/**
	 * 
	 * @param {*[]} array 
	 */
	init(array)
	{
		//if (!array.getClass().isArray()) {
		//	throw new IllegalArgumentException(JISystem.getLocalizedMessage(JIErrorCodes.JI_ARRAY_PARAM_ONLY));
		//}
		//if (array.getClass().isPrimitive()) {
		//	throw new IllegalArgumentException(JISystem.getLocalizedMessage(JIErrorCodes.JI_ARRAY_PRIMITIVE_NOTACCEPT));
		//}
		////bad way...but what the heck...
		//if (array.getClass().toString().indexOf("java.lang.Object") != -1) {
		//	throw new IllegalArgumentException(JISystem.getLocalizedMessage(JIErrorCodes.JI_ARRAY_TYPE_INCORRECT));
		//}
		
		this.memberArray = array;
		
		let upperBounds2 = [];
		let subArray = array;
		let elm0 = array[0];
		this.numElementsInAllDimensions = 1;
		while (Array.isArray(elm0)) {

			let x = subArray.length;
			upperBounds2.push(x);
			this.numElementsInAllDimensions *= x;
			if (this._isConformant) {
				this.conformantMaxCounts.push(x);
			}
			//this.clazz = elm0.type;
			if (x == 0) //In which ever index the length is 0 , the array stops there, example Byte[0],Byte[0][10],Byte[10][0]
			{
				break;
			}
			subArray = elm0;
			elm0 = elm0[0];
			this.dimension++;
		}
		
		if (this.dimension == -1) {
			this.numElementsInAllDimensions = 0;
			this.dimension++;
		}
		
		this.upperBounds = upperBounds2;
		this.dimension++; //since it starts from -1.
		this.sizeOfNestedArrayInBytes = this.computeLengthArray(array);
	}
	
	/**
	 * 
	 * @param {*[]} array 
	 * @returns {number}
	 */
	computeLengthArray(array) {
		let length = 0;
		//let name = array.getClass().getName();
		let elm0 = array[0];
		//Object o[] = (Object[])array;
		let o = array;
		for (let i = 0; i < o.length; i++)
		{
			//if (name.charAt(1) != '[') {
			if (!Array.isArray(elm0)) {
				//Object o1[] = (Object[])array;
				let o1 = array;
				for (let j = 0; j < o1.length; j++)	{
					length += MarshalUnMarshalHelper.getLengthInBytes(new ComValue(o1[j], this.clazz), Flags.FLAG_NULL);
				}
				return length;
			} else {
				length += this.computeLengthArray(array[i]);
			}
		}
		 
		return length;
	}
	
	/** Returns the nested Array.
	 * 
	 * @return array Object which can be type casted based on value returned by {@link #getArrayClass()}.
	 */
	getArrayInstance()
	{
		return this.memberArray;
	}
	
	/** Class of the nested Array.
	 * 
	 * @return <code>class</code> 
	 */
	getArrayClass()
	{
		return this.clazz;
	}
	
	/** Array of integers depicting highest index for each dimension.
	 * 
	 * @return <code>int[]</code>
	 */
	getUpperBounds()
	{
		return this.upperBounds;
	}
	
	/** Returns the dimensions of the Array.
	 * 
	 * @return <code>int</code>
	 */
	getDimensions()
	{
		return this.dimension;
	}
	
	getSizeOfAllElementsInBytes()
	{		
		//this means that decode has created this array, and we need to compute the size to stay consistent.
		if (this.sizeOfNestedArrayInBytes == -1) {
			this.sizeOfNestedArrayInBytes = this.computeLengthArray(this.memberArray);
		}
			
		return this.sizeOfNestedArrayInBytes;
	}
	
	/**
	 * 
	 * @param {NetworkDataRepresentation} ndr 
	 * @param {*[]} array 
	 * @param {Pointer[]} defferedPointers 
	 * @param {number} flag 
	 */
	encode(ndr, array, defferedPointers, flag) 	{
	//	ArrayList listofDefferedPointers = new ArrayList();
		
		if (this._isConformantProxy)
		{
			//first write the max counts ...First to last dimension.
			for (const elm of this.conformantMaxCounts) {
				MarshalUnMarshalHelper.serialize(ndr, new ComValue(elm, types.INTEGER), defferedPointers, flag);
			}
			this._isConformantProxy = false; //this is since encode is recursive.
		}
		
		if (this._isVaryingProxy) {
			//write the offset and the actual count
			for (const elm of this.conformantMaxCounts) {
				MarshalUnMarshalHelper.serialize(ndr, new ComValue(0, types.INTEGER),defferedPointers,flag);//offset
				MarshalUnMarshalHelper.serialize(ndr, new ComValue(elm, types.INTEGER),defferedPointers,flag);//actual count
			}
			
			this._isVaryingProxy = false; //this is since encode is recursive.
		}
		
		//let name = array.getClass().getName();
		let elm0 = array[0];
		//Object o[] = (Object[])array;
		let o = array;
		for (let i = 0; i < o.length; i++) {
			//if (name.charAt(1) != '[') {
			if (!Array.isArray(elm0)) {
				//Object o1[] = (Object[])array;
				let o1 = array;
				for (let j = 0; j < o1.length; j++) {
					MarshalUnMarshalHelper.serialize(ndr, new ComValue(o1[j], this.clazz), defferedPointers, flag | Flags.FLAG_REPRESENTATION_ARRAY);
				}
				return;
			} else {
				this.encode(ndr, array[i], defferedPointers, flag);
			}
		}
		
	}
	
	/** Status whether the array is <code>conformant</code> or not.
	 * 
	 * @return <code>true</code> is array is <code>conformant</code>.
	 */
	isConformant()
	{
		return this._isConformant;
	}

	/** Status whether the array is <code>varying</code> or not.
	 * 
	 * @return <code>true</code> is array is <code>varying</code>.
	 */
	isVarying()
	{
		return this._isVarying;
	}

	
	/**
	 * 
	 * @param {NetworkDataRepresentation} ndr
	 * @param {number} arrayType
	 * @param {number} dimension 
	 * @param {Pointer[]} defferedPointers 
	 * @param {number} flag 
	 * @param {Map} additionalData 
	 */
	decode(ndr, arrayType, dimension,  defferedPointers, flag, additionalData) {
		let retVal = new ComArray();
		retVal._isConformantProxy = this._isConformantProxy;
		retVal._isVaryingProxy = this._isVaryingProxy;
		if (this._isConformantProxy) {
			 
			//first read the max counts ...First to last dimension.
			for (let i = 0; i < dimension; i++) {
				retVal.conformantMaxCounts.push(MarshalUnMarshalHelper.deSerialize(ndr, new ComValue(null, types.INTEGER), defferedPointers, flag, additionalData));
			}
			
			//isConformantProxy = false; //this is since decode is recursive.
			
			if (!this.upperBounds)
			{
				//max elements will come now.
				retVal.numElementsInAllDimensions = 1;
				retVal.upperBounds = new Array(retVal.conformantMaxCounts.length);
				let i = 0;
				while (i < retVal.conformantMaxCounts.length) {
					retVal.upperBounds[i] = retVal.conformantMaxCounts[i];
					retVal.numElementsInAllDimensions = retVal.numElementsInAllDimensions * retVal.upperBounds[i];
					i++;
				}
				if (i == 0) {
					retVal.numElementsInAllDimensions = 0;
				}
				//retVal.numElementsInAllDimensions = retVal.numElementsInAllDimensions * dimension;
			}

		} else {//this is the case when it is non conformant or coming from struct.
			retVal.upperBounds = this.upperBounds;
			retVal.conformantMaxCounts = this.conformantMaxCounts;
			retVal.numElementsInAllDimensions = this.numElementsInAllDimensions;
		}
		
		if (this._isVaryingProxy) {
			//first read the max counts ...First to last dimension.
			let i = 0;
			retVal.conformantMaxCounts.length = 0;//can't take the max count size now
			retVal.upperBounds = null;
			retVal.numElementsInAllDimensions = 0;
			
			while (i < dimension) {
				MarshalUnMarshalHelper.deSerialize(ndr, new ComValue(null, types.INTEGER),defferedPointers,flag,null);///offset
				retVal.conformantMaxCounts.push(MarshalUnMarshalHelper.deSerialize(ndr, new ComValue(null, types.INTEGER),defferedPointers,flag,additionalData));//actual count
				i++;
			}
			
			//isConformantProxy = false; //this is since decode is recursive.
			
			if (!this.upperBounds)
			{
				//max elements will come now.
				retVal.numElementsInAllDimensions = 1;
				retVal.upperBounds = new Array(retVal.conformantMaxCounts.length);
				i = 0;
				while (i < retVal.conformantMaxCounts.length)
				{
					retVal.upperBounds[i] = retVal.conformantMaxCounts[i];
					retVal.numElementsInAllDimensions = retVal.numElementsInAllDimensions * retVal.upperBounds[i];
					i++;
				}
				if (i == 0) {
					retVal.numElementsInAllDimensions = 0;
				}
				//retVal.numElementsInAllDimensions = retVal.numElementsInAllDimensions * dimension;
			}

		}
		
		retVal._isConformant = this._isConformant;
		retVal._isVarying = this._isVarying;
		retVal.template = this.template;
		retVal.memberArray = this.recurseDecode(retVal,ndr,arrayType,dimension, defferedPointers,flag, additionalData);
		retVal.clazz = this.clazz;
		retVal.dimension = this.dimension;
		retVal.sizeOfNestedArrayInBytes = -1; // setting here so that when a call actually comes for it's lenght , the getLength will compute. This is required since while decoding many pointers are still not complete and their length cannot be decided.
		return retVal;
	}
	
	/**
	 * 
	 * @param {ComArray} retVal 
	 * @param {NetworkDataRepresentation} ndr 
	 * @param {number} arrayType 
	 * @param {number} dimension 
	 * @param {Pointer[]} defferedPointers 
	 * @param {number} flag 
	 * @param {Map} additionalData 
	 */
	recurseDecode(retVal, ndr, arrayType, dimension, defferedPointers, flag, additionalData)
	{
		let array = null;
		let c = new ComValue(null, arrayType)
		for (let j = 0; j < dimension; j++ )		{
			array = new Array(retVal.upperBounds[retVal.upperBounds.length - j - 1])
			//c = array.getClass();
		}
		
		for (let i = 0; i < retVal.upperBounds[retVal.upperBounds.length - dimension] ; i++)	{
			if(dimension == 1){

				//fill value here
				//Array.set(array,i,new Float(i));
				if (!this.template)	{
					array[i] = MarshalUnMarshalHelper.deSerialize(ndr,c,defferedPointers,flag | Flags.FLAG_REPRESENTATION_ARRAY,additionalData);
				} else {
					if (this.isArrayOfCOMObjects_5_6_DCOM) {
						//not setting the array flag here.
						array[i] = MarshalUnMarshalHelper.deSerialize(ndr,this.template,defferedPointers,flag,additionalData);	
					} else	{
						array[i] = MarshalUnMarshalHelper.deSerialize(ndr,this.template,defferedPointers,flag | Flags.FLAG_REPRESENTATION_ARRAY,additionalData);
					}
				}
			} else {
				array[i] = this.recurseDecode(retVal,ndr,arrayType,dimension - 1,defferedPointers,flag,additionalData);
			}
		}	
		
		return array;
	}
	
	/**	Reverses Array elements for IJIDispatch.
	 * 
	 * @return
	 */
	reverseArrayForDispatch() {
		if (!this.memberArray)
			return 0;
		
		return this.memberArray.slice().reverse();
	}
	
	getConformantMaxCounts()
	{
		return this.conformantMaxCounts;
	}
	
	/**
	 * 
	 * @param {boolean} isConformant 
	 */
	setConformant(isConformant)
	{
		this._isConformantProxy = isConformant;
	}

	/**
	 * 
	 * @param {boolean} isVarying 
	 */
	setVarying(isVarying)
	{
		this._isVaryingProxy = isVarying;
	}
	
	/**
	 * 
	 * @param {number[]} maxCount 
	 */
	setMaxCountAndUpperBounds(maxCount)
	{
		this.conformantMaxCounts = maxCount;
	//	if (upperBounds == null) this will always be null since this api will get called from a decode and 
		//in that the upperBounds is always null, since one does not know the dim expected.
		if(this.conformantMaxCounts.length > 0)
		{
			//max elements will come now.
			this.numElementsInAllDimensions = 1;
			this.upperBounds = [];
			let i = 0;
			while (i < this.conformantMaxCounts.length)
			{
				this.upperBounds[i] = this.conformantMaxCounts[i];
				this.numElementsInAllDimensions = this.numElementsInAllDimensions * this.upperBounds[i];
				i++;
			}
			if (i == 0)
			{
				this.numElementsInAllDimensions = 0;
			}
		}
		else
		{
			this.upperBounds = null;
			this.numElementsInAllDimensions = 0;
		}
	}
	
	getNumElementsInAllDimensions()
	{
		return this.numElementsInAllDimensions;
	}
	
	/**<p>Used only from the JIVariant.getDecodedValueAsArray. It is required when the real class of the array is determined after the SafeArray Struct has been 
	 * processed. SA in COM can contain these along with normal types as well :- 
	 * FADF_BSTR 0x0100 An array of BSTRs. <br>
	 * FADF_UNKNOWN 0x0200 An array of IUnknown*. <br>  
 	 * FADF_DISPATCH 0x0400 An array of IDispatch*.  <br>
	 * FADF_VARIANT 0x0800 An array of VARIANTs. <br>
	 * 
	 * I have noticed that the "type" of the array doesn't always convey the right thing, so this "feature" flag of the SA shas to be looked into.
	 * As can be seen above except only BSTR require a template others do not. But the logic for the JIString(BSTR) already works fine. So I will use this
	 * flag only to set the JIVariant.class , whereever the "type" does not specify it but the "feature" does.    
	 * </p>
	 * @exclude
	 * @param {number} c
	 */
	updateClazz(c)
	{
		this.clazz = c;
	}
	
	toString()
	{
		return `[Type: ${types.descr[this.clazz]} , ${this.memberArray || 'memberArray is null'} ${this._isConformant ? ', conformant' : ''} ${this._isVarying ? ', varying' : ''} ]`;
	}
}

module.exports = ComArray;