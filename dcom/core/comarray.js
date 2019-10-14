//@ts-check
let initted = false;
let Struct;
let Union;
let Flags;
let Pointer;
let ComString;
let ComObject;
let System;
let ErrorCodes;
let MarshalUnMarshalHelper;
let NetworkDataRepresentation;

let types;
let ComValue;


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
	
	//case 1: ComArray(Class clazz, int[] upperBounds,int dimension, boolean isConformant)
	//case 2: ComArray(Class clazz, int[] upperBounds,int dimension, boolean isConformant, boolean isVarying)
	//case 3: ComArray(Object template, int[] upperBounds, int dimension, boolean isConformant)
	//case 4: ComArray(Object template, int[] upperBounds, int dimension, boolean isConformant, boolean isVarying)
	//case 5: ComArray(Object array, boolean isConformant)
	//case 6: ComArray(Object array, boolean isConformant, boolean isVarying)
	//case 7: ComArray(Object array)
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
		
		this._init();
		if (obj === null || obj === undefined){
			return; //returns an unitialized ComArray
		} else if (Array.isArray(obj.getValue())){ //cases 5, 6, 7
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

			this.clazz = obj.getType();
			this.init(obj.getValue());

		} else if (!(obj.getType() == types.STRUCT || obj.getType() == types.UNION
		|| obj.getType() == types.POINTER || obj.getType() == types.COMSTRING)) { //cases 1, 2
			this.clazz = obj.getType();
			this.init2(upperBounds, dimension, isConformant, !!isVarying);

		} else { //cases 3, 4
			if (!(obj.getType() == types.STRUCT || obj.getType() == types.UNION
				|| obj.getType() == types.POINTER || obj.getType() == types.COMSTRING)){
				throw new Error("ComArrays with template values must be of type STRUCT, UNION, POINTER or COMSTRING");
			}

			this.clazz = obj.getType();
			this.template = obj;
			let templateObj = obj.getValue();
			if (new System().getComVersion().getMinorVersion() == 6 && templateObj instanceof Pointer && templateObj.getReferent() instanceof ComObject) {
				//in this case this pointer will be a reference type pointer and not deffered one.
				//change in MS specs since DCOM 5.4
				this.isArrayOfCOMObjects_5_6_DCOM = true;
				templateObj.setIsReferenceTypePtr();
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
				throw new Error("ARRAY_UPPERBNDS_DIM_NOTMATCH" + new ErrorCodes().ARRAY_UPPERBNDS_DIM_NOTMATCH);
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
		this.memberArray = array;
		
		let upperBounds2 = [];
		let subArray = array;
		let auxArray = array
		this.numElementsInAllDimensions = 1;
		while (Array.isArray(auxArray)) {

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
			subArray = subArray[0];
			auxArray = auxArray[0];
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
		let elm0 = array[0].getValue();
		//Object o[] = (Object[])array;
		let o = array;
		for (let i = 0; i < o.length; i++)
		{
			//if (name.charAt(1) != '[') {
			if (!Array.isArray(elm0)) {
				//Object o1[] = (Object[])array;
				let o1 = array;
				for (let j = 0; j < o1.length; j++)	{
					length += MarshalUnMarshalHelper.getLengthInBytes(o1[j], Flags.FLAG_NULL);
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
			for (let i = 0; i < this.conformantMaxCounts.length; i++) {
				MarshalUnMarshalHelper.serialize(ndr, new ComValue(this.conformantMaxCounts[i], types.INTEGER), defferedPointers, flag);
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
		let elm0 = array[0].getValue();
		//Object o[] = (Object[])array;
		let o = array;
		for (let i = 0; i < o.length; i++) {
			//if (name.charAt(1) != '[') {
			if (!Array.isArray(elm0)) {
				//Object o1[] = (Object[])array;
				let o1 = array;
				for (let j = 0; j < o1.length; j++) {
					MarshalUnMarshalHelper.serialize(ndr, o1[j], defferedPointers, flag | Flags.FLAG_REPRESENTATION_ARRAY);
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
					retVal.numElementsInAllDimensions = retVal.numElementsInAllDimensions * retVal.upperBounds[i].getValue();
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
		return new ComValue(retVal, types.COMARRAY);
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
			array = new Array(retVal.upperBounds[retVal.upperBounds.length - j - 1].getValue())
			//c = array.getClass();
		}
		
		for (let i = 0; i < retVal.upperBounds[retVal.upperBounds.length - dimension].getValue() ; i++)	{
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
						array[i] = MarshalUnMarshalHelper.deSerialize(ndr,new ComValue(this.template.getValue(), this.template.getType()),defferedPointers,flag | Flags.FLAG_REPRESENTATION_ARRAY,additionalData);
					}
				}
			} else {
				array[i] = this.recurseDecode(retVal,ndr,arrayType,dimension - 1,defferedPointers,flag,additionalData);
			}
		}	
			
		return array;
	}
	
	/**	Reverses Array elements for Dispatch.
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
	
	updateClazz(c)
	{
		this.clazz = c;
	}
	
	toString()
	{
		return `[Type: ${types.descr[this.clazz]} , ${this.memberArray || 'memberArray is null'} ${this._isConformant ? ', conformant' : ''} ${this._isVarying ? ', varying' : ''} ]`;
	}

	_init() {
		if (initted) return;

		initted = false;
		Struct = require('./struct');
		Union = require('./union');
		Flags = require('./flags');
		Pointer = require('./pointer');
		ComString = require('./string');
		ComObject = require('./comobject');
		System = require('../common/system');
		ErrorCodes = require('../common/errorcodes');
		MarshalUnMarshalHelper = require('./marshalunmarshalhelper');
		NetworkDataRepresentation = require('../ndr/networkdatarepresentation');

		types = require('./types');
		ComValue = require('./comvalue');

		initted = true;
	}
}

module.exports = ComArray;