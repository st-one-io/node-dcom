var ComObject = require('../../core/comobject.js');
var ComObjectImpl = require('../../core/comobjectimpl.js');
var Variant = require('module');
var ErrorCodes = require('../../common/errorcodes.js');
var System = require('../../common/system.js');
var IArray = require('../../core/iarray.js');
var CallBuilder = require('../../core/callbuilder.js');
var Flags = require('../../core/flags.js');
var FrameWorkHelper = require('../../core/frameworkhelper.js');
var Pointer = require('../../core/pointer.js');
var IString =require('../../core/istring.js');
var Struct = require('../../core/struct.js');
var Variant = require('../../core/variant.js');
var ObjectFactory = require('../impls/objectfactory.js');
var UUID = require('../../rpc/core/uuid.js');
var HashMap = require('hashmap');

class Dispatch extends ComObjectImpl
{
  constructor(ComObject){
    this.serialVersionUID = "4908149252176353846L";
    this.cacheOfDispIds = new HashMap();
    super(comObject);    

  }


}
