//@ts-check

class OrpcExtentArray {

    /**
     * 
     * @param {string} guid 
     * @param {number} size 
     * @param {Buffer} data 
     */
    constructor(guid, size, data) {
        this.uuid = guid;
        this.size = size;
        this.data = data;
    }

    getGUID() {
        return this.uuid;
    }

    getSizeOfData() {
        return this.size;
    }

    getData() {
        return this.data;
    }
}

module.exports = OrpcExtentArray;