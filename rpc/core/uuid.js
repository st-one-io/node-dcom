var ndrBuffer = require("../../ndr/ndrbuffer.js");
var ndrOjbect = require("../../ndr/ndrobject.js");
var hexDump = require("../../ndr/hexdump.js");
var NetworkDataRepresentation = require("../../ndr/networkdatarepresentation.js");

function UUID(uuid){
  this.NIL_UUID = "00000000-0000-0000-0000-000000000000";

  this.TIMELOW_INDEX = 0;
  this.TIMEMID_INDEX = 1;
  this.TIMEHIGHANDVERSION_INDEX = 2;

  this.CLOCKSEQHIGHANDRESERVED_INDEX = 3;
  this.CLOCKSEQLOW_INDEX = 4;

  this.NODE_INDEX = 5;

  this.timeLow;
  this.timeMid;
  this.timeHighAndVersion;
  this.clockSeqHighAndReserved;
  this.clockSewLow;
  this.node = [6];

  this.parse(uuid);
};

UUID.prototype.encode = function (ndr, dst){
  dst.enc_ndr_long(timeLow);
  dst.enc_ndr_short(timeMid);
  dst.enc_ndr_short(timeHighAndVersion);
  dst.enc_ndr_small(clockSeqHighAndReserved);
  dst.enc_ndr_small(clockSewLow);

  var temp = this.node.slice(0, 6);
  while(temp.length > 0)
    dst.buf.splice(dst.index, 0, temp.shift());
  dst.index += 6;
}

UUID.prototype.decode = function (ndr, src){
  timeLow = src.dec_ndr_long();
  timeMid = src.dec_ndr_short();
  timeHighAndVersion = src.dec_ndr_short();
  clockSeqHighAndReserved = src.dec_ndr_small();
  clockSewLow = src.dec_ndr_small();

  var temp = this.node.slice(0, 6);
  while(temp.length > 0)
    dst.buf.splice(dst.index, 0, temp.shift());
  dst.index += 6;
}

UUID.prototype.toString = function(){
  var buffer = String("");

  buffer.concat(hexDump.toHexString((timeLow >> 28) & 0x0f));
  buffer.concat(hexDump.toHexString((timeLow >> 24) & 0x0f));
  buffer.concat(hexDump.toHexString((timeLow >> 20) & 0x0f));
  buffer.concat(hexDump.toHexString((timeLow >> 16) & 0x0f));
  buffer.concat(hexDump.toHexString((timeLow >> 12) & 0x0f));
  buffer.concat(hexDump.toHexString((timeLow >> 8) & 0x0f));
  buffer.concat(hexDump.toHexString((timeLow >> 4) & 0x0f));
  buffer.concat(hexDump.toHexString(timeLow & 0x0f));
  buffer.concat('-');

  buffer.concat(hexDump.toHexString((timeMid >> 12) & 0x0f));
  buffer.concat(hexDump.toHexString((timeMid >> 8) & 0x0f));
  buffer.concat(hexDump.toHexString((timeMid >> 4) & 0x0f));
  buffer.concat(hexDump.toHexString(timeMid & 0x0f));
  buffer.concat('-');

  buffer.concat(hexDump.toHexString((timeHighAndVersion >> 12) & 0x0f));
  buffer.concat(hexDump.toHexString((timeHighAndVersion >> 8) & 0x0f));
  buffer.concat(hexDump.toHexString((timeHighAndVersion >> 4) & 0x0f));
  buffer.concat(hexDump.toHexString(timeHighAndVersion & 0x0f));
  buffer.concat('-');

  buffer.concat(hexDump.toHexString((clockSeqHighAndReserved >> 4) & 0x0f));
  buffer.concat(hexDump.toHexString(clockSeqHighAndReserved & 0x0f));

  buffer.concat(hexDump.toHexString((clockSeqLow >> 4) & 0x0f));
  buffer.concat(hexDump.toHexString(clockSeqLow & 0x0f));
  buffer.concat('-');

  for (var i = 0; i < 6; i++) {
    buffer.concat(hexDump.toHexString((node[i] >> 4) & 0x0f));
    buffer.concat(hexDump.toHexString(node[i] & 0x0f));
  }
  return String(buffer);
}

UUID.prototype.parse = function(uuid){
  var count = 0;
  var temp = uuid.split("-");

  this.timeLow = Number.parseInt(temp[0], 16);
  this.timeMid = Number.parseInt(temp[1], 16);
  this.timeHighAndVersion = Number.parseInt(temp[2], 16);

  var token = temp[3];
  this.clockSeqHighAndReserved = Number.parseInt(token.substring(0, 2), 16);
  this.clockSeqLow = Number.parseInt(token.substring(2), 16);

  token = temp[4];
  for (var i = 0; i < 6; i++){
    var offset = i * 2;
    this.node[i] = ((Number.parseInt(token[offset], 16) << 4) | (Number.parseInt(token[offset + 1],16)));
  }
  //console.log(this.timeLow, this.timeMid, this.timeHighAndVersion, this.clockSeqHighAndReserved, this.clockSeqLow, this.node);
}

module.exports = UUID;
