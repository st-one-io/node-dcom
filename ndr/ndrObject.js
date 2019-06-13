var NetworkDataRepresentation = require("./NetworkDataRepresentation.js");

function ndrObject (){
  this.opnum = -1;
  this.value;
};

ndrObject.prototype.write = function (ndr){};

ndrObject.prototype.read = function (ndr){};

ndrObject.prototype.getOpnum = function getOpnum(){
  return this.opnum;
}

ndrObject.prototype.encode = function (ndr, dst){
  ndr.buf = dst;
  write(ndr);
}

ndrObject.prototype.decode = function (ndr, src){
  ndr.buf = src;
  read(ndr);
}

module.exports = ndrObject;
