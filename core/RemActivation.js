// @ts-check

const ComVersion = require('../common/comversion.js');
const System = require('../common/system.js');
const HashMap = require('hashmap');
const ServerActivation = require('./ServerActivation.js');
const UUID = require('../rpc/core/uuid.js');

/**
 * Remote Activation class
 */
class RemActivation extends ServerActivation {
    /**
     * 
     * @param {Clsid} clsid 
     */
    constructor(clsid) {
    super();
        this.impersonationLevel = this.TPC_C_IMP_LEVEL_IMPERSONATE;
        this.mode = 0;
        
        this.monikerName = null;
        this.clsid = new UUID(clsid);

        this.isActivationSuccessful = false;
        this.oprthat = null;
        this.oxid = null;

        this.getDualStringArrayForOxid = null;
        this.ipid = null;

        this.authenticationHint = -1;
        this.comVersion = null;
        this.hresult = -1;
        this.mInterfacePointer = null;
        this.isDual = false;
        this.dispIpid = null;
        this.dispRefs = 5;
        this.dispOid = null;
    }

    /**
     *
     * @param {Number} mode
     */
    setMode(mode) {
        this.mode = mode;
    }

    /**
     *
     * @param {Number} implLevel
     */
    setClientImpersonationLevel(implLevel) {
        this.impersonationLevel = implLevel;
    }

    /**
     * 
     * @param {String} name
     */
    setfileMonikerAtServer(name) {
        if (name != null && !(name == (''))) {
            this.monikerName = name;
        }
    }

    /**
     * @return {Number}
     */
    getOpnum() {
        return 0;
    }

    /**
     * 
     * @param {NetworkDatarepresentation} ndr 
     */
    write(ndr) {
        let orpcThis = new orpcThis();
        orpcThis.encode(ndr);
        
        let uuid = new UUID();
        uuid.parse(this.clsid.toString());
        try {
            uuid.encode(ndr, ndr.buf);
        } catch (error) {
            throw new Error(String('RemActivation - write - ' + error));
        }

        if (this.monikerName == null) {
            ndr.writeUnsignedLong(0);
        } else {
            ndr.writeCharacterArrayk(this.monikerName.toCharArray(), 0, this.monikerName.length);
        }

        ndr.writeUnsignedLong(0);
        ndr.writeUnsignedLong(this.impersonationLevel);
        ndr.writeUnsignedLong(mode);
        
        ndr.writeUnsignedLong(2);
        //ndr.writeUnsignedLong(new Object())
    }
}
module.exports = RemActivation;