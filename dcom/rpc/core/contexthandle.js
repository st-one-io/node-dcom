const ndrObject = require('../../ndr/ndrobject.js');
const UUID = require('./uuid.js');

/**
 *
 * @param {Object} attributes
 * @param {UUID} uuid
 */
function ContextHandle(attributes, uuid) {
  this.attributes = setAttributes(uuid);
  this.uuid = new UUID(uuid);
};

/**
 * @return {Object}
 */
contextHandle.prototype.getAttributes = function() {
  return this.attributes;
};

contextHandle.prototype.setAttributes = function(attributes) {
  this.attributes = attributes;
};

contextHandle.prototype.getUUID = function() {
  return this.uuid;
};

contextHandle.prototype.setUUID = function() {
  this.uuid = uuid;
};

module.exports = ContextHandle;
