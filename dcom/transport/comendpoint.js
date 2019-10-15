var ConnectionOrientedEndoint = require('../rpc/connectionorientedendpoint.js');

class ComEndpoint extends ConnectionOrientedEndoint
{
  constructor(transport, syntax)
  {
    super(transport, syntax);
  }

  async rebindEndpoint(info)
  {
    await this.rebind(info);
  }
}

module.exports = ComEndpoint;
