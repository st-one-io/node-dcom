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
    this.clockSewLow;
    //this.node = [6];
    this.node1;
    this.node2;
    this.node3;
    this.parse(uuid);
  }

  encode (ndr, dst){
    dst.enc_ndr_long(this.timeLow);
    dst.enc_ndr_short(this.timeMid);
    dst.enc_ndr_short(this.timeHighAndVersion);
    dst.enc_ndr_small(this.clockSeqHighAndReserved);
    dst.enc_ndr_small(this.clockSewLow);
    dst.enc_ndr_short(this.node1);
    dst.enc_ndr_short(this.node2);
    dst.enc_ndr_short(this.node3);

    //var temp = this.node.slice(0, 6);
    //while(temp.length > 0)
    //  dst.buf.splice(dst.index, 0, temp.shift());
    //dst.index += 6;
  }

  decode (ndr, src){
    this.timeLow = src.dec_ndr_long();
    this.timeMid = src.dec_ndr_short();
    this.timeHighAndVersion = src.dec_ndr_short();
    this.clockSeqHighAndReserved = src.dec_ndr_small();
    this.clockSewLow = src.dec_ndr_small();
    this.ndoe1 = src.dec_ndr_short();
    this.ndoe2 = src.dec_ndr_short();
    this.ndoe3 = src.dec_ndr_short();

    //var temp = this.node.slice(0, 6);
    //var temp_index= dst.index;
    //while(temp.length > 0)
    //  dst.buf.splice(temp_index++, 0, temp.shift());
    //dst.index += 6;
  }

  toString(){
    var buffer = String("");

    buffer.concat(hexDump.toHexString((this.timeLow >> 28) & 0x0f));
    buffer.concat(hexDump.toHexString((this.timeLow >> 24) & 0x0f));
    buffer.concat(hexDump.toHexString((this.timeLow >> 20) & 0x0f));
    buffer.concat(hexDump.toHexString((this.timeLow >> 16) & 0x0f));
    buffer.concat(hexDump.toHexString((this.timeLow >> 12) & 0x0f));
    buffer.concat(hexDump.toHexString((this.timeLow >> 8) & 0x0f));
    buffer.concat(hexDump.toHexString((this.timeLow >> 4) & 0x0f));
    buffer.concat(hexDump.toHexString(this.timeLow & 0x0f));
    buffer.concat('-');

    buffer.concat(hexDump.toHexString((this.timeMid >> 12) & 0x0f));
    buffer.concat(hexDump.toHexString((this.timeMid >> 8) & 0x0f));
    buffer.concat(hexDump.toHexString((this.timeMid >> 4) & 0x0f));
    buffer.concat(hexDump.toHexString(this.timeMid & 0x0f));
    buffer.concat('-');

    buffer.concat(hexDump.toHexString((this.timeHighAndVersion >> 12) & 0x0f));
    buffer.concat(hexDump.toHexString((this.timeHighAndVersion >> 8) & 0x0f));
    buffer.concat(hexDump.toHexString((this.timeHighAndVersion >> 4) & 0x0f));
    buffer.concat(hexDump.toHexString(this.timeHighAndVersion & 0x0f));
    buffer.concat('-');

    buffer.concat(hexDump.toHexString((this.clockSeqHighAndReserved >> 4) & 0x0f));
    buffer.concat(hexDump.toHexString(this.clockSeqHighAndReserved & 0x0f));

    buffer.concat(hexDump.toHexString((this.clockSeqLow >> 4) & 0x0f));
    buffer.concat(hexDump.toHexString(this.clockSeqLow & 0x0f));
    buffer.concat('-');

    buffer.concat(hexDump.toHexString((this.node1 >> 12) & 0x0f));
    buffer.concat(hexDump.toHexString((this.node1 >> 8) & 0x0f));
    buffer.concat(hexDump.toHexString((this.node1 >> 4) & 0x0f));
    buffer.concat(hexDump.toHexString(this.node1 & 0x0f));
    buffer.concat(hexDump.toHexString((this.node2 >> 12) & 0x0f));
    buffer.concat(hexDump.toHexString((this.node2 >> 8) & 0x0f));
    buffer.concat(hexDump.toHexString((this.node2 >> 4) & 0x0f));
    buffer.concat(hexDump.toHexString(this.node2 & 0x0f));
    buffer.concat(hexDump.toHexString((this.node3 >> 12) & 0x0f));
    buffer.concat(hexDump.toHexString((this.node3 >> 8) & 0x0f));
    buffer.concat(hexDump.toHexString((this.node3 >> 4) & 0x0f));
    buffer.concat(hexDump.toHexString(this.node3 & 0x0f));

    //for (var i = 0; i < 6; i++) {
    //  buffer.concat(hexDump.toHexString((this.node[i] >> 4) & 0x0f));
    //  buffer.concat(hexDump.toHexString(this.node[i] & 0x0f));
    //}
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

    this.node1 = parseInt(temp[4].substr(0, 4), 16)
    this.node2 = parseInt(temp[4].substr(4, 4), 16)
    this.node3 = parseInt(temp[4].substr(8, 4), 16)

    //token = temp[4];
    //for (var i = 0; i < 6; i++){
    //  var offset = i * 2;
    //  this.node[i] = ((Number.parseInt(token[offset], 16) << 4) | (Number.parseInt(token[offset + 1],16)));
    //}
    //console.log(this.timeLow, this.timeMid, this.timeHighAndVersion, this.clockSeqHighAndReserved, this.clockSeqLow, this.node);
  }
}
module.exports = UUID;
