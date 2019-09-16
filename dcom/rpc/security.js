const NetworkDataRepresentation = require('../ndr/networkdatarepresentation.js');

/**
 * TO-DO: put this on a constants file, no need for a class
 */
class Security {
  /**
   * Initializes a few constants
   */
  constructor() {
    this.USERNAME = 'rpc.security.username';

    this.PASSWORD = 'rpc.security.password';

    this.AUTHENTICATION_SERVICE_NONE = 0;

    this.PROTECTION_LEVEL_NONE = 1;

    this.PROTECTION_LEVEL_CONNECT = 2;

    this.PROTECTION_LEVEL_CALL = 3;

    this.PROTECTON_LEVEL_PACKET = 4;

    this.PROTECTION_LEVEL_INTEGRITY = 5;

    this.PROTECTION_LEVEL_PRIVACY = 6;
  }
  // TO-DO: functions implemented by NTLM1.java
}

module.exports = Security;
