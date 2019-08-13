var Endpoint = require('../rpc/connectionorientedendpoint.js');
var PresentationSyntax = require('../rpc/core/presentationsyntax.js');
var os = require('os');
var net = require('net');
var dns = require('dns');
//var ByteBuffer = require('bytebuffer');
var ComEndpoint = require('./comendpoint.js');

class ComTransport
{
  constructor(address, info)
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
    this.recvPromise = null;
    this.receivedBuffer = new Array();
    this.aux;
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
      channel.setKeepAlive(true);
      var endpoint = new ComEndpoint()
      /* When we recieve some data we check if receive() was already called by
        checkin if recProm is null. If it is, we resolve it, if not we add the
        received data to the receiveBuffer and wait for it be called
      */
      channel.on('data', function(data){
         console.log("data received", self.recvPromise);
        if (self.recvPromise == null) {
          self.receivedBuffer.concat(data);
        } else {
          self.recvPromise.resolve(data);
          self.recvPromise = null;
          console.log(self.aux);
        }
      });

      channel.on('close', function(){
        if (self.recvPromise != null) {
          self.recvPromise.reject();
        }
        console.log("IM CLOSING BECAUSE REASONS!");
      });

      channel.connect(Number.parseInt(self.port),  self.host, () => {
        console.log("connected.");
        self.attached = true;
        channel.setKeepAlive(true);
        self.channelWrapper = channel;
        resolve(new ComEndpoint(self, syntax));
      });
    });
  }

  async close()
  {
    try {
      if (this.channelWrapper != null) {
        await this.channelWrapper.end();
      }
    } finally {
      this.attached = false;
      this.channelWrapper = null;
    }
  }

  send(buffer, info)
  {
    if (!this.attached) {
      throw new Erro("Transport not attached.");
    }

    let buf = buffer.getBuffer();
    //FIXME quick-fix to trim buffer to its real length. Need to check where this should be
    let length = buffer.length;
    
    try{
        this.channelWrapper.write(Buffer.from(buf.slice(0, length)));
    } catch(e){
      console.log(e);
    }
  }

  receive()
  {
    console.log("receiving packet...")
    if (!this.attached) {
      throw new Error("Transport not attached.");
    }
    /**
     * FIXME this await won't work. To make an awaitable receive function
     * we need to listen on the 'data' event at socket creation time create
     * a synchronization mechanism: store the received data, and everytime
     * this here is called, check if there's anything stored, sending it;
     * and storing the "resolve" of the created promise, calling it whenever
     * the 'data' event is fired, with the received buffer
     */

    
    var self = this;
    return new Promise(function(resolve, reject){
      if (self.receivedBuffer.length > 0) {
        console.log(self.receivedBuffer);
        resolve(buffer = self.receivedBuffer);
      } else {
        console.log("waiting for data");
        if (self.recvPromise == null){
          self.recvPromise = {resolve: resolve, reject: reject};  
        }
      }
    });
  }

  toString()
  {
    return "Transport to " + this.host + ":" + this.port;
  }
}

module.exports = ComTransport;
