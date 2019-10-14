// @ts-check
const ProtocolVersion = require('../core/protocolVersion.js');
const ConnectionOrientedPdu = require('../connectionorientedpdu.js');

/**
 * This class represents a BindNoAck data packet
 */
class BindNoAcknowledgePdu extends ConnectionOrientedPdu {
  /**
   * This is a simple constructor with no input parameters
   */
  constructor() {
    super();
    this.REASON_NOT_SPECIFIED = 0;
    this.TEMPORARY_CONGESTION = 1;
    this.LOCAL_LIMIT_EXCEEDED = 2;
    this.CALLED_PADDR_UNKNOWN = 3;
    this.PROTOCOL_VERSION_NOT_SUPPORTED= 4;
    this.DEFAULT_CONTEXT_NOT_SUPPORTED = 5;
    this.USER_DATA_NOT_READABLE = 6;
    this.NO_PSAP_AVAILABLE = 7;

    this.type = 0x0d;
    this.versionList;
    this.rejectReason = this.REASON_NOT_SPECIFIED;
  }

  /**
   * @return {Number}
   */
  getType() {
    return this.type;
  }

  /**
   * @return {Number}
   */
  getRejectReason() {
    return this.rejectReason;
  }

  /**
   *
   * @param {Number} rejectReason
   */
  setRejectReason(rejectReason) {
    this.rejectReason = rejectReason;
  }

  /**
   * @return {Array}
   */
  getVersionList() {
    return this.versionList;
  }

  /**
   *
   * @param {Array} versionList
   */
  setVersionList(versionList) {
    this.versionList = versionList;
  }

  /**
   *
   * @param {NetworkDataRepresentation} ndr
   */
  readBody(ndr) {
    let reason = ndr.readUnsignedSmall();
    this.setRejectReason(reason);
    let versionList = null;
    if (reason == this.PROTOCOL_VERSION_NOT_SUPPORTED) {
      let count = ndr.readUndignedSmall();
      versionList = [count];
      for (let i = 0; i < count; i++) {
        versionList[i] = new ProtocolVersion();
        versionList[i].read(ndr);
      }
    }
    this.setVersionList(versionList);
  }
}

BindNoAcknowledgePdu.BIND_NO_ACKNOWLEDGE_TYPE = 0x0d;
module.exports = BindNoAcknowledgePdu;
