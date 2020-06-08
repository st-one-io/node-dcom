const Stub = require('../rpc/stub');
const PingObject = require('./pingObject');
const Endpoint = require('../rpc/connectionorientedendpoint');
const ComTransportFactory = require('../transport/comtransportfactory');
const util = require('util');
const debug = util.debuglog('dcom');

class OXIDStub extends Stub{
  constructor(server) {
    super();
    this.server = server;
    this.setAddress(server.getAddress());
    this.setTransportFactory(new ComTransportFactory().getSingleTon());
    this.info = server.info;
    this.timer = setTimeout(this.pingIPIDS, 120000, this);
  }

  /**
   * @returns {String}
   */
  getSyntax() {
    return "99fcfec4-5260-101b-bbcb-00aa0021347a:0.0";
  }

  /**
   * Close everything that must be closed
   * @param {Session} session 
   */
  async destroySessionOIDs(session){
    // removes the pingHolder for this session
    session.mapOfSessionvsIPIDPingHolders.delete(session);
    // closes the connection used for pings
    await this.detach();
    clearTimeout(this.timer);
  }
  /**
   * 
   * @param {OXIDStub} oxid 
   */
  async pingIPIDS(oxid) {
      let list = oxid.server.session.mapOfSessionvsIPIDPingHolders.keys();
      //console.log(list.length);
      while(list.length > 0) {
        let key = list.pop();
        let holder = oxid.server.session.mapOfSessionvsIPIDPingHolders.get(key);

        let pingObject = new PingObject();

        let list2 = holder.currentSetOIDs.entries();
        while(list2.length > 0) {
          let oid = list2.pop()[1];
          if (oid.getIPIDRefCount() == 0) {
            if (!oid.dontping) {
              pingObject.listOfDels.push(oid);
              holder.pingedOnce.delete(oid);
              holder.modified = true;
            }
          } else {
            if (!oid.dontping && !holder.pingedOnce.get(oid)) {
              pingObject.listOfAdds.push(oid);
              holder.pingedOnce.set(oid, oid);
              holder.modified = true;
            }
          }
        }

        if (holder.setId == null) {
          pingObject.listOfDels = new Array();
        }

        let isSimplePing = false;

        if (holder.setId != null && !holder.modified) {
          isSimplePing = true;
        }
        
        pingObject.opnum = (isSimplePing)? 1 : 2;
        pingObject.seqNum = (isSimplePing)? 0 : holder.seqNum++;
        pingObject.setId = (holder.setId)? holder.setId: null;

        let info = oxid.info;
        let timeout = oxid.server.session.timeout;
        debug("sending ping");
        //console.log("SENDING PING!");
        await oxid.call(Endpoint.IDEMPOTENT, pingObject, info, timeout)
          .catch(function(reject) {
            debug(new Error("Ping: " + reject));
            //console.log("ERRO");
            clearInterval(oxid.timer);
          });
        holder.setId = pingObject.setId;
        //console.log("PING SUCCESSFULL");
        clearInterval(oxid.timer);
        oxid.timer = setTimeout(oxid.pingIPIDS, 120000, oxid)
        holder.modified = false;
        //oxid.server.session.mapOfSessionvsIPIDPingHolders.delete(key);
        //oxid.server.session.mapOfSessionvsIPIDPingHolders.set(key, holder);
      }
    }
}

module.exports = OXIDStub;