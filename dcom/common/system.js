// @ts-check
const ComVersion = require('./comversion.js');
const HashMap = require('hashmap');
const dns = require('dns');

/**
 * This class is responsible for storing some informations regarding
 * the system (COM/DCOM) information like version and available
 * interfaces.
 */
class System {
  /**
   * Initialize some variables. Takes no input parameter.
   */
  constructor() {
    this.pathToDB = null;
    this.mapOfProgIdsVsClsids = new HashMap();
    this.socketQueue = [];
    this.comVersion = new ComVersion();
    this.autoRegister = false;
    this.autoCollection = true;
    this.mapOfHostnamesVsIPs = new HashMap();
  }

  /**
   *
   * @param {ComVersion} comVersion
   */
  setComVersion(comVersion)
  {
    this.comVersion = comVersion;
  }

  /**
   * @return {ComVersion}
   */
  getComVersion()
  {
    return this.comVersion;
  }

  /**
   *
   * @param {String} hostname
   * @param {String} IP
   */
  mapHostNametoIP(hostname, IP) {
    if (hostname == null || IP == null || String(hostname).trim().length == 0|| 
    String(IP).trim().length == 0) {
      throw new Error('Illegal Argument.');
    }

    dns.lookup(String(IP).trim(), (err) => {
      throw new Error('Invalid IP Address.');
    });
    this.mapOfHostnamesVsIPs.set(String(hostname).trim().toUpperCase(),
        String(IP).trim());
  }

  /**
   *
   * @param {String} hostname
   * @return {String}
   */
  getIPForHostName(hostname)
  {
    return this.mapOfHostnamesVsIPs.get(String(hostname).trim().toUpperCase());
  }
}

module.exports = System;
