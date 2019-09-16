// @ts-check
const NdrObject = require('../../ndr/ndrobject.js');
const NetworkDataRepresentation = require('../../ndr/networkdatarepresentation.js');
const PresentationSyntax = require('./presentationsyntax.js');

/**
 *
 * @param {Number} contextId
 * @param {PresentationSyntax} abstractSyntax
 * @param {Array} transferSyntaxes
 */
function PresentationContext(contextId, abstractSyntax, transferSyntaxes) {
  this.contextId = contextId ? contextId: 0;
  this.abstractSyntax = abstractSyntax ?
   abstractSyntax : new PresentationSyntax();

  this.transferSyntaxes = transferSyntaxes ? transferSyntaxes :
   [new PresentationSyntax(new NetworkDataRepresentation().NDR_SYNTAX)];
}

PresentationContext.prototype.read = function(ndr) {
  ndr.getBuffer().align(4);
  this.contextId = ndr.readUnsignedShort();

  let count = ndr.readUnsignedSmall();

  this.abstractSyntax.decode(ndr, ndr.getBuffer());
  this.transferSyntaxes = new Array(count);

  for (let i = 0; i < count; i++) {
    this.transferSyntaxes[i] = new PresentationSyntax();
    this.transferSyntaxes[i].decode(ndr, ndr.getBuffer());
  }
};

PresentationContext.prototype.write = function(ndr) {
  ndr.getBuffer().alignToValue(4, 0xcc);
  ndr.writeUnsignedShort(this.contextId);
  ndr.writeUnsignedShort(this.transferSyntaxes.length);

  this.abstractSyntax.encode(ndr, ndr.getBuffer());
  for (let i = 0; i < this.transferSyntaxes.length; i++) {
    this.transferSyntaxes[i].encode(ndr, ndr.getBuffer());
  }
};

module.exports = PresentationContext;
