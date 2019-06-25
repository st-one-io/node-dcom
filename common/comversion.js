class ComVersion
{
  constructor(majorVersion, minorVersion)
  {
    this.serialVersionUID = "-1252228963385487909L";
    this.majorVersion = (majorVersion) ? majorVersion : 5;
    this.minorVersion= (minorVersion) ? minorVersion : 4;
  }

  get majorVersion()
  {
    return this.majorVersion;
  }


  set majorVersion(majorVersion)
  {
    this.majorVersion = majorVersion;
  }

  get minorVersion()
  {
    return this.minorVersion;
  }

  set minorVersion(minorVersion)
  {
    this.minorVersion = minorVersion;
  }
}

module.exports = ComVersion;
