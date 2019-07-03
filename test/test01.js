//@ts-check

const Session = require('../core/session');
const ComServer = require('../core/comserver');
const ComObject = require('../core/comobject');
const ClsId = require('../core/clsid');

const TGT_IP = '192.168.15.65';
const TGT_DOMAIN = 'NTTEST2';
const TGT_USERNAME = 'Administrator';
const TGT_PASSWORD = 'Administrator';

const CLSID_CODESYS = new ClsId('7904c302-ac19-11d4-9e1e-00105a4ab1c6');

let session = new Session(); //createSession should be static
session = session.createSession(TGT_DOMAIN, TGT_USERNAME, TGT_PASSWORD);
let comServer = new ComServer(CLSID_CODESYS, TGT_IP, session);