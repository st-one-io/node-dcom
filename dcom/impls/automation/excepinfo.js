class ExcepInfo
{
  constructor()
  {
    this.excepSource = null;
    this.excepDesc = null;
    this.excepHelpfile = null;
    this.errorCode = -1;
  }

  clearAll()
  {
    this.errorCode = -1;
    this.excepSource = null;
    this.excepDesc = null;
    this.excepHelpfile = null;
  }

  getErrorCode()
  {
    return this.errorCode;
  }

  getExcepSource()
  {
    return this.excepSource;
  }

  getExcepDesc()
  {
    return this.excepDesc;
  }

  getHelpFilePath()
  {
    return this.excepHelpfile;
  }
}

module.exports = ExcepInfo;
