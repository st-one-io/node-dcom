var ComTransport = require('./comtransport.js');

class ComTransportFactory {
  constructor(){
    this.instance;
  }

  createTransport(address)
  {
    console.log("createTransport");
    return new ComTransport(address);
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
