var os = require("os");

module.exports = {
  hexdump,
  toHexString,
  toHexStringByte,
  toHexChars
};

const SPACE_CHARS = [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',
        ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',
        ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '
];
const HEX_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
const NL = os.EOL;
const NL_LENGTH = NL.length;

function hexdump(src, srcIndex, length){
  if (length == 0){
    return;
  }

  var s = length % 16;
  var r = (s == 0) ? length/16 : length/16  + 1;
  var c = [r * (74 + NL_LENGTH)];
  var d = [16];
  var i;
  var si = 0;
  var ci = 0;

  do{
    toHexChars(si, c, ci, 5);
    ci += 5;
    c[ci++] = ';';
    do{
      if (si == length){
        var n = 16 - s;
        var tmp = SPACE_CHARS.slice(0, (0 + n * 3));
        var tmp_index = ci;
        while(tmp.length > 0){
          c.splice(tmp_index++, 0, tmp.shift());
        }
        ci += n * 3;
        tmp = SPACE_CHARS.slice(0, n);
        tmp_index = s;
        while(tmp.length > 0){
          d.splice(tmp_index, 0, tmp.shift());
        }
        break;
      }
      c[ci++] = ' ';
      i = src[srcIndex + si] & 0xFF;
      toHexChars(i, c, ci, 2);
      ci += 2;
      if (i < 0 || isISOControl(i)){
        d[si % 16] = '.';
      }else{
        d[si % 16] = i;
      }
    }while((++si % 16) != 0);
    c[ci++] = ' ';
    c[ci++] = ' ';
    c[ci++] = '|';
    tmp = d.slice(0, 16);
    tmp_index = ci;
    while(tmp.length > 0)
      c.splice(tmp_index++, 0, tmp.shift());
    ci += 16;
    c[ci++] = '|';
    temp = c.slice(0, NL_LENGTH);
    c.splice(ci, 0, NL.slice(0, NL_LENGTH));
    ci += NL_LENGTH;
  }while(si < length);
    console.log(c);
}

function isISOControl (char){
  var code = char.charCodeAt(0);
  if (((code >= 0) && (code <= 31)) || ((code >= 127) && (code <= 159)))
    return true;
  return false;
}
/*
 * Converts an hexadecimal value to a String based on two parameters
 *
 * @param val
 * @param size
 * @return hex string
 */
function toHexString (val, size){
  var c = new Array(size);
  toHexChars(val, c, 0, size);
  return String(c);
}
// TO-DO: THE ABOVE FUNCTIO NHAS A VARIANT WITH A LONG, CHECK IF WILL E NEEDED
/*
 * Converts an hexadecimal value to a String based on three parameters
 *
 * @param src - ArrayBuffer
 * @param srcIndex - Number
 * @param size
 * @return hex string
 */
function toHexStringByte (src, srcIndex, size){
  var c = [];
  var i, j;
  for (i = 0, j = 0; i < size; i++){
    c[j++] = HEX_DIGITS[(src[srcIndex + i] >> 4) & 0x0F];
    c[j++] = HEX_DIGITS[src[srcIndex + i] & 0x0F];
  }
  return String(c);
}

/*
 * Converts an hexadecimal value to a String based on four parameters
 *
 * @param val - the value to be converted
 * @param dst - the destination string
 * @param dstIndex - the index to start at the dst string
 * @param size - the size of the buffer
 */
function toHexChars (val, dst, dstIndex, size){
  while (size > 0){
    var i = dstIndex + size - 1;
    if (i < dst.length){
      dst[i] = HEX_DIGITS[val & 0x000F];
    }
    if(val != 0){
      val >>>= 4;
    }
    size--;
  }
}
