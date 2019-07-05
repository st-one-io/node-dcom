var SmbConstants = require('../../../ndr/smbconstants.js');

class NtlmMessage
{
  constructor()
  {
    this.SIGNATURE= ['N', 'T', 'L', 'M', 'S', 'S', 'P', 0];
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
    var buffer;
    buffer.concat(src.slice(offset, length));
    return buffer;
  }

  writeULong(dst, offset, ulong)
  {
    dest[ offset ] = ( ulong & 0xff );
    dest[ offset + 1 ] = ( ulong >> 8 & 0xff );
    dest[ offset + 2 ] = ( ulong >> 16 & 0xff );
    dest[ offset + 3 ] = ( ulong >> 24 & 0xff );
  }

  writeUShort(dst, offset, ushort)
  {
    dest[ offset ] = ( ushort & 0xff );
    dest[ offset + 1 ] = ( ushort >> 8 & 0xff );
  }

  writeSecurityBuffer (dest, offset, src) {
    var length = ( src != null ) ? src.length : 0;
    if ( length == 0 ) {
        return offset + 4;
    }
    writeUShort(dest, offset, length);
    writeUShort(dest, offset + 2, length);
    return offset + 4;
  }

  writeSecurityBufferContent (dest, pos, off, src ) {
    writeULong(dest, off, pos);
    if ( src != null && src.length > 0 ) {
        System.arraycopy(src, 0, dest, pos, src.length);
        return src.length;
    }
    return 0;
  }

  getOEMEncoding () {
    return OEM_ENCODING;
  }

  toByteArray (){};
}

module.exports = NtlmMessage;
