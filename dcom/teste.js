const Session = require('./core/session.js');
const ComServer = require('./core/comserver.js');
const Clsid = require('./core/clsid.js');
const Struct = require('./core/struct');
const ComValue = require('./core/comvalue');
const types = require('./core/types');
const Pointer = require('./core/pointer');
const ComString = require('./core/string');
const Flags = require('./core/flags');
const CallBuilder = require('./core/callbuilder');

// connection related data
var domain = "nttest1";
var user = "Administrator";
var password = "Administrator"

let wordpad = "73FDDC80-AEA9-101A-98A7-00AA00374959";
let codesys = "7904C302-AC19-11d4-9E1E-00105A4AB1C6";

var classID_IE = new Clsid(codesys);
let session = new Session();
session = session.createSession(domain, user, password);
//var session = Session.createSession(domain, user, password);
var server = new ComServer(classID_IE,"192.168.15.65",session);

let self = this;
self.session = session;
self.server = server;

// structures need for queryin about the opcserverstatus
let FILETIME = function(){
    this.dwLowDateTime;
    this.dwHighDateTime;
}

FILETIME.prototype.getStruct = function() {
    let struct = new Struct();
    struct.addMember(new ComValue(null, types.INTEGER));
    struct.addMember(new ComValue(null, types.INTEGER));

    return struct;
}

FILETIME.prototype.fromStruct = function(struct) {
    let ft = new FILETIME();
    ft.dwLowDateTime = struct.getMember(0).getValue();
    ft.dwHighDateTime = struct.getMember(1).getValue();

    return ft;
}

let OPCSERVERSTATE = {
    OPC_STATUS_RUNNING : 1,
    OPC_STATUS_FAILED : 2,
    OPC_STATUS_NOCONFIG : 3,
    OPC_STATUS_SUSPENDED : 4,
    OPC_STATUS_TEST : 5,
    OPC_STATUS_COMM_FAULT : 6,
    OPC_STATUS_UNKNOWN : 0
};

let OPCSERVERSTATUS = function (){
    this._startTime = null;
    this._currentTime= null;
    this._lastUpdateTime = null;
    this._serverState = null;
    this._groupCount = -1;
    this._bandWidth = -1;
    this._majorVersion = -1;
    this._minorVersion = -1;
    this._buildNumber = -1;
    this._reserved = 0;
    this._vendorInfo = null;
}

OPCSERVERSTATUS.prototype.getStruct = function (){
    let struct = new Struct();

    struct.addMember(new ComValue(new FILETIME().getStruct(), types.STRUCT));
    struct.addMember(new ComValue(new FILETIME().getStruct(), types.STRUCT));
    struct.addMember(new ComValue(new FILETIME().getStruct(), types.STRUCT));
    struct.addMember(new ComValue(null, types.SHORT));
    struct.addMember(new ComValue(null, types.INTEGER));
    struct.addMember(new ComValue(null, types.INTEGER));
    struct.addMember(new ComValue(null, types.SHORT));
    struct.addMember(new ComValue(null, types.SHORT));
    struct.addMember(new ComValue(null, types.SHORT));
    struct.addMember(new ComValue(null, types.SHORT));

    let aux = new ComValue(new ComString(Flags.FLAG_REPRESENTATION_STRING_LPWSTR), types.COMSTRING);
    struct.addMember(new ComValue(new Pointer(aux), types.POINTER));

    return struct;
}

OPCSERVERSTATUS.prototype.fromStruct = function(struct) {
    let status = new OPCSERVERSTATUS();

    status._startTime = new FILETIME().fromStruct(struct.getMember(0).getValue());
    status._currentTime = new FILETIME().fromStruct(struct.getMember(1).getValue());
    status._lastUpdateTime = new FILETIME().fromStruct(struct.getMember(2).getValue());

    return status;
}

self.OPCSERVERSTATUS = OPCSERVERSTATUS;
// Start the server an do some requests

server.init().then(function(data) {
    server.createInstance().then(function(data){
        self.unkwnown = data; 
        self.unkwnown.queryInterface("39C13A4D-011E-11D0-9675-0020AFD8ADB3")
        .then(function(data){
            self.opcServer = data;
            console.log("First query done: " + self.opcServer.getIpid());

            let saba = new CallBuilder(true);

            saba.setOpnum(3);
            let aux = new ComValue(new OPCSERVERSTATUS().getStruct(), types.STRUCT);
            saba.addOutParamAsObject(new ComValue(new Pointer(aux), types.POINTER), Flags.FLAG_NULL);            
            self.opcServer.call(saba).then(function(data){
                let result = new self.OPCSERVERSTATUS().fromStruct(data[0].getValue().getReferent());
                console.log(result._startTime, result._currentTime, result._lastUpdateTime);

                self.session.destroySession(self.unkwnown.getAssociatedSession());
            });
        })   
    });
}); 


