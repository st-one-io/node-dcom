// @ts-check
const ErrorCodes = require('../common/errorcodes');
const ComEndpoint = require('../transport/comendpoint');
const Stub = require('../rpc/stub');
const ComTransportFactory = require('../transport/comtransportfactory');
const Session = require('./session');
const CallBuilder = require('./callbuilder');
const UUID = require('../rpc/core/uuid');
const Endpoint = require('../rpc/connectionorientedendpoint.js');
const RemUnknown = require('./remunknown');
const util = require('util');
const debug = util.debuglog('dcom');

/**
 * Remote unknown server class
 */
class RemUnknownServer extends Stub {
    /**
     * 
     * @param {Session} session 
     * @param {String} remUnknownIpid 
     * @param {String} address 
     */
    constructor(session, remUnknownIpid, address, info){
        super();
        this.session = session;
        super.setTransportFactory(new ComTransportFactory().getSingleTon());
        
        if (session.isNTLMv2Enabled()) {

        } else {

        }

        if (session.isSessionSecurityEnabled()) {

        }

        this.syntax = "00000143-0000-0000-c000-000000000046:0.0";
        super.setAddress(address);
        this.remunknownIPID = remUnknownIpid;
        this.mutex = new Object();
        this.timeoutModifiedfrom0 = false;
        this.info = info;
        this.session.setStub2(this);
    }
    
    /**
     * @return {String}
     */
    getSyntax() {
        return this.syntax;
    }

    /**
     * 
     * @param {CallBuilder} obj
     * @param {String} targetIID
     * @param {String} socketTimeout
     */
    async callUnknown(obj, targetIID, socketTimeout) {
        if (this.session.isSessionInDestroy() && !obj.fromDestroySession) {
            throw new Error(String(new ErrorCodes().SESSION_DESTROYED));
        }

        if (socketTimeout) {
            this.setSocketTimeOut(socketTimeout);
        } else {
            if (this.timeoutModifiedfrom0) {
                this.setSocketTimeOut(socketTimeout);
            }
        }

        
        await this.attach(this.info, this.session.getGlobalSocketTimeout());

        if (!(this.getEndpoint().getSyntax().getUUID().toString().toUpperCase() == targetIID.toUpperCase())) {
            this.getEndpoint().getSyntax().setUUID(new UUID(targetIID));
            this.getEndpoint().getSyntax().setVersion(0, 0);
            await this.getEndpoint().rebind(this.info);
        }
        this.setObject(obj.getParentIpid());
        await super.call(Endpoint.IDEMPOTENT, obj, this.info);

        // now we check if there were any error
        if (obj.hresult != 0) {
            if (obj.outParams.length == 0) {
                throw new Error(String(obj.hresult));
            } else
                debug(String(new Error(String(obj.hresult))));
        }
        return obj.getResults();
    }

    /**
     * 
     * @param {CallBuilder} obj
     */
    async addRef_ReleaseRef(obj) {
        if (this.remunknownIPID == null) {
            return;
        }

        obj.setParentIpid(this.remunknownIPID);
        obj.attachSession(this.session);
        
        await this.callUnknown(obj, new RemUnknown().IID_Unknown, this.session.getGlobalSocketTimeout())
        .catch(function(error){
            debug(error);
        });
    }

    /**
     * Close the current connection stub
     */
    async closeStub() {
        await super.detach()
        .catch(function(error){
            debug(error);
        });
    }

    /**
     * 
     * @param {Number} timeout
     */
    setSocketTimeOut(timeout) {
        if (timeout == 0) {
            this.timeoutModifiedfrom0 = false;
        } else {
            this.timeoutModifiedfrom0 = true;
        }
    }
}

module.exports = RemUnknownServer;