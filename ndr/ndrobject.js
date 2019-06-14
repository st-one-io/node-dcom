var NetworkDataRepresentation = require("./networkdatarepresentation.js");

function NdrObject (){
  this.opnum = -1;
  this.value;
};

NdrObject.prototype.write = function (ndr){};

NdrObject.prototype.read = function (ndr){};

NdrObject.prototype.getOpnum = function getOpnum(){
  return this.opnum;
}

NdrObject.prototype.encode = function (ndr, dst){
  ndr.buf = dst;
  write(ndr);
}

NdrObject.prototype.decode = function (ndr, src){
  ndr.buf = src;
  read(ndr);
}

module.exports = NdrObject;
