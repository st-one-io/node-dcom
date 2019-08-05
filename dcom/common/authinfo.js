class AuthInfo
{
  constructor(domain, username, password)
  {
      this.username = username;
      this.password = password;
      this.domain = domain;
  }

  get userName(){
    return this.userName;
  }

  get passord(){
    return this.password;
  }

  get domain(){
    return this.domain;
  }
}

module.exports = AuthInfo;
