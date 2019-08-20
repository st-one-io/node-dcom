var NdrObject = require("../../ndr/ndrobject.js");
var NetworkDataRepresentation = require("../../ndr/networkdatarepresentation.js");
var PresentationSyntax = require("./presentationsyntax.js");

function PresentationContext (contextId, abstractSyntax, transferSyntaxes){

  this.contextId = contextId ?  contextId: 0;
  this.abstractSyntax = abstractSyntax ? abstractSyntax : new PresentationSyntax();


  this.transferSyntaxes = transferSyntaxes ? transferSyntaxes
  : [new PresentationSyntax(new NetworkDataRepresentation().NDR_SYNTAX)];
}

PresentationContext.prototype.read = function (ndr) {
  ndr.getBuffer().align(4);
  contextId = ndr.readUnsignedShort();

  var count = ndr.readUnsignedSmall();

  this.abstractSyntax.decode(ndr, ndr.getBuffer());
  this.transferSyntaxes = new Array(count);

  for (var i = 0; i < count; i++){
    transferSyntaxes[i] = new PresentationSyntax();
    transferSyntaxes[i].decode(ndr, ndr.getBuffer());
  }
};

PresentationContext.prototype.write = function (ndr) {
  ndr.getBuffer().alignToValue(4, 0xcc);
  ndr.writeUnsignedShort(this.contextId);
  ndr.writeUnsignedShort(this.transferSyntaxes.length);

  this.abstractSyntax.encode(ndr, ndr.getBuffer());
  for (var i = 0; i < this.transferSyntaxes.length; i++){
    this.transferSyntaxes[i].encode(ndr, ndr.getBuffer());
  }
};

module.exports = PresentationContext;
