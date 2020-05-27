var hexDump = require("./hexdump");
var Format = require("./format.js");

function NetworkDataRepresentation(){
  this.NDR_UUID = "8a885d04-1ceb-11c9-9fe8-08002b104860";

  this.NDR_MAJOR_VERSION = 2;

  this.NDR_MINOR_VERSION = 0;

  this.NDR_SYNTAX = String(this.NDR_UUID + ":" + this.NDR_MAJOR_VERSION + "."
  + this.NDR_MINOR_VERSION);

  this.ptr;
  this.buf;
  this.format;
};

NetworkDataRepresentation.prototype.setBuffer = function (buf){
  this.buf = buf;
}

NetworkDataRepresentation.prototype.getBuffer = function (){
  return this.buf;
}

NetworkDataRepresentation.prototype.hexdump = function (count){
  hexDump.hexdump(buf.buf, buf.index, count);
}

NetworkDataRepresentation.prototype.readBoolean = function (){
  return buf.dec_ndr_small() == 0 ? false : true;
}

NetworkDataRepresentation.prototype.writeBoolean = function (value){
  this.buf.enc_ndr_small(value ? 1 : 0);
}

NetworkDataRepresentation.prototype.readUnsignedSmall = function (){
  return this.buf.dec_ndr_small();
}

NetworkDataRepresentation.prototype.readUnsignedShort = function (){
  return this.buf.dec_ndr_short();
}

NetworkDataRepresentation.prototype.readUnsignedLong = function (){
  return this.buf.dec_ndr_long();
}

NetworkDataRepresentation.prototype.writeUnsignedSmall = function (value){
  this.buf.enc_ndr_small(value);
}

NetworkDataRepresentation.prototype.writeUnsignedShort = function (value){
  this.buf.enc_ndr_short(value);
}

NetworkDataRepresentation.prototype.writeUnsignedLong = function (value){
  this.buf.enc_ndr_long(value);
}

NetworkDataRepresentation.prototype.setFormat = function (format){
  this.format = format;
}

NetworkDataRepresentation.prototype.getFormat = function (){
  return this.format;
}

NetworkDataRepresentation.prototype.readFormat = function (connectionless){
  var format = new Format().readFormat(this.buf.buf, this.buf.index, connectionless);
  this.buf.index += 4;
  return format;
}

NetworkDataRepresentation.prototype.writeFormat = function (format){
  format.writeFormat(this.buf.buf, this.buf,index, false);
  this.buf.index += 4;
}

NetworkDataRepresentation.prototype.writeFormatBool = function (connectionless){
  var index = this.buf.getIndex();
  this.buf.index += connectionless ? 3 : 4;
  this.format.writeFormat(this.buf.buf, index, connectionless);
}

NetworkDataRepresentation.prototype.readCharacterArray = function (array, offset, length){
  if (array == null || length == 0) return;
  length += offset;
  for (var i = offset; i < length; i++){
    array[i] = Buffer.from([this.buf.buf[this.buf.index++]]).toString();
  }
}

NetworkDataRepresentation.prototype.writeCharacterArray = function (array, offset, length){
  if ( array == null || length == 0 )
    return;
  length += offset;
  for (let i = offset; i < length; i++ )
    this.buf.buf[buf.index++] = Buffer.from(array[i]);
}

NetworkDataRepresentation.prototype.writeOctetArray = function (b, i, l){
  this.buf.writeOctetArray(b, i, l);
}

NetworkDataRepresentation.prototype.readOctetArray = function (b, i, l){
  return this.buf.readOctetArray(b, i, l);
}

module.exports = NetworkDataRepresentation;
