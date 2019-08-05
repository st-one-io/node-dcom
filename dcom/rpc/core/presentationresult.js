var PresentationSyntax = require("./presentationsyntax.js");
var NetworkDataRepresentation = require("../../ndr/networkdatarepresentation.js");

function PresentationResult(){
  this.ACCEPTANCE = 0;

  this.USER_REJECTION = 1;

  this.PROVIDER_REJECTION = 1;

  this.REASON_NOT_SPECIFIED = 0;

  this.ABSTRACT_SYNTAX_NOT_SUPPORTED = 1;

  this.PROPOSED_TRANSFER_SYNTAX_NOT_SUPPORTED = 2;

  this.LOCAL_LIMIT_EXCEEDED = 3;

  this.result = this.ACCEPTANCE;
  this.reason = this.REASON_NOT_SPECIFIED;
  this.transferSyntax = new PresentationSyntax(new NetworkDataRepresentation().NDR_SYNTAX);
}

PresentationResult.prototype.read = function (ndr) {
  ndr.getBuffer().align(4);
  this.result = ndr.readUnsignedShort();
  this.reason = ndr.readUnsignedShort();

  this.transferSyntax = new PresentationSyntax();
  this.transferSyntax.decode(ndr, ndr.getBuffer());
};

PresentationResult.prototype.write = function (ndr) {
  ndr.getBuffer().alignt(4, 0);
  ndr.writeUnsignedShort(this.result);
  ndr.writeUnsignedShort(this.reason);

  if (this.transferSyntax != null){
    transferSyntax.encode(ndr, ndr.getBuffer());
  }
};

module.exports = PresentationResult;
