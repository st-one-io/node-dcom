//@ts-check
const Session = require('./session');
const ComObject = require('./comobject');
const ComObjectImpl = require('./comobjcimpl');
const Flags = require('./flags');
const System = require('../common/system');
const ErrorCodes = require('../common/errorcodes');
const InterfacePointer = require('./interfacepointer');
const NetworkDataRepresentation = require("../ndr/networkdatarepresentation");
const NdrBuffer = require('../ndr/ndrbuffer');

/** Returns an Interface Pointer representation from raw bytes.
 *
 * @exclude
 * @param {Session} session
 * @param {Buffer|InterfacePointer|ComObject} obj
 * @param {string} ipAddress
 * @returns {ComObject}
 */
async function instantiateComObject(session, obj, ipAddress) {
    if (obj instanceof ComObject) {
        if (obj.getAssociatedSession()) {
            throw new Error("SESSION_ALREADY_ATTACHED" + new ErrorCodes().SESSION_ALREADY_ATTACHED);
        }

        if (obj.isLocalReference()) {
            throw new Error("COMOBJ_LOCAL_REF" + new ErrorCodes().COMOBJ_LOCAL_REF);
        }

        obj = obj.internal_getInterfacePointer();
    }

    if (obj instanceof InterfacePointer) {
        let retval = instantiateComObject2(session, obj);
        addComObjectToSession(retval.getAssociatedSession(), retval);
        return retval;
    } 


    let ndr = new NetworkDataRepresentation();
    let ndrBuffer = new NdrBuffer(obj, 0);
    ndr.setBuffer(ndrBuffer);
    ndrBuffer.length = obj.length;

    //this is a brand new session.
    if (!session.getStub()) {
        let comServer = new ComServer(session, InterfacePointer.decode(ndr, [], Flags.FLAG_REPRESENTATION_INTERFACEPTR_DECODE2, new Map()), ipAddress);
        return comServer.getInstance();
    } else {
        let retval = instantiateComObject(session, InterfacePointer.decode(ndr, [], Flags.FLAG_REPRESENTATION_INTERFACEPTR_DECODE2, new Map()));
        //increasing the reference count.
        await retval.addRef();
        return retval;
    }
}

/**
 * 
 * @param {Session} session
 * @param {InterfacePointer} ptr
 * @return {ComObject}
 */
function instantiateComObject2(session, ptr) {
    if (!ptr) {
        throw new Error("COMFACTORY_ILLEGAL_ARG" + new ErrorCodes().COMFACTORY_ILLEGAL_ARG);
    }

    let retval;
    let stubPtr = session.getStub().getServerInterfacePointer();
    if (!new InterfacePointer().isOxidEqual(stubPtr, ptr)) {
        //NEW SESSION IDENTIFIED ! for ptr

        //first check if a session for this OXID does not already exist and thus its stub
        let newsession = Session.resolveSessionForOxid(new Oxid(ptr.getOXID()));
        if (!newsession) {
            //new COM server pointer
            newsession = Session.createSession(session);
            newsession.setGlobalSocketTimeout(session.getGlobalSocketTimeout());
            newsession.useSessionSecurity(session.isSessionSecurityEnabled());
            newsession.useNTLMv2(session.isNTLMv2Enabled());
            let comServer = new ComServer(newsession, ptr, null);
            retval = comServer.getInstance();
            Session.linkTwoSessions(session, newsession);
        }

        //this is so that the reference gets added correctly.
        session = newsession;
    }

    if (!retval) {
        retval = new ComObjectImpl(session, ptr);
    }

    return retval;
}

/**
 * @param {Session} session
 * @param {ComObject} comObject
 */
function addComObjectToSession(session, comObject) {
    session.addToSession(comObject, comObject.internal_getInterfacePointer().getOID());
}


/**
 * @exclude
 * @param {Session} session
 * @param {LocalCoClass}
 * @return {ComObject}
 */
function instantiateLocalComObject(session, javaComponent) {
    return new ComObjectImpl(session, ComOxidRuntime.getInterfacePointer(session, javaComponent), true);
}

/**
 * @exclude
 * @param {ComObject} comObject
 * @param {string} identifier
 * @throws Exception
 */
function detachEventHandler(comObject, identifier) {
    let connectionInfo = comObject.internal_getConnectionInfo(identifier);
    if (!connectionInfo) {
        throw new Error("CALLBACK_INVALID_ID" + new ErrorCodes().CALLBACK_INVALID_ID);
    }

    let connectionPointer = connectionInfo[0];

    //first use the cookie to detach.
    let object = new CallBuilder(true);
    object.setOpnum(3);
    object.addInParamAsInt(connectionInfo[1], Flags.FLAG_NULL);
    connectionPointer.call(object);
    //now release the connectionPointer.
    connectionPointer.release();
}

/**
 * @exclude
 * @param {ComObject} comObject
 * @param {string} sourceUUID
 * @param {ComObject} eventListener
 * @returns {string}
 * @throws Exception
 */
function attachEventHandler(comObject, sourceUUID, eventListener) {
    if (!eventListener || !comObject || !sourceUUID || sourceUUID === "") {
        throw new Error("CALLBACK_INVALID_PARAMS" + new ErrorCodes().CALLBACK_INVALID_PARAMS);
    }

    let connectionPointContainer = comObject.queryInterface("B196B284-BAB4-101A-B69C-00AA00341D07");
    let object = new CallBuilder(true);
    object.setOpnum(1);
    object.addInParamAsUUID(sourceUUID, Flags.FLAG_NULL);
    object.addOutParamAsObject("ComObject", Flags.FLAG_NULL);
    let objects = connectionPointContainer.call(object); //find connection point
    let connectionPointer = objects[0];

    object.reInit();
    object.setOpnum(2);
    object.addInParamAsComObject(eventListener, Flags.FLAG_NULL);
    object.addOutParamAsType("Integer", Flags.FLAG_NULL);
    let obj = connectionPointer.call(object);

    //used to unadvise from the connectionpoint
    let dwcookie = obj[0];
    connectionPointContainer.release();

    return comObject.internal_setConnectionInfo(connectionPointer, dwcookie);
}

module.exports = {
    instantiateComObject,
    instantiateComObject2,
    addComObjectToSession,
    instantiateLocalComObject,
    detachEventHandler,
    attachEventHandler
}