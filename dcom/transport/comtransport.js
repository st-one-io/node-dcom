// @ts-check
const Endpoint = require('../rpc/connectionorientedendpoint.js');
const PresentationSyntax = require('../rpc/core/presentationsyntax.js');
const os = require('os');
const net = require('net');
const events = require('events');
const util = require('util');
const debug = util.debuglog('dcom');

/**
 * Defines a Transport and it's basic functions
 */
class ComTransport extends events.EventEmitter {
  /**
   *
   * @param {String} address
   * @param {Number} timeout
   */
  constructor(address, timeout) {
    super();
    this.PROTOCOL = 'ncacn_ip_tcp';
    this.LOCALHOST = os.hostname();
    this.DEFAULT_READ_READY_HANDOFF_TIMEOUT_SECS = 30;
    this.HANDOFF = {};
    this.host;
    this.port;
    this.attached;
    this.readReadyHandoffTimeoutSecs = this.DEFAULT_READ_READY_HANDOFF_TIMEOUT_SECS;
    this.channelWrapper;
    this.recvPromise = null;
    this.receivedBuffer = [];
    this.aux;
    this.timeout = timeout;
    this.parse(address);
  }

  /**
   * Will parse the addres given
   * @param {String} address
   */
  parse(address) {
    if (address == null) {
      throw new Error ('Null address.');
    }

    if (!address.startsWith('ncacn_ip_tcp')) {
      throw new Error('Not and ncacn_ip_tcp address')
    }

    address = address.substring(13);
    let index = address.indexOf('[');
    if (index == -1) {
      throw new Error('No port specifier present.');
    }

    let server = address.substring(0, index);
    address = address.substring(index + 1);
    index = address.indexOf(']');
    if (index == -1) {
      throw new Error('Port specifier not terminated');
    }
    address = address.substring(0, index);
    if ('' == server) {
      server = this.LOCALHOST;
    }

    try {
      this.port = Number.parseInt(address);
    } catch (e) {
      throw new Error('Invalid port specifier.');
    }
    this.host = server;
  }

  /**
   * @return {String}
   */
  getProtocol() {
    return this.PROTOCOL;
  }

  /**
   *
   * @param {PresentationSyntax} syntax
   * @return {Promise}
   */
  attach() {
    let self = this;
    return new Promise(function(resolve, reject) {
      if (self.attached) {
        throw new Error('Transport already attached');
      }
      let channel = new net.Socket();
      channel.setKeepAlive(true);

      /* When we recieve some data we check if receive() was already called by
        checkin if recProm is null. If it is, we resolve it, if not we add the
        received data to the receiveBuffer and wait for it be called
      */
      channel.on('data', function(data) {
        if (self.recvPromise == null) {
          self.receivedBuffer.concat(data);
        } else {
          self.recvPromise.resolve(data);
          self.recvPromise = null;
        }
      });

      channel.on('error', function(data) {
        self.emit('disconnected');
      });

      channel.on('close', function() {
        if (self.recvPromise != null) {
          self.recvPromise.reject();
        }
      });

      channel.connect(Number.parseInt(self.port), self.host, () => {
        self.attached = true;
        channel.setKeepAlive(true);
        self.channelWrapper = channel;
        resolve();
      });
    });
  }

  /**
   * @return {Promise}
   */
  async close() {
    try {
      if (this.channelWrapper != null) {
        const self = this;
        return new Promise(function(resolve, reject) {
          const teste = self.channelWrapper.end(resolve(self.channelWrapper = null));
        });
      }
    } finally {
      this.attached = false;
      this.channelWrapper = null;
    }
  }

  /**
   *
   * @param {Array} buffer
   * @param {Object} info
   */
  send(buffer, info) {
    if (!this.attached) {
      throw new Error('Transport not attached.');
    }

    const buf = buffer.getBuffer();
    // FIXME quick-fix to trim buffer to its real length.
    // Need to check where this should be
    const length = buffer.length;

    try {
      this.channelWrapper.write(Buffer.from(buf.slice(0, length)));
    } catch (e) {
      debug(e);
    }
  }

  /**
   *
   * @param {Array} buffer
   * @return {Promise}
   */
  receive(buffer) {
    if (!this.attached) {
      throw new Error('Transport not attached.');
    }
    /**
     * FIXME this await won't work. To make an awaitable receive function
     * we need to listen on the 'data' event at socket creation time create
     * a synchronization mechanism: store the received data, and everytime
     * this here is called, check if there's anything stored, sending it;
     * and storing the "resolve" of the created promise, calling it whenever
     * the 'data' event is fired, with the received buffer
     */


    const self = this;
    this.timeout;
    return new Promise(function(resolve, reject) {
      const timer = setTimeout(function() {
        clearTimeout(timer);
        reject(new Error('connection timeout'));
      }, self.timeout);

      if (self.receivedBuffer.length > 0) {
        clearTimeout(timer);
        resolve(buffer = self.receivedBuffer);
      } else {
        if (self.recvPromise == null) {
          self.recvPromise = {resolve: resolve, reject: reject, timer: timer};
        }
      }
    });
  }

  /**
   * @return {String}
   */
  toString() {
    return 'Transport to ' + this.host + ':' + this.port;
  }
}

module.exports = ComTransport;
