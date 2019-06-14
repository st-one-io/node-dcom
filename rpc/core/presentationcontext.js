var NdrObject = require("../../ndr/ndrobject.js");
var NetworkDataRepresentation = require("../../ndr/networkdatarepresentation.js");
var PresentationSyntax = require("./presentationsyntax.js");

function PresentationContext (contextId, abstractSyntax, transferSyntaxes){
  this.contextId = contextId;
  this.abstractSyntax = abstractSyntax;
  this.transferSyntaxes = transferSyntaxes;
}

PresentationContext.prototype.read = function (ndr) {
  ndr.getBuffer().align(4);
  contextId = ndr.readUnsignedShort();

  var count = ndr.readUnsignedSmall();

  abstractSyntax.decode(ndr, ndr.getBuffer());
  this.transferSyntaxes = new PresentationSyntax[count];

  for (var i = 0; i < count; i++){
    transferSyntaxes[i] = new PresentationSyntax();
    transferSyntaxes[i].decode(ndr, ndr.getBuffer());
  }
};

PresentationContext.prototype.write = function (ndr) {
  ndr.getBuffer().align(4, 0xcc);
  ndr.writeUnsignedSHort(this.contextId);
  ndr.writeUnsignedSHort(this.transferSyntaxes.length);

  abstractSyntax.encode(ndr, ndr.getBuffer());
  for (var i = 0; i < transferSyntaxes.length; i++){
    transferSyntaxes[i].encode(ndr, nder.getBuffer());
  }
};

module.exports = PresentationContext;
