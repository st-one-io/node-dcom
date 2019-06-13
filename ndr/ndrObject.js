var NetworkDataRepresentation = require("./NetworkDataRepresentation.js");

module.exports = function ndrObject (){
  this.opnum = -1;
  this.value;

  this.write = function (ndr){};
  this.read = function (ndr){};

  this.getOpnum = function getOpnum(){
    return this.opnum;
  }

  this.encode = function (ndr, dst){
    ndr.buf = dst;
    write(ndr);
  }

  this.decode = function (ndr, src){
    ndr.buf = src;
    read(ndr);
  }
}
