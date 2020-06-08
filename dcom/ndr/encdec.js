var SmbConstants = require("./smbconstants");

module.exports = {
  // constants
  SEC_BETWEEN_1904_AND_1970: "2082844800L",
  TIME_1970_SEC_32BE: 1,
  TIME_1970_SEC_32LE: 2,
  TIME_1904_SEC_32BE: 3,
  TIME_1904_SEC_32LE: 4,
  TIME_1601_NANOS_64LE: 5,
  TIME_1601_NANOS_64BE: 6,
  TIME_1970_MILLIS_64BE: 7,
  TIME_1970_MILLIS_64LE: 8,
  //functions

  // decoders
  dec_uint16be: function (src, si){
    return src.readUInt16BE(si);
  },

  dec_uint16le: function (src, si){
    return src.readUInt16LE(si);
  },

  dec_int16be: function (src, si){
    return src.readInt16BE(si);
  },

  dec_int16le: function (src, si){
    return src.readInt16LE(si);
  },

  dec_uint32be: function (src, si){
    return src.readUInt32BE(si);
  },
  
  dec_uint32le: function (src, si){
    return src.readUInt32LE(si);
  },

  dec_int32be: function (src, si){
    return src.readInt32BE(si);
  },

  dec_int32le: function (src, si){
    return src.readInt32LE(si);
  },

  dec_uint64be: function (src, si) {
    return src.readUInt32BE(si);
  },

  dec_uint64le: function (src, si) {
    return src.readUInt32LE(si);
  },

  dec_int64be: function (src, si) {
    return src.readInt32BE(si);
  },

  dec_int64le: function (src, si) {
    return src.readInt32LE(si);
  },

  dec_doublele: function (src, si) {
    return Buffer.from(src).readDoubleLE(si);
  },

  dec_doublebe: function (src, si) {
    return Buffer.from(src).readDoubleBE(si);
  },
  
  dec_floatbe: function(src, si) {
    return Buffer.from(src).readFloatBE(si);
  },

  dec_floatle: function(src, si) {
    return Buffer.from(src).readFloatLE(si);
  },

  enc_uint16be: function (s, dst, di){
    dst[di++] = (s >> 8) & 0xFF;
    dst[di] = (s & 0xFF);
    return 2;
  },

  enc_uint32be: function (i, dst, di){
    dst[di++] = ((i >> 24) & 0xFF);
    dst[di++] = ((i >> 16) & 0xFF);
    dst[di++] = ((i >> 8) & 0xFF);
    dst[di] = (i & 0xFF);
    return 4;
  },

  enc_uint16le: function (s, dst, di) {
    dst[di++] = (s & 0xFF);
    dst[di] = (s >> 8) & 0xFF;
    return 2;
  },

  enc_uint32le: function (i, dst, di){
    dst[di++] = (i & 0xFF);
    dst[di++] = ((i >> 8) & 0xFF);
    dst[di++] = ((i >> 16) & 0xFF);
    dst[di] = ((i >> 24) & 0xFF);
    return 4;
  },

  enc_uint64be: function (l, dst, di) {
    this.enc_uint32be((l & 0xFFFFFFFF), dst, di + 4);
    this.enc_uint32be(((l >> 32) & 0xFFFFFFFF), dst, di);
    return 8;
  },

  enc_uint64le: function (l,  dst, di) {
    this.enc_uint32le(( l & 0xFFFFFFFF), dst, di);
    this.enc_uint32le(( ( l >> 32 ) & 0xFFFFFFFF), dst, di + 4);
    return 8;
  },

  enc_doublele: function (d, dst, di) {
	  var buffer = new ArrayBuffer(8);         
    var longNum = new Float64Array(buffer);  
    longNum[0] = d;
	
	  ltEndian = Array.from(new Int8Array(buffer));
	
	  dst[di++] = ltEndian[0];
    dst[di++] = ltEndian[1];
    dst[di++] = ltEndian[2];
  	dst[di++] = ltEndian[3];
    dst[di++] = ltEndian[4];
    dst[di++] = ltEndian[5];
    dst[di++] = ltEndian[6];
    dst[di] =   ltEndian[7];

    return 8;
  },


  enc_doublebe: function ( d, dst, di) {
    var buffer = new ArrayBuffer(8);         
    var longNum = new Float64Array(buffer);  
    longNum[0] = d;
	
	  ltEndian = Array.from(new Int8Array(buffer)).reverse();
	
	  dst[di++] = ltEndian[0];
    dst[di++] = ltEndian[1];
    dst[di++] = ltEndian[2];
	  dst[di++] = ltEndian[3];
    dst[di++] = ltEndian[4];
    dst[di++] = ltEndian[5];
    dst[di++] = ltEndian[6];
    dst[di] =   ltEndian[7];

    return 8;
  },
  
  enc_floatbe: function ( d, dst, di) {
    var buffer = new ArrayBuffer(4);         
    var longNum = new Float32Array(buffer);  
    longNum[0] = d;
    
    ltEndian = Array.from(new Int8Array(buffer)).reverse();
    
    dst[di++] = ltEndian[0];
    dst[di++] = ltEndian[1];
    dst[di++] = ltEndian[2];
    dst[di] = ltEndian[3];

    return 4;
  },
  
  enc_floatle: function ( d, dst, di) {
	
	  var buffer = new ArrayBuffer(4);         
    var longNum = new Float32Array(buffer);  
    longNum[0] = d;
	
	  ltEndian = Array.from(new Int8Array(buffer));
	
	  dst[di++] = ltEndian[0];
    dst[di++] = ltEndian[1];
    dst[di++] = ltEndian[2];
	  dst[di] = ltEndian[3];

    return 4;
  }
};
