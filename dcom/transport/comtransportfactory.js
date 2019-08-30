var ComTransport = require('./comtransport.js');

class ComTransportFactory {
  constructor(){
    this.instance;
  }

  createTransport(address, timeout)
  {
    return new ComTransport(address, timeout);
  }

  getSingleton()
  {
    if (this.instance == null) {
      try {
        this.instance = new ComTransportFactory();
      } catch (e) {
        throw new Error(e);
      }
    }

    return this.instance;
  }

  getSingleTon()
  {
    return this.getSingleton();
  }
}

module.exports = ComTransportFactory;
