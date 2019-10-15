/* eslint-disable indent */
// @ts-check

const ComVersion = require('../common/comversion.js');
const System = require('../common/system.js');
const HashMap = require('hashmap');
const ServerActivation = require('./ServerActivation.js');
const UUID = require('../rpc/core/uuid.js');
const orpcThis = require('./orpcthis.js');
const orpcThat = require('./orpcthat.js');
const objectHash = require('object-hash');
const Session = require('./session.js');
const MarshalUnMarshalHelper = require('./marshalunmarshalhelper.js');
const DualStringArray = require('./dualstringarray.js');
const types = require('./types.js');
const ComValue = require('./comvalue.js');
const NdrObject = require('../ndr/ndrobject.js');
const InterfacePointer = require('./interfacepointer.js');
const ComArray = require('./comarray.js');
const Flags = require('./flags.js');
const util = require('util');
const debug = util.debuglog('dcom');

/**
 * Remote Activation class
 */
class RemActivation extends NdrObject {
    /**
     *
     * @param {Clsid} clsid
     */
    constructor(clsid, interfaces) {
        super();
        this.RPC_C_IMP_LEVEL_IDENTIFY = 2;
        this.TPC_C_IMP_LEVEL_IMPERSONATE = 3;
        this.impersonationLevel = this.TPC_C_IMP_LEVEL_IMPERSONATE;
        this.mode = 0;
        
        this.monikerName = null;
        this.clsid = new UUID(clsid);
        // interfaces = ["00000000-0000-0000-c000-000000000046", "00020400-0000-0000-c000-000000000046"];
        this.interfaces = interfaces ? interfaces : ["00000000-0000-0000-c000-000000000046", "00020400-0000-0000-c000-000000000046"];
        this.activationsuccessful = false;
        this.oprthat = null;
        this.oxid = null;

        this.dualStringArrayForOxid = null;
        this.ipid = null;

        this.authenticationHint = -1;
        this.comVersion = null;
        this.hresult = -1;
        this.mInterfacePointer = null;
        this.isDual = false;
        this.dispIpid = null;
        this.dispRefs = 5;
        this.dispOid = null;

        for (let i = 0; i < this.interfaces.length; i++) {
            this.interfaces[i] = new UUID(this.interfaces[i]);          
        }
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
        let oprcthis = new orpcThis();
        oprcthis.encode(ndr);
        
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
            ndr.writeCharacterArray(this.monikerName.toCharArray(), 0, this.monikerName.length);
        }

        ndr.writeUnsignedLong(0);
        ndr.writeUnsignedLong(this.impersonationLevel);
        ndr.writeUnsignedLong(this.mode);
        
        ndr.writeUnsignedLong(this.interfaces.length);
        ndr.writeUnsignedLong(Number.parseInt(Buffer.from(objectHash({})).toString('hex').substr(0, 9)));
        ndr.writeUnsignedLong(this.interfaces.length);

        //uuid.parse('00000000-0000-0000-c000-000000000046');
        
        for (let i = 0; i < this.interfaces.length; i++) {
            try {
                this.interfaces[i].encode(ndr, ndr.buf);
            } catch (error) {
                throw new Error(String('RemActivation - write - ' + error));
            }
        };
        ndr.writeUnsignedLong(1);
        ndr.writeUnsignedLong(1);
        ndr.writeUnsignedShort(7);

        let address = (new Session().getLocalHostAsIpString()).split('.');
        for (let i = 0; i < address.length; i++) {
            address[i] = Number.parseInt(address[i]);
            
        }

        ndr.writeUnsignedShort(address[0]);
        ndr.writeUnsignedShort(address[1]);
        ndr.writeUnsignedShort(address[2]);
        ndr.writeUnsignedShort(address[3]);
        ndr.writeUnsignedShort(0);
    }

    /**
     * 
     * @param {NetworkDataRepresentation} ndr 
     */
    read(ndr) {
        this.oprthat = new orpcThat().decode(ndr);

        this.oxid = MarshalUnMarshalHelper.readOctetArrayLE(ndr, 8);

        let skipdual = ndr.readUnsignedLong();

        if (skipdual != 0) {
            ndr.readUnsignedLong();

            this.dualStringArrayForOxid = new DualStringArray().decode(ndr);
        }

        try {
            let ipid2 = new UUID();
            ipid2.decode(ndr, ndr.getBuffer());
            this.ipid = (ipid2.toString());
        } catch (e) {
            throw new Error(String('RemActivation - read - ' + e));
        }

        this.authenticationHint = ndr.readUnsignedLong();

        this.comVersion = new ComVersion();
        this.comVersion.setMajorVersion(ndr.readUnsignedShort());
        this.comVersion.setMinorVersion(ndr.readUnsignedShort());

        this.hresult = ndr.readUnsignedLong();
        if (this.hresult != 0) {
            throw this.hresult;
        }

        let array = new ComArray(new ComValue(new InterfacePointer(), types.INTERFACEPOINTER), null, 1, true);
        let listOfDefferedPointers = new Array();

        array = MarshalUnMarshalHelper.deSerialize(ndr, new ComValue(array,types.COMARRAY), listOfDefferedPointers, Flags.FLAG_NULL, new HashMap());

        let x = 0;
        while (x < listOfDefferedPointers.length) {
            let newList = new Array();
            let replacement = MarshalUnMarshalHelper.deSerialize(ndr, new ComValue(listOfDefferedPointers[x], types.POINTER)
                ,newList, Flags.FLAG_NULL, null);

            listOfDefferedPointers[x].replaceSelfWithNewPointer(replacement);
            x++;
            
            let aux_i = x;
            while (aux_i < newList.length) listOfDefferedPointers.splice(aux_i++, 1, newList.shift());
        }

        let arrayObjs = array.getValue().getArrayInstance();
        this.mInterfacePointer = arrayObjs[0];

        if (arrayObjs[1] != null) {
            this.isDual = true;
            let ptr = arrayObjs[1];
            this.dispIpid = ptr.getIPID();
            this.dispOid = ptr.getOID();
            this.dispRefs = ptr.getObjectReference(new InterfacePointer().OBJREF_STANDARD).getPublicRefs();
        }

        array = new ComArray(new ComValue(Number(), types.INTEGER), null, 1, true);
        MarshalUnMarshalHelper.deSerialize(ndr, new ComValue(array, types.COMARRAY), null, Flags.FLAG_NULL);

        this.activationsuccessful = true;
    }

    /**
     * @return {Boolean}
     */
    isActivationSuccessful()
    {
        return this.activationsuccessful;
    }

    /**
     * @return {orpcThat}
     */
    getORPCThat()
    {
        return this.oprthat;
    }

    /**
     * @return {Oxid}
     */
    getOxid(){
        return this.oxid;
    }

    /**
     * @return {DualStringArray}
     */
    getDualStringArrayForOxid()
    {
        return this.dualStringArrayForOxid;
    }

    /**
     * @return {Number}
     */
    getAuthenticationHint()
    {
        return this.authenticationHint;
    }

    /**
     * @return {ComVersion}
     */
    getComVersion()
    {
        return this.comVersion;
    }

    /**
     * @return {Number}
     */
    getHresult()
    {
        return this.hresult;
    }

    /**
     * @return {InterfacePointer}
     */
    getMInterfacePointer()
    {
        return this.mInterfacePointer;
    }

    /**
     * @return {String}
     */
    getIPID()
    {
        return this.ipid;
    }

    /**
     * @return {Boolean}
     */
    isDual()
    {
        return this.isDual;
    }

    /**
     * @return {String}
     */
    getDispIpid()
    {
        return this.dispIpid;
    }

    /**
     * @return {Number}
     */
    getDispRefs()
    {
        return this.dispRefs;
    }

    /**
     * 
     * @param {String} dispIpid 
     */
    setDispIpid(dispIpid)
    {
        this.dispIpid = dispIpid;
    }
}
module.exports = RemActivation;