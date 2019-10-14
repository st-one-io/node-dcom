/**
 * An object to store COM versio information
 */
class ComVersion {
  /**
   *
   * @param {Number} majorVersion
   * @param {Number} minorVersion
   */
  constructor(majorVersion, minorVersion) {
    this.serialVersionUID = '-1252228963385487909L';
    this.majorVersion = (majorVersion) ? majorVersion : 5;
    this.minorVersion= (minorVersion) ? minorVersion : 4;
  }

  /**
   * @return {Number}
   */
  getMajorVersion() {
    return this.majorVersion;
  }

  /**
   *
   * @param {Number} majorVersion
   */
  setMajorVersion(majorVersion) {
    this.majorVersion = majorVersion;
  }

  /**
   * @return {Number}
   */
  getMinorVersion() {
    return this.minorVersion;
  }

  /**
   *
   * @param {Number} minorVersion
   */
  setMinorVersion(minorVersion) {
    this.minorVersion = minorVersion;
  }
}

module.exports = ComVersion;
