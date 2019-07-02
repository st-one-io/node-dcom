var Endpoint = require('../rpc/connectionorientedendpoint.js');
var PresentationSyntax = require('../rpc/core/presentationsyntax.js');
var os = require('os');
var net = require('net');
var dns = require('dns');
var ByteBuffer = require('bytebuffer');
var ComEndpoint = require('./comendpoint.js');

class ComTransport
{
  constructor(address)
  {
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
    if (this.attached) {
      throw new Error("Transport already attached");
    }

    try {
      var channel = new net.Socket();
      var ipAddr;
      dns.lookup(this.host, function(err, address, family){
        ipAddr = address;
      });

      channel.connect(this.port, ipAddr);
      this.attached = true;
      channel.setKeepAlive(true);
      this.channelWrapper = channel;

      return new ComEndpoint(this, syntax);
    } catch (e) {
      this.close();
    }
  }

  close()
  {
    try {
      if (this.channelWrapper != null) {
        this.channelWrapper.close();
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

    var byteBuffer = ByteBuffer.wrap(buffer.getBuffer());
    this.channelWrapper.write(byteBuffer);
  }

  receive(buffer)
  {
    if (!this.attached) {
      throw new Erro("Transport not attached.");
    }

    var timeoutMillis = 3000;

    this.channelWrapper.on('data', function(data){
      buffer = data;
    });
  }

  toString()
  {
    return "Transport to " + this.host + ":" + this.port;
  }
}

module.exports = ComTransport;
