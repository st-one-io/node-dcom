// @ts-check
let ConnectionOrientedEndoint = require('../rpc/connectionorientedendpoint.js');

/**
 * Abstraction for a ComEndpoint from ConnectionOrientedEndpoint
 */
class ComEndpoint extends ConnectionOrientedEndoint {
  /**
   *
   * @param {ComTransport} transport
   * @param {PresentationSyntax} syntax
   */
  constructor(transport, syntax) {
    super(transport, syntax);
  }

  /**
   * Try to re-bind this endpoint to a remote interface.
   * @param {Object} info
   */
  async rebindEndpoint(info) {
    await this.rebind(info);
  }
}

module.exports = ComEndpoint;
