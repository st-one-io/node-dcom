var hexDump = require("./hexDump");
var Format = require("./Format.js");

module.export = function NetworkDataRepresentation(){
  const NDR_UUID = "8a885d04-1ceb-11c9-9fe8-08002b104860";

  const NDR_MAJOR_VERSION = 2;

  const NDR_MINOR_VERSION = 0;

  const NDR_SYNTAX = String(NDR_UUID + ":" + NDR_MAJOR_VERSION + "."
                        + NDR_MINOR_VERSION);

  this.ptr;
  this.buf;
  this.format;

  this.setBuffer = function (buf){
    this.buf = buf;
  }

  this.getBuffer = function (){
    return this.buf;
  }

  this.hexdump = function (count){
    hexDump.hexdump(buf.buf, buf.index, count);
  }

  this.readBoolean() = function (){
    return buf.dec_ndr_small() == 0 ? false : true;
  }

  this.writeBoolean = function (value){
    this.buf.enc_ndr_small(value ? 1 : 0);
  }

  this.readUnsignedSmall = function (){
    return this.buf.dec_ndr_small();
  }

  this.readUnsignedShort = function (){
    return this.buf.dec_ndr_short();
  }

  this.readUnsignedLong = function (){
    return this.buf.dec_ndr_long();
  }

  this.writeUnsignedSmall = function (value){
    this.buf.enc_ndr_small(value);
  }

  this.writeUnsignedShort = function (value){
    this.buf.enc_ndr_short(value);
  }

  this.writeUnsignedLong = function (value){
    this.buf.enc_ndr_long(value);
  }

  this.setFormat = function (format){
    this.format = format;
  }

  this.getFormat = function (){
    return this.format;
  }

  this.readFormat = function (connectionless){
    var format = Format.readFormat(this.buf.buf, this.buf.index, connectionless);
    this.buf.index += 4;
    return format;
  }

  this.writeFormat = function (format){
    format.writeFormat(this.buf.buf, this.buf,index, false);
    this.buf.index += 4;
  }

  this.writeFormatBool = function (connectionless){
    var index = this.buf.getIndex();
    this.buf.index += connectionless ? 3 : 4;
    format.writeFormat(this.buf.buf, index, connectionless);
  }

  this.readCharacterArray = function (array, offset, length){
    if (array == null || length == 0) return;
    length += offset;
    for (var i = offset; i < length; i++){
      this.buf.buf[this.buf.index++] = array[i];
    }
  }

  this.writeOctetArray = function (b, i, l){
    this.buf.writeOctetArray(b, i, l);
  }

  this.readOctetArray = function (b, i, l){
    this.buf.readOctetArray(b, i, l);
  }
};
