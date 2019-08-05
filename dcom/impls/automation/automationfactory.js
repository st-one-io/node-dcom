var IDispatch = require('./idispatch.js');
var ITypeInfo = require('./itypeinfo.js');
var ITypeLib = require('./itypelib.js');
var IEnumVariant = require('./ienumvariant.js');

class Internal_AutomationFactory
{
  constructor()
  {
    this.IID_IDispatch = IDispatch.IID:
    this.IID_ITypeInfo = ITypeInfo.IID;
    this.IID_ITypeLib = ITypeLib.IID;

    this.IID_IEnumVariant = IEnumVariant.IID;
  }

  narrowObject(comObject)
  {
    var retval = comObject;
    var IID = comObject.getInterfaceIdentifier();

    if (!IID.localeCompare(IID_IDispatch,'en',{sensitivity:'accent'})) {
      retval = new IDispachImpl(retval);
    } else if (!IID.localeCompare(IID_ITypeInfo,'en',{sensitivity:'accent'})) {
      retval = new ITypeInfo(retval);
    } else if (!IID.localeCompare(IID_ITypeLib,'en',{sensitivity:'accent'})) {
      retval = new ITypeLib(retval);
    } else if ((!IID.localeCompare(IID_IEnumVariant,'en',{sensitivity:'accent'})) {
      retval = new IEnumVariant(retval);
    }
    return retval;
  }
}
