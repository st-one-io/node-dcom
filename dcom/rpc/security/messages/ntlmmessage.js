// @ts-check
const SmbConstants = require('../../../ndr/smbconstants.js');

/**
 * This class defines a basic NTLM message and it is used to
 * derive all other NTLM messages.
 */
class NtlmMessage {
  /**
   * Initializes a few constants. Takes no input paremeters.
   */
  constructor() {
    this.SIGNATURE= ['N'.charCodeAt(0), 'T'.charCodeAt(0), 'L'.charCodeAt(0),
      'M'.charCodeAt(0), 'S'.charCodeAt(0), 'S'.charCodeAt(0),
      'P'.charCodeAt(0), 0];
    this.VERSION = [6, 1, 0, 0, 0, 0, 0, 15];
    this.TYPE1 = 0x01;
    this.TYPE2 = 0x02;
    this.TYPE3 = 0x03;
    this.OEM_ENCODING = SmbConstants.DEFAULT_OEM_ENCODING;
    this.UNI_ENCODING = 'UTF-16LE';
    this.flags;
  }

  /**
   * @return {Number}
   */
  getFlags() {
    return this.flags;
  }

  /**
   *
   * @param {Number} flags
   */
  setFlags(flags) {
    this.flags = flags;
  }

  /**
   *
   * @param {Number} flag
   * @return {Number}
   */
  getFlag(flag) {
    return (this.getFlags() & flag) != 0;
  }

  /**
   *
   * @param {Number} flag
   * @param {Number} value
   */
  setFlag(flag, value) {
    this.setFlags(value ?
      (this.getFlags() | flag) : (this.getFlags() & (0xffffffff ^ flag)));
  }

  /**
   *
   * @param {Array} src
   * @param {Number} index
   * @return {Number}
   */
  readULong(src, index) {
    return ( src[index] & 0xff ) | ( ( src[index + 1] & 0xff ) << 8 ) |
      ( ( src[index + 2] & 0xff ) << 16 ) |
      ( ( src[index + 3] & 0xff ) << 24 );
  }

  /**
   *
   * @param {Array} src
   * @param {Number} index
   * @return {Number}
   */
  readUShort(src, index) {
    return ( src[index] & 0xff ) | ( ( src[index + 1] & 0xff ) << 8 );
  }

  /**
   *
   * @param {Array} src
   * @param {Number} index
   * @return {Array}
   */
  readSecurityBuffer(src, index) {
    let length = this.readUShort(src, index);
    let offset = this.readULong(src, index + 4);
    let buffer = [];
    buffer = buffer.concat(src.slice(offset, offset + length));
    return buffer;
  }

  /**
   *
   * @param {Array} dst
   * @param {Number} offset
   * @param {Number} ulong
   */
  writeULong(dst, offset, ulong) {
    dst[offset] = ( ulong & 0xff );
    dst[offset + 1] = ( ulong >> 8 & 0xff );
    dst[offset + 2] = ( ulong >> 16 & 0xff );
    dst[offset + 3] = ( ulong >> 24 & 0xff );
  }

  /**
   *
   * @param {Array} dst
   * @param {Number} offset
   * @param {Number} ushort
   */
  writeUShort(dst, offset, ushort) {
    dst[offset] = ( ushort & 0xff );
    dst[offset + 1] = ( ushort >> 8 & 0xff );
  }

  /**
   *
   * @param {Array} dst
   * @param {Number} offset
   * @param {Array} src
   * @param {Number} bodyOffset
   * @return {Number}
   */
  writeSecurityBuffer(dst, offset, src, bodyOffset) {
    let length = ( src != null ) ? src.length : 0;
    if ( length == 0 ) {
      return offset + 4;
    }
    this.writeUShort(dst, offset, length);
    this.writeUShort(dst, offset + 2, length);
    this.writeULong(dst, offset + 4, bodyOffset);
    return offset + 4;
  }
  
  /**
   *
   * @param {Array} dst
   * @param {Number} pos
   * @param {Number} off
   * @param {Array} src
   * @return {Number}
   */
  writeSecurityBufferContent(dst, pos, off, src ) {
    this.writeULong(dst, off, pos);
    if ( src != null && src.length > 0 ) {
      let aux = src.slice(0, src.length);
      let aux_i = pos;
      while (aux.length > 0) {
        dst.splice(aux_i++, 1, aux.shift());
      }
      return src.length;
    }
    return 0;
  }

  /**
   * @return {Number}
   */
  getOEMEncoding() {
    return this.OEM_ENCODING;
  }

  /**
   * To be implemented by each message
   */
  toByteArray(){};
}

module.exports = NtlmMessage;
