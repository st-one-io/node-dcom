var ProtocolVersion = require("../core/protocolVersion.js");
var ConnectionOrientedPdu = require("../connectionorientedpdu.js");

class BindNoAcknowledgePdu extends ConnectionOrientedPdu{
  constructor(){
    super();
    this.BIND_NO_ACKNOWLEDGE_TYPE = 0x0d;
    this.REASON_NOT_SPECIFIED = 0;
    this.TEMPORARY_CONGESTION = 1;
    this.LOCAL_LIMIT_EXCEEDED = 2;
    this.CALLED_PADDR_UNKNOWN = 3;
    this.PROTOCOL_VERSION_NOT_SUPPORTED= 4;
    this.DEFAULT_CONTEXT_NOT_SUPPORTED = 5;
    this.USER_DATA_NOT_READABLE = 6;
    this.NO_PSAP_AVAILABLE = 7;

    this.versionList;
    this.rejectReason = this.REASON_NOT_SPECIFIED;
  }

  getType(){
    return this.BIND_NO_ACKNOWLEDGE_TYPE;
  }

  getRejectReason(){
    return this.rejectReason;
  }

  setRejectReason(rejectReason){
    this.rejectReason = rejectReason;
  }

  getVersionList(){
    return this.versionList;
  }

  setVersionList(versionList){
    this.versionList = versionList;
  }

  readBody(ndr){
    var reason = ndr.readUnsignedSmall();
    rejectReason(reason);
    var versionList = null;
    if (reason == PROTOCOL_VERSION_NOT_SUPPORTED){
      var count = ndr.readUndignedSmall();
      versionList = [count];
      for (var i = 0; i < count; i++){
        versionList[i] = new ProtocolVersion();
        versionList[i].read(ndr);
      }
    }
    versionList(versionList);
  }
}

module.exports = BindNoAcknowledgePdu;
