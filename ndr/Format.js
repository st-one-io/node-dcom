
module.exports = function Format (dataRepresentation){
  this.LITTLE_ENDIAN = 0x10000000;
  this.BIG_ENDIAN = 0x00000000;

  this.ASCII_CHARACTER = 0x00000000;
  this.EBCDIC_CHRACATER = 0x01000000;

  this.IEEE_FLOATING_POINT = 0x00000000;
  this.VAX_FLOATING_POINT = 0x00010000;
  this.CRAY_FLOATING_POINT = 0x00100000;
  this.IBM_FLOATING_POINT = 0x00110000;

  this.DEFAULT_DATA_REPRESENTATION = this.LITTLE_ENDIAN |this.ASCII_CHARACTER
  | this.IEEE_FLOATING_POINT;

  this.BYTE_ORDER_MASK = 0xf0000000;
  this.CHARACTER_MASK = 0x0f000000;
  this.FLOATING_POINT_MASK = 0x00ff0000;

  // initializing the object
  this.dataRepresentation = dataRepresentation;
  if ((dataRepresentation & this.BYTE_ORDER_MASK) != this.LITTLE_ENDIAN){
    throw new Error("Only little-endian byte order is currently supported.");
  }

  if((dataRepresentation & this.CHARACTER_MASK) != this.ASCII_CHARACTER){
    throw new Error("Only ASCII character set is currently supported.");
  }

  if((dataRepresentation & this.FLOATING_POINT_MASK) != this.IEEE_FLOATING_POINT){
    throw new Error("Only IEEE floating point is currently supported.");
  }

  this.getDefaultFormat = function (){
    return new Format(this.DEFAULT_DATA_REPRESENTATION);
  }

  this.getDataRepresentation = function (){
    return this.dataRepresentation;
  }

  this.readFormat = function (src, index, connectionless){
    var value = src[index++] << 24;
    value |= (src[index++] & 0xff) << 16;
    value |= (src[index++] & 0xff) << 8;
    if (!connectionless) value |= src[index] & 0xff;
    console.log(value);
    return new Format(value);
  }

  this.writeFormat = function (dest, index, connectionless){
    var val = getDataRepresentation();
    dest[index++] = ((val >> 24) & 0xff);
    dest[index++] = ((val >> 16) & 0xff);
    dest[index] = 0x00;
    if (!connectionless) dest[++index] = 0x00;
  }
}
