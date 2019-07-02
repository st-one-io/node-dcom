var ConnectionOrientedEndoint = require('../rpc/connectionorientedendpoint.js');

class ComEndpoint extends ConnectionOrientedEndoint
{
  constructor(transport, syntax)
  {
    super(transport, syntax);
  }

  rebindEndpoint()
  {
    this.rebind();
  }
}

module.exports = ComEndpoint;
