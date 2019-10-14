// @ts-check
const ComTransport = require('./comtransport.js');

/**
 * Transport factory
 */
class ComTransportFactory {
  /**
   * Initializes the object. Takes no input parameters.
   */
  constructor() {
    this.instance;
  }

  /**
   *
   * @param {String} address
   * @param {Number} timeout
   * @return {ComTransport}
   */
  createTransport(address, timeout) {
    return new ComTransport(address, timeout);
  }

  /**
   * @return {ComTransportFactory}
   */
  getSingleton() {
    if (this.instance == null) {
      try {
        this.instance = new ComTransportFactory();
      } catch (e) {
        throw new Error(e);
      }
    }

    return this.instance;
  }

  /**
   * @return {ComTransportFactory}
   */
  getSingleTon() {
    return this.getSingleton();
  }
}

module.exports = ComTransportFactory;
