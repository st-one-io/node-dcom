// @ts-check
var ndrBuffer = require("../../ndr/ndrbuffer.js");
var ndrOjbect = require("../../ndr/ndrobject.js");
var hexDump = require("../../ndr/hexdump.js");
var NetworkDataRepresentation = require("../../ndr/networkdatarepresentation.js");

class UUID{
  constructor(uuid){
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
    this.clockSeqLow;
    this.node = new Array(6);
    //this.node1;
    //this.node2;
    //this.node3;
    this.parse(uuid);
  }

  encode (ndr, dst){
    dst.enc_ndr_long(this.timeLow);
    dst.enc_ndr_short(this.timeMid);
    dst.enc_ndr_short(this.timeHighAndVersion);
    dst.enc_ndr_small(this.clockSeqHighAndReserved);
    dst.enc_ndr_small(this.clockSeqLow);
    //dst.enc_ndr_short(this.node1);
    //dst.enc_ndr_short(this.node2);
    //dst.enc_ndr_short(this.node3);

    let begin = dst.buf.slice(0, dst.index);
    let end = dst.buf.slice((this.node.length + dst.index), dst.buf.byteLength);
    let middle = Buffer.from(this.node.slice(0, 6));
    dst.buf = Buffer.concat([begin, middle, end]);
    //dst.buf = begin.concat(middle.concat(end));
    
    dst.index += 6;
  }

  decode (ndr, src){
    this.timeLow = src.dec_ndr_long();
    this.timeMid = src.dec_ndr_short();
    this.timeHighAndVersion = src.dec_ndr_short();
    this.clockSeqHighAndReserved = src.dec_ndr_small();
    this.clockSeqLow = src.dec_ndr_small();

    this.node = src.buf.slice(src.index, (src.index + 6));
    src.index += 6;
  }

  toString(){
    var buffer = String("");

    buffer = buffer.concat(hexDump.toHexString((this.timeLow >> 28) & 0x0f, 1));
    buffer = buffer.concat(hexDump.toHexString((this.timeLow >> 24) & 0x0f, 1));
    buffer = buffer.concat(hexDump.toHexString((this.timeLow >> 20) & 0x0f, 1));
    buffer = buffer.concat(hexDump.toHexString((this.timeLow >> 16) & 0x0f, 1));
    buffer = buffer.concat(hexDump.toHexString((this.timeLow >> 12) & 0x0f, 1));
    buffer = buffer.concat(hexDump.toHexString((this.timeLow >> 8) & 0x0f, 1));
    buffer = buffer.concat(hexDump.toHexString((this.timeLow >> 4) & 0x0f, 1));
    buffer = buffer.concat(hexDump.toHexString(this.timeLow & 0x0f, 1));
    buffer = buffer.concat('-');

    buffer = buffer.concat(hexDump.toHexString((this.timeMid >> 12) & 0x0f, 1));
    buffer = buffer.concat(hexDump.toHexString((this.timeMid >> 8) & 0x0f, 1));
    buffer = buffer.concat(hexDump.toHexString((this.timeMid >> 4) & 0x0f, 1));
    buffer = buffer.concat(hexDump.toHexString(this.timeMid & 0x0f, 1));
    buffer = buffer.concat('-');

    buffer = buffer.concat(hexDump.toHexString((this.timeHighAndVersion >> 12) & 0x0f, 1));
    buffer = buffer.concat(hexDump.toHexString((this.timeHighAndVersion >> 8) & 0x0f, 1));
    buffer = buffer.concat(hexDump.toHexString((this.timeHighAndVersion >> 4) & 0x0f, 1));
    buffer = buffer.concat(hexDump.toHexString(this.timeHighAndVersion & 0x0f, 1));
    buffer = buffer.concat('-');

    buffer = buffer.concat(hexDump.toHexString((this.clockSeqHighAndReserved >> 4) & 0x0f, 1));
    buffer = buffer.concat(hexDump.toHexString(this.clockSeqHighAndReserved & 0x0f, 1));

    buffer = buffer.concat(hexDump.toHexString((this.clockSeqLow >> 4) & 0x0f, 1));
    buffer = buffer.concat(hexDump.toHexString(this.clockSeqLow & 0x0f, 1));
    buffer = buffer.concat('-');

    /*buffer = buffer.concat(hexDump.toHexString((this.node1 >> 12) & 0x0f, 1));
    buffer = buffer.concat(hexDump.toHexString((this.node1 >> 8) & 0x0f, 1));
    buffer = buffer.concat(hexDump.toHexString((this.node1 >> 4) & 0x0f, 1));
    buffer = buffer.concat(hexDump.toHexString(this.node1 & 0x0f, 1));
    buffer = buffer.concat(hexDump.toHexString((this.node2 >> 12) & 0x0f, 1));
    buffer = buffer.concat(hexDump.toHexString((this.node2 >> 8) & 0x0f, 1));
    buffer = buffer.concat(hexDump.toHexString((this.node2 >> 4) & 0x0f, 1));
    buffer = buffer.concat(hexDump.toHexString(this.node2 & 0x0f, 1));
    buffer = buffer.concat(hexDump.toHexString((this.node3 >> 12) & 0x0f, 1));
    buffer = buffer.concat(hexDump.toHexString((this.node3 >> 8) & 0x0f, 1));
    buffer = buffer.concat(hexDump.toHexString((this.node3 >> 4) & 0x0f, 1));
    buffer = buffer.concat(hexDump.toHexString(this.node3 & 0x0f, 1));*/

    for (var i = 0; i < 6; i++) {
      buffer = buffer.concat(hexDump.toHexString((this.node[i] >> 4) & 0x0f, 1));
      buffer = buffer.concat(hexDump.toHexString(this.node[i] & 0x0f, 1));
    }
    return String(buffer);
  }

  parse(uuid){
    if (uuid == undefined) {
      return;
    }

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
      this.node[i] = ((Number.parseInt(token.charAt(offset), 16) << 4) | (Number.parseInt(token.charAt(offset + 1),16)));
    }
  }
}
module.exports = UUID;
