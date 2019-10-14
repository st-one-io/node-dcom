// @ts-check
const ndrBuffer = require('../../ndr/ndrbuffer.js');
const ndrOjbect = require('../../ndr/ndrobject.js');
const hexDump = require('../../ndr/hexdump.js');
const NetworkDataRepresentation = require('../../ndr/networkdatarepresentation.js');

/**
 * This class defines the properites of an UUID object.
 */
class UUID {
  /**
   * Defines a few constants and parse the given UUID (here as a string).
   * @param {String} uuid
   */
  constructor(uuid) {
    this.NIL_UUID = '00000000-0000-0000-0000-000000000000';

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

    this.parse(uuid);
  }

  /**
   *
   * @param {NetworkDataRepresentation} ndr
   * @param {NdrBuffer} dst
   */
  encode(ndr, dst) {
    dst.enc_ndr_long(this.timeLow);
    dst.enc_ndr_short(this.timeMid);
    dst.enc_ndr_short(this.timeHighAndVersion);
    dst.enc_ndr_small(this.clockSeqHighAndReserved);
    dst.enc_ndr_small(this.clockSeqLow);

    let begin = dst.buf.slice(0, dst.index);
    let end = dst.buf.slice((this.node.length + dst.index), dst.buf.byteLength);
    let middle = Buffer.from(this.node.slice(0, 6));
    dst.buf = Buffer.concat([begin, middle, end]);
    //dst.buf = begin.concat(middle.concat(end));
    
    dst.index += 6;
  }

  /**
   *
   * @param {NetworkDataRepresentation} ndr
   * @param {NdrBuffer} src
   */
  decode(ndr, src) {
    this.timeLow = src.dec_ndr_long();
    this.timeMid = src.dec_ndr_short();
    this.timeHighAndVersion = src.dec_ndr_short();
    this.clockSeqHighAndReserved = src.dec_ndr_small();
    this.clockSeqLow = src.dec_ndr_small();

    this.node = src.buf.slice(src.index, (src.index + 6));
    src.index += 6;
  }

  /**
   * @return {String}
   */
  toString() {
    let buffer = String('');

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

    buffer = buffer.concat(
        hexDump.toHexString((this.timeHighAndVersion >> 12) & 0x0f, 1));
    buffer = buffer.concat(
        hexDump.toHexString((this.timeHighAndVersion >> 8) & 0x0f, 1));
    buffer = buffer.concat(
        hexDump.toHexString((this.timeHighAndVersion >> 4) & 0x0f, 1));
    buffer = buffer.concat(
        hexDump.toHexString(this.timeHighAndVersion & 0x0f, 1));
    buffer = buffer.concat('-');

    buffer = buffer.concat(
        hexDump.toHexString((this.clockSeqHighAndReserved >> 4) & 0x0f, 1));
    buffer = buffer.concat(
        hexDump.toHexString(this.clockSeqHighAndReserved & 0x0f, 1));

    buffer = buffer.concat(
        hexDump.toHexString((this.clockSeqLow >> 4) & 0x0f, 1));
    buffer = buffer.concat(hexDump.toHexString(this.clockSeqLow & 0x0f, 1));
    buffer = buffer.concat('-');

    for (let i = 0; i < 6; i++) {
      buffer = buffer.concat(
          hexDump.toHexString((this.node[i] >> 4) & 0x0f, 1));
      buffer = buffer.concat(hexDump.toHexString(this.node[i] & 0x0f, 1));
    }
    return String(buffer);
  }

  /**
   * Parses the given uuid string.
   * @param {String} uuid
   */
  parse(uuid) {
    if (uuid == undefined) {
      return;
    }

    const count = 0;
    const temp = uuid.split('-');

    this.timeLow = Number.parseInt(temp[0], 16);
    this.timeMid = Number.parseInt(temp[1], 16);
    this.timeHighAndVersion = Number.parseInt(temp[2], 16);
    let token = temp[3];

    this.clockSeqHighAndReserved = Number.parseInt(token.substring(0, 2), 16);
    this.clockSeqLow = Number.parseInt(token.substring(2), 16);

    token = temp[4];
    for (let i = 0; i < 6; i++) {
      const offset = i * 2;
      this.node[i] = ((Number.parseInt(token.charAt(offset), 16) << 4) |
        (Number.parseInt(token.charAt(offset + 1),16)));
    }
  }
}
module.exports = UUID;
