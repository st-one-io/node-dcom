var ComVersion = require('./comversion.js');
var HashMap = require('hashmap');
var fs = require('fs');
var dns = require('dns');

class System
{
  constructor()
  {
    this.pathToDB = null;
    this.mapOfProgIdsVsClsids = new HashMap();
    this.socketQueue = [];
    this.comVersion = new ComVersion();
    this.autoRegister = false;
    this.autoCollection = true;
    this.mapOfHostnamesVsIPs = new HashMap();
  }

  setComVersion(comVersion)
  {
    this.comVersion = comVersion;
  }

  getComVersion()
  {
    return this.comVersion;
  }

  getClsidFromProgId(progId)
  {
    if (progId == null) {
      return null;
    }

    if (this.pathToDB == null) {
      // on the original lib the synchronize keyword is used.
      // maybe we dont need it, but im leaving it as a // TODO:
      // TO-DO: synchronize equivalent
      if (pathToDB == null) {
        this.saveDBPathAndLoadFile();
      }
    }
    return String(this.mapOfProgIdsVsClsids.get(progId));
  }

  saveDBPathAndLoadFile()
  {
    //TO-DO: wait for guilherme's response
  }

  internal_writeProgIdsToFile()
  {
    if (pathToDB != null) {
      var outputStream = fs.createWriteStream(this.pathToDB);
      this.mapOfProgIdsVsClsids.set(outputStream, "progId Vs ClsidDB");
      outputStream.close();
    }
  }

  internal_setClsidtoProgId(progId, clsid)
  {
    this.mapOfProgIdsVsClsids(progId, clsid);
  }

  internal_getSocket()
  {
    // on j-interop this is achieved through arraylist, we can use a
    // normal js array and use splice instead of remove
    return this.socketQueue.splice(0,1);
  }

  internal_setSocket()
  {
    this.socketQueue.push(socket);
  }

  setAutoRegistration(autoRegistration)
  {
    this.autoRegistration = autoRegistration;
  }

  isAutoRegistrationSet()
  {
    return this.autoRegistration;
  }

  // TO-DO: not sure if this is needed but in any case I'll leave the functions there
  // until further analysis
  setCoClassAutoCollection(autoCollection)
  {
    this.autoCollection = autoCollection;
  }

  getIsCoClassAutoCollectionSet()
  {
    return this.autoCollection;
  }

  /* maping between hostname and IP
     should be used in cases where the server has more than one network adapter
     see j-interop library documentation for more information on the issue
  */
  mapHostNametoIP(hostname, IP)
  {
    if (hostname == null || IP == null || String(hostname).trim().lengt == 0
      || String(IP).trim().length == 0){
      throw new Error("Illegal Argument.");
    }

    dns.lookup(String(IP).trim(), (err) => {throw new Error("Invalid IP Address.")});
    this.mapOfHostnamesVsIPs.set(String(hostname).trim().toUpperCase(), String(IP).trim());
  }

  getIPForHostName(hostname)
  {
    return this.mapOfHostnamesVsIPs.get(String(hostname).trim().toUpperCase());
  }
}

module.exports = System;
