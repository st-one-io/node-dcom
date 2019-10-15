class ComVersion
{
  constructor(majorVersion, minorVersion)
  {
    this.serialVersionUID = "-1252228963385487909L";
    this.majorVersion = (majorVersion) ? majorVersion : 5;
    this.minorVersion= (minorVersion) ? minorVersion : 4;
  }

  getMajorVersion()
  {
    return this.majorVersion;
  }


  setMajorVersion(majorVersion)
  {
    this.majorVersion = majorVersion;
  }

  getMinorVersion()
  {
    return this.minorVersion;
  }

  setMinorVersion(minorVersion)
  {
    this.minorVersion = minorVersion;
  }
}

module.exports = ComVersion;
