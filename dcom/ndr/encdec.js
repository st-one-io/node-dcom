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

  // decoders
  dec_uint16be: function (src, si){
    return src.readUInt16BE(si);
  },

  dec_uint32be: function (src, si){
     return src.readUInt32BE(si);
  },

  dec_uint16le: function (src, si){
    return src.readUInt16LE(si);
  },

  dec_uint32le: function (src, si){
    return src.readUInt32LE(si);
  },

  // TO-DO: encoding and decoding 64 bits integers
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

  dec_uint64be: function (src, si) {
    let l;
    l = this.dec_uint32be(src, si) & 0xFFFFFFFF;
    l <<= 32;
    l |= this.dec_uint32be(src, si + 4) & 0xFFFFFFFF;
    return l;
  },

  dec_uint64le: function (src, si) {
    let l;
    l = this.dec_uint32le( src, si + 4 ) & 0xFFFFFFFF;
    l <<= 32;
    l |= this.dec_uint32le( src, si ) & 0xFFFFFFFF;
    return l;
  },
  // TO-DO: encoding and decoding of floats and 64 bits floats
  enc_doublele: function (d, dst, di) {
    return enc_uint64le(d, dst, di);
  },


  enc_doublebe: function ( d, dst, di) {
    return enc_uint64be(d, dst, di);
  },

  dec_doublele: function (src, si) {
    return Buffer.from(src).readDoubleLE(si);
  },

  dec_doublebe: function (src, si) {
    return this.dec_uint64be(src, si);
  },

  dec_floatle: function(src, si) {
    return Buffer.from(src).readFloatLE(si);
  }
  // TO-DO: encoding and ecoding of time values
  // TO-DO: encoding and decoding of utf values
};
