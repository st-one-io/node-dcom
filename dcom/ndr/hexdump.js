// @ts-check
const os = require('os');

module.exports = {
  hexdump,
  toHexString,
  toHexStringByte,
  toHexChars
};

const SPACE_CHARS = [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',
  ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',
  ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',
  ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',
  ' ', ' ', ' ', ' '];
const HEX_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8',
  '9', 'A', 'B', 'C', 'D', 'E', 'F'];
const NL = os.EOL;
const NL_LENGTH = NL.length;

/**
 *
 * @param {Array} src
 * @param {Number} srcIndex
 * @param {Number} length
 */
function hexdump(src, srcIndex, length) {
  if (length == 0) {
    return;
  }

  let s = length % 16;
  let r = (s == 0) ? length/16 : length/16  + 1;
  let c = [r * (74 + NL_LENGTH)];
  let d = [16];
  let i;
  let si = 0;
  let ci = 0;

  do {
    toHexChars(si, c, ci, 5);
    ci += 5;
    c[ci++] = ';';
    do {
      if (si == length) {
        let n = 16 - s;
        let tmp = SPACE_CHARS.slice(0, (0 + n * 3));
        let tmp_index = ci;
        while (tmp.length > 0) {
          c.splice(tmp_index++, 0, tmp.shift());
        }
        ci += n * 3;
        tmp = SPACE_CHARS.slice(0, n);
        tmp_index = s;
        while (tmp.length > 0) {
          d.splice(tmp_index, 0, tmp.shift());
        }
        break;
      }
      c[ci++] = ' ';
      i = src[srcIndex + si] & 0xFF;
      toHexChars(i, c, ci, 2);
      ci += 2;
      if (i < 0 || isISOControl(i)) {
        d[si % 16] = '.';
      } else {
        d[si % 16] = i;
      }
    } while ((++si % 16) != 0);
    c[ci++] = ' ';
    c[ci++] = ' ';
    c[ci++] = '|';
    tmp = d.slice(0, 16);
    tmp_index = ci;
    while (tmp.length > 0) {
      {c.splice(tmp_index++, 0, tmp.shift());}
    }
    ci += 16;
    c[ci++] = '|';
    temp = c.slice(0, NL_LENGTH);
    c.splice(ci, 0, NL.slice(0, NL_LENGTH));
    ci += NL_LENGTH;
  } while (si < length);
  console.log(c);
}

/**
 *
 * @param {String} char
 * @return {Boolean}
 */
function isISOControl (char) {
  let code = char.charCodeAt(0);
  if (((code >= 0) && (code <= 31)) || ((code >= 127) && (code <= 159))) {
    return true;
  }
  return false;
}

/**
 * Converts an hexadecimal value to a String based on two parameters
 * @param {Number} val
 * @param {Number} size
 * @return {String}
 */
function toHexString(val, size) {
  let c = new Array(size);
  toHexChars(val, c, 0, size);
  return String(c);
}

/**
 *Converts an hexadecimal value to a String based on three parameters
 * @param {Array} src
 * @param {Number} srcIndex
 * @param {Number} size
 * @return {String}
 */
function toHexStringByte(src, srcIndex, size) {
  let c = [];
  let i; let j;
  for (i = 0, j = 0; i < size; i++) {
    c[j++] = HEX_DIGITS[(src[srcIndex + i] >> 4) & 0x0F];
    c[j++] = HEX_DIGITS[src[srcIndex + i] & 0x0F];
  }
  return String(c);
}
/**
* Converts an hexadecimal value to a String based on four parameters
* @param {Number} val
* @param {Array} dst
* @param {Number} dstIndex
* @param {Number} size
*/
function toHexChars(val, dst, dstIndex, size) {
  while (size > 0) {
    let i = dstIndex + size - 1;
    if (i < dst.length) {
      dst[i] = HEX_DIGITS[val & 0x000F];
    }
    if (val != 0) {
      val >>>= 4;
    }
    size--;
  }
}
