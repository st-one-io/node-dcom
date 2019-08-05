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
    return (((src[si] & 0xFF) << 8) | (src[si + 1] & 0xFF));
  },

  dec_uint32be: function (src, si){
     return ((src[si] & 0xFF) << 24) | ((src[si + 1] & 0xFF) << 16) | ((src[si + 2] & 0xFF) << 8) | (src[si + 3] & 0xFF);
  },

  dec_uint16le: function (src, si){
    return ((src[si] & 0xFF) | ((src[si + 1] & 0xFF) << 8 ));
  },

  dec_uint32le: function (src, si){
    return (src[si] & 0xFF) | ((src[si + 1] & 0xFF) << 8) | ((src[si + 2] & 0xFF) << 16) | ((src[si + 3] & 0xFF) << 24);
  },

  // TO-DO: encoding and decoding 64 bits integers
  // TO-DO: encoding and decoding of floats and 64 bits floats
  // TO-DO: encoding and ecoding of time values
  // TO-DO: encoding and decoding of utf values
};
