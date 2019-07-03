var Endpoint = require('../rpc/connectionorientedendpoint.js');
var PresentationSyntax = require('../rpc/core/presentationsyntax.js');
var os = require('os');
var net = require('net');
var dns = require('dns');
//var ByteBuffer = require('bytebuffer');
var ComEndpoint = require('./comendpoint.js');

class ComTransport
{
  constructor(address)
  {
    console.log("new ComTransport");
    this.PROTOCOL = "ncacn_ip_tcp";
    this.LOCALHOST = os.hostname();
    this.DEFAULT_READ_READY_HANDOFF_TIMEOUT_SECS = 30;
    this.HANDOFF = new Object();
    this.host;
    this.port;
    this.attached;
    this.readReadyHandoffTimeoutSecs = this.DEFAULT_READ_READY_HANDOFF_TIMEOUT_SECS;
    this.channelWrapper;

    this.parse(address);
  }

  parse(address){
    if (address == null) {
      throw new Error ("Null address.");
    }

    if (!address.startsWith("ncacn_ip_tcp")) {
      throw new Error("Not and ncacn_ip_tcp address")
    }

    address = address.substring(13);
    var index = address.indexOf('[');
    if (index == -1) {
      throw new Error("No port specifier present.");
    }

    var server = address.substring(0, index);
    address = address.substring(index + 1);
    index = address.indexOf(']');
    if (index == -1) {
      throw new Erro("Port specifier not terminated");
    }
    address = address.substring(0, index);
    if ("" == server) {
      server = this.LOCALHOST;
    }

    try {
      this.port = Number.parseInt(address);
    } catch(e) {
      throw new Error("Invalid port specifier.");
    }
    this.host = server;
  }

  getProtocol()
  {
    return this.PROTOCOL;
  }

  attach(syntax)
  {
    console.log("attach");
    var self = this;
    return new Promise(function(resolve, reject){
      if (self.attached) {
        throw new Error("Transport already attached");
      }
      var channel = new net.Socket();
      var endpoint = new ComEndpoint()

      channel.connect(Number.parseInt(self.port),  self.host, () => {
        console.log("connected.");
        self.attached = true;
        channel.setKeepAlive(true);
        self.channelWrapper = channel;
        resolve(new ComEndpoint(self, syntax));
      });
    });
  }

  close()
  {
    try {
      if (this.channelWrapper != null) {
        this.channelWrapper.end();
      }
    } finally {
      this.attached = false;
      this.channelWrapper = null;
    }
  }

  send(buffer){
    if (!this.attached) {
      throw new Erro("Transport not attached.");
    }
    //var byteBuffer = ByteBuffer.wrap(buffer.getBuffer());
    let buf = buffer.getBuffer();
    //FIXME quick-fix to trim buffer to its real length. Need to check where this should be
    let length = buf.readUInt16LE(8);
    try{
      this.channelWrapper.write(buf.slice(0, length + 1));
    } catch(e){
      console.log(e);
    }
  }

  async receive(buffer)
  {
    if (!this.attached) {
      throw new Error("Transport not attached.");
    }

    var timeoutMillis = 3000;
    console.log("before");
    /**
     * FIXME this await won't work. To make an awaitable receive function
     * we need to listen on the 'data' event at socket creation time create 
     * a synchronization mechanism: store the received data, and everytime 
     * this here is called, check if there's anything stored, sending it;
     * and storing the "resolve" of the created promise, calling it whenever
     * the 'data' event is fired, with the received buffer
     */
    await this.channelWrapper.on('data', function(data){
      buffer = data;
    });
    console.log("after");
  }

  toString()
  {
    return "Transport to " + this.host + ":" + this.port;
  }
}

module.exports = ComTransport;
