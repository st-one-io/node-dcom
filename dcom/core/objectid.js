// @ts-check

/**
 * ObjectID is a class that stores id information
 * of a ComObject with a reference on the server.
 */
class ObjectId {
    /**
     *
     * @param {number[]} oid
     * @param {boolean} dontping
     */
    constructor(oid, dontping) {
        this.oid = oid;
        this.refcountofIPID = 0;
        this.lastPingTime = (new Date()).getTime();
        this.dontping = dontping;
    }

    /**
     * @return {Number}
     */
    getIPIDRefCount() {
        return this.refcountofIPID;
    }

    /**
     * @return {boolean}
     */
    hasExpired() {
        // 8 minutes interval...giving COM Client some grace period.
        return (new Date().getTime() - this.lastPingTime) > 8 * 60 * 1000;
    }

    /**
     * Update the time when a ping was sent for this object.
     */
    updateLastPingTime() {
        this.lastPingTime = (new Date()).getTime();
    }

    /**
     * Zeroes IPID reference counter.
     */
    setIPIDRefCountTo0() {
        this.refcountofIPID = 0;
    }

    /**
     * Decrements IPID reference counter by 1 on each call.
     */
    decrementIPIDRefCountBy1() {
        this.refcountofIPID--;
    }

    /**
     * Increments IPID reference counter by 1 on each call.
     */
    incrementIPIDRefCountBy1() {
        this.refcountofIPID++;
    }

    /**
     * @return {Array}
     */
    getOID() {
        return this.oid.slice(); // a copy of it
    }

    /**
     * @return {Number}
     */
    hashCode() {
        let result = 1;
        // from SUN
        for (let i = 0; i < this.oid.length; i++) {
            result = 31 * result + this.oid[i];
        }
        return result;

    }

    /**
     *
     * @param {ObjectId} obj
     * @return {Boolean}
     */
    equals(obj) {
        if (!(obj instanceof ObjectId)) {
            return false;
        }

        let tgtOid = obj.getOID();
        return this.oid.length === tgtOid.length
            && this.oid.every((e, i) => e == tgtOid[i]);
    }

    /**
     * @return {String}
     */
    toString() {
        let oidStr = this.oid.map(e => e.toString(16)).join(',');
        return `IPID[refcountofIPID: ${this.refcountofIPID} OID: 0x${oidStr} hasExpired ${this.hasExpired()}]`;
    }
}

module.exports = ObjectId;