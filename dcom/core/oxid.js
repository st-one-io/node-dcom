

class Oxid
{
  constructor(oxid){
    this.serialVersionUID ="3456725801334190150L";
    this.oxid = (oxid == undefined) ? null : oxid;
  }

  getOXID()
  {
    return this.oxid;
  }

  hashCode()
  {
    var result = 1;
    for (var i = 0; i < this.oxid.length; i++) {
      result = 31 * result + this.oxid[i];
    }
    return result;
  }

  equals(obj)
  {
    if (!obj instanceof Oxid) {
      return false;
    }
    var tmp = obj.getOXID();
    for (var i = 0; i < this.oxid.length; i++) {
      if (this.oxid[i] != tmp[i])
        return false;
    }
    return true;
  }
}

module.exports = Oxid;
