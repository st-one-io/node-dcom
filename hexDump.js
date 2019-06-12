


module.exports = {
  toHexString,
  toHexStringByte,
  toHexChars
};

const HEX_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];

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
      console.log(val, dst, dstIndex, size);
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
