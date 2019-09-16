// @ts-check
const NdrBuffer = require('../../ndr/ndrbuffer.js');
const NetworkDataRepresentation = require('../../ndr/networkdatarepresentation.js');
const UUID = require('./uuid.js');

/**
 * This class represents the syntax used on communication.
 */
class PresentationSyntax {
  /**
   *
   * @param {String} syntax
   * @param {Number} majorVersion
   * @param {Numbe} minorVersion
   */
  constructor(syntax, majorVersion, minorVersion) {
    this.uuid;
    this.version;

    if (arguments.length > 0) {
      // cast to object so we can use instanceof successfuly
      syntax = new String(syntax);

      if (syntax instanceof UUID) {
        this.setUUID(syntax);
        this.setVersion(majorVersion, minorVersion);
      } else if (syntax instanceof String) {
        this.parse(syntax);
      }
    }
  }

  /**
   * @return {UUID}
   */
  getUUID() {
    return this.uuid;
  };

  /**
   *
   * @param {UUID} uuid
   */
  setUUID(uuid) {
    this.uuid = uuid;
  };

  /**
   * @return {Number}
   */
  getVersion() {
    return this.version;
  };

  /**
   *
   * @param {Number} version
   */
  setVersion(version) {
    this.version = version;
  };

  /**
   * @return {Number}
   */
  getMajorVersion() {
    return this.version & 0xffff;
  };

  /**
   * @return {Number}
   */
  getMinorVersion() {
    return (this.version >> 16) & 0xffff;
  };

  /**
   *
   * @param {Number} majorVersion
   * @param {Number} minorVersion
   */
  setVersionTwo(majorVersion, minorVersion) {
    this.setVersion((majorVersion & 0xffff) | (minorVersion << 16));
  };

  /**
   *
   * @param {NetworkDataRepresentation} ndr
   * @param {NdrBuffer} dst
   */
  encode(ndr, dst) {
    this.uuid.encode(ndr, dst);
    dst.enc_ndr_long(this.version);
  };

  /**
   *
   * @param {NetworkDataRepresentation} ndr
   * @param {NdrBuffer} src
   */
  decode(ndr, src) {
    this.uuid = new UUID();
    this.uuid.decode(ndr, src);
    this.version = src.dec_ndr_long();
  };

  /**
   * @return {String}
   */
  toHexString() {
    return this.getUUID().toString() + ':' + this.getMajorVersion() + '.' +
      this.getMinorVersion();
  };

  /**
   *
   * @param {String} syntax
   */
  parse(syntax) {
    this.uuid = new UUID();
    let uuid_token = syntax.split(':')[0];
    let versions = (syntax.split(':'))[1].split('.');

    this.uuid.parse(uuid_token);
    this.setVersionTwo(Number.parseInt(versions[0]),
        Number.parseInt(versions[1]));
  };
}
module.exports = PresentationSyntax;
