//@ts-check

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

    getIPIDRefCount() {
        return this.refcountofIPID;
    }

    /**
     * @returns {boolean}
     */
    hasExpired() {
        //8 minutes interval...giving COM Client some grace period.
        return (new Date().getTime() - this.lastPingTime) > 8 * 60 * 1000;
    }

    updateLastPingTime() {
        this.lastPingTime = (new Date()).getTime();
    }

    setIPIDRefCountTo0() {
        this.refcountofIPID = 0;
    }

    decrementIPIDRefCountBy1() {
        this.refcountofIPID--;
    }

    incrementIPIDRefCountBy1() {
        this.refcountofIPID++;
    }

    getOID() {
        return this.oid.slice(); //a copy of it
    }

    hashCode() {
        let result = 1;
        //from SUN
        for (let i = 0; i < this.oid.length; i++) {
            result = 31 * result + this.oid[i];
        }
        return result;

    }

    /**
     * 
     * @param {ObjectId} obj 
     */
    equals(obj) {
        if (!(obj instanceof ObjectId)) {
            return false;
        }

        let tgtOid = obj.getOID();
        return this.oid.length === tgtOid.length
            && this.oid.every((e, i) => e == tgtOid[i]);
    }

    toString() {
        let oidStr = this.oid.map(e => e.toString(16)).join(',');
        return `IPID[refcountofIPID: ${this.refcountofIPID} OID: 0x${oidStr} hasExpired ${this.hasExpired()}]`;
    }

}

module.exports = ObjectId;