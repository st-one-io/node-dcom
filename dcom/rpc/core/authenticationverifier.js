var NetworkDataRepresentation = require("../../ndr/networkdatarepresentation.js");
var Security = require("../security.js");

function AuthenticationVerifier(authenticationService, protectionLevel, contextId, body){
  if (arguments.length == 1) {
    this.body = new Array(authenticationService);
    authenticationService = null;
  }
  (authenticationService != undefined) ? this.authenticationService = authenticationService :
    this.authenticationService = new Security().AUTHENTICATION_SERVICE_NONE;

  (protectionLevel != undefined) ? this.protectionLevel = protectionLevel :
    this.protectionLevel = new Security().PROTECTION_LEVEL_NONE;

  (contextId != undefined) ? this.contextId = contextId : this.contextId = 0;
  if (body instanceof Number || typeof body == "number") {
    this.body = new Array(body);
  }else if(body instanceof Array){
    (body != undefined) ? this.body = body : this.body = null;
  }
}

AuthenticationVerifier.prototype.decode = function (ndr, src) {
  src.align(4);
  this.authenticationService = src.dec_ndr_small();
  this.protectionLevel = src.dec_ndr_small();
  src.dec_ndr_small();
  this.contextId = src.dec_ndr_long();

  var temp = [...src.getBuffer().slice(src.getIndex(), src.getIndex() + this.body.length)];
  var temp_index= 0;
  while(temp.length > 0){
    this.body.splice(temp_index++, 1, temp.shift());
  }
  src.index += this.body.length;
};

AuthenticationVerifier.prototype.encode = function (ndr, dst) {
  var padding = dst.align(4, 0);
  dst.enc_ndr_small(this.authenticationService);
  dst.enc_ndr_small(this.protectionLevel);
  dst.enc_ndr_small(this.padding);
  dst.enc_ndr_small(0);
  dst.enc_ndr_long(this.contextId);
  
  let begin = dst.buf.slice(0, dst.index);
  let end = dst.buf.slice((this.body.length + dst.index), dst.buf.byteLength);
  let middle = Buffer.from(this.body);

  dst.buf = Buffer.concat([begin, middle, end]);
  //dst.buf = begin.concat(middle.concat(end));
  /*var temp = this.body.slice(0, this.body.length);
  var temp_index= dst.getIndex();
  
  while (temp.length > 0) dst.getBuffer().splice(temp_index++, 0, temp.shift());*/
  dst.advance(this.body.length);
};

AuthenticationVerifier.prototype.equals = function (obj) {
  if (!(obj instanceof AuthenticationVerifier)) return false;
  var other = obj;
  return (this.authenticationService == other.authenticationService &&
    this.protectionLevel == other.protectionLevel &&
    this.contextId == other.contextId &&
    ((body.join()) == (other.body.join())));
};

AuthenticationVerifier.prototype.hashCode = function () {
  return this.authenticationService ^ this.protectionLevel ^ this.contextId;
};

module.exports = AuthenticationVerifier;
