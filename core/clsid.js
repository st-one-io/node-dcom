var UUID = require('../rpc/core/uuid.js');

class Clsid
{
  constructor(uuid)
  {
    this.nestedUUID = new UUID(uuid);
    this.autoRegister = false;
  }

  setAutoRegistration(autoRegister)
  {
    this.autoRegister = autoRegister;
  }

  isAutoRegistrationSet()
  {
    return this.autoRegister;
  }

  valueOf(uuid)
  {
    if (uuid == null) {
      return null;
    }
    return new Clsid(uuid);
  }

  getClsid()
  {
    return this.nestedUUID.toString();
  }
}

module.exports = Clsid;
