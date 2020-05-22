class Currency {
    constructor(units, fractionalUnits){
        this.units = units;
        this.fractionalUnits = fractionalUnits;
    }

    getUnits() {
        return this.units;
    }

    getFractionalUnits() {
        return this.fractionalUnits;
    }
}
module.exports = Currency;