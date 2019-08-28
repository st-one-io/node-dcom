var SmbConstants = require('../../../ndr/smbconstants.js');

class NtlmMessage
{
  constructor()
  {
    this.SIGNATURE= ['N'.charCodeAt(0), 'T'.charCodeAt(0), 'L'.charCodeAt(0), 'M'.charCodeAt(0), 'S'.charCodeAt(0), 'S'.charCodeAt(0), 'P'.charCodeAt(0), 0];
    this.VERSION = [6, 1, 0, 0, 0, 0, 0, 15];
    this.TYPE1 = 0x01;
    this.TYPE2 = 0x02;
    this.TYPE3 = 0x03;
    this.OEM_ENCODING = SmbConstants.DEFAULT_OEM_ENCODING;
    this.UNI_ENCODING = "UTF-16LE";
    this.flags;
  }

  getFlags()
  {
    return this.flags;
  }

  setFlags(flags)
  {
    this.flags = flags;
  }

  getFlag(flag)
  {
    return (this.getFlags() & flag) != 0;
  }

  setFlag(flag, value)
  {
    this.setFlags(value ? (this.getFlags() | flag) : (this.getFlags() & (0xffffffff ^ flag)));
  }

  readULong(src, index)
  {
    return ( src[ index ] & 0xff ) | ( ( src[ index + 1 ] & 0xff ) << 8 ) | ( ( src[ index + 2 ] & 0xff ) << 16 )
      | ( ( src[ index + 3 ] & 0xff ) << 24 );
  }

  readUShort(src, index)
  {
    return ( src[ index ] & 0xff ) | ( ( src[ index + 1 ] & 0xff ) << 8 );
  }

  readSecurityBuffer(src, index)
  {
    var length = this.readUShort(src, index);
    var offset = this.readULong(src, index + 4);
    var buffer = new Array();
    buffer = buffer.concat(src.slice(offset, offset + length));
    return buffer;
  }

  writeULong(dst, offset, ulong)
  {
    /*dst = Buffer.from(dst);
    ulong = ulong - Math.floor(ulong/Math.pow(2, 32)) * Math.pow(2, 32);
    dst.writeUInt32LE(ulong, offset);*/
    dst[ offset ] = ( ulong & 0xff );
    dst[ offset + 1 ] = ( ulong >> 8 & 0xff );
    dst[ offset + 2 ] = ( ulong >> 16 & 0xff );
    dst[ offset + 3 ] = ( ulong >> 24 & 0xff );
  }

  writeUShort(dst, offset, ushort)
  {
    dst[ offset ] = ( ushort & 0xff );
    dst[ offset + 1 ] = ( ushort >> 8 & 0xff );
  }

  writeSecurityBuffer (dst, offset, src, bodyOffset) {
    var length = ( src != null ) ? src.length : 0;
    if ( length == 0 ) {
        return offset + 4;
    }
    this.writeUShort(dst, offset, length);
    this.writeUShort(dst, offset + 2, length);
    this.writeULong(dst, offset + 4, bodyOffset);
    return offset + 4;
  }

  writeSecurityBufferContent (dst, pos, off, src ) {
    this.writeULong(dst, off, pos);
    if ( src != null && src.length > 0 ) {
        var aux = src.slice(0, src.length);
        var aux_i = pos;
        while (aux.length > 0) {
          dst.splice(aux_i++, 1, aux.shift());
        }
        return src.length;
    }
    return 0;
  }

  getOEMEncoding () {
    return this.OEM_ENCODING;
  }

  toByteArray (){};
}

module.exports = NtlmMessage;
