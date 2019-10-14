// @ts-check

/**
 * Buffer class
 */
class Buffer {
  /**
   *
   * @param {Array} buffer
   * @param {Number} capacityIncrement
   */
  constructor(buffer, capacityIncrement) {
    this.NO_INCREMENT = 0;

    if (buffer == undefined) {
      this.buffer = null;
    } else {
      this.buffer = buffer;
    }

    if(capacityIncrement == undefined) {
      this.capacityIncrement = this.NO_INCREMENT;
    } else {
      this.capacityIncrement = capacityIncrement;
    }

    this.index = 0;
    this.length;
  }

  /**
   * @return {Number}
   */
  getCapacityIncrement() {
    return this.capacityIncrement;
  }

  /**
   * @return {Number}
   */
  getCapacity() {
    return this.buffer.length;
  }

  setCapacityIncrement(capacityIncrement) {
    this.capacityIncrement = capacityIncrement;
  }

  /**
   * @return {Array}
   */
  getBuffer() {
    return this.buffer;
  }

  /**
   *
   * @param {Array} buffer
   */
  setBuffer(buffer) {
    this.buffer = buffer;
  }

  /**
   * @return {Number}
   */
  getLength() {
    return this.length;
  }

  /**
   *
   * @param {Number} length
   */
  setLength(length) {
    this.length = length;
  }

  /**
   * @return {Array}
   */
  copy() {
    let copy = [this.length];
    let temp = buffer.slice(0, this.length);
    let temp_index= 0;
    while (temp > 0) {
      copy.splice(temp_index++, 0, temp.shift());
    }
    return copy;
  }

  reset() {
    this.lenght = 0
    this.index = 0;
  }

  /**
   * @return {Number}
   */
  getIndex() {
    return this.index;
  }

  /**
   * @param {Number} advance
   * @return {Number}
   */
  getIndex2(advance) {
    try {
      return this.index;
    } finally {
      this.index += advance;
      if (this.index > this.length) this.length = this.index;
      if (this.length > this.buffer.length) this.grow(this.length);
    }
  }

  /**
   *
   * @param {Number} index
   */
  setIndex(index) {
    this.index = index;
    if (this.index > this.length) this.length = this.index;
    if (this.length > this.buffer.length) this.grow(this.length);
  }

  /**
   * @param {Number} boundary
   * @param {Number} value
   * @return {Number}
   */
  align(boundary, value) {
    let align = this.index % boundary;
    if (align == 0) return 0;
    if (value == undefined) {
      this.advance(align = boundary - align, null);
      return align;
    } else {
      this.advance(align = boundary - align, value);
      return align;
    }
  }

  /**
   *
   * @param {Number} step
   * @param {Number} value
   */
  advance(step, value) {
    if (value == undefined) {
      this.index += step;
    } else {
      for (let finish = this.index + step; this.index < finish; this.index++) {
        this.buffer[this.index] = value;
      }
    }
    if (this.index > this.length) this.length = this.index;
    if (this.length > this.buffer.length) this.grow(this.length);
  }

  /**
   *
   * @param {Number} length
   */
  grow(length) {
    let newLength = this.buffer.length;
    while (newLength < this.length) {
      newLength += this.capacityIncrement;
    }
    let newBuffer = [newLength];

    let temp = this.buffer.slice(0, this.buffer.length);
    let temp_index;
    while (temp.length > 0) {
      newBuffer.splice(temp_index, 0, temp.shift());
    }
    this.buffer = newBuffer;
  }
}

module.export = Buffer;
