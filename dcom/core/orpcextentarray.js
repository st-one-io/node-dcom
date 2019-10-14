// @ts-check

/**
 * OrpcExtentArray class
 */
class OrpcExtentArray {
  /**
     *
     * @param {string} guid
     * @param {number} size
     * @param {Buffer} data
     */
  constructor(guid, size, data) {
    this.uuid = guid;
    this.size = size;
    this.data = data;
  }

  /**
   * @return {UUID}
   */
  getGUID() {
    return this.uuid;
  }
  /**
   * @return {Number}
   */
  getSizeOfData() {
    return this.size;
  }

  /**
   * @return {Array}
   */
  getData() {
    return this.data;
  }
}

module.exports = OrpcExtentArray;
