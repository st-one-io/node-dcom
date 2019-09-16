// @ts-check

/**
 * A simple class to store authentication info.
 */
class AuthInfo {
  /**
   *
   * @param {String} domain
   * @param {String} username
   * @param {String} password
   */
  constructor(domain, username, password) {
    this.username = username;
    this.password = password;
    this.domain = domain;
  }

  /**
   * @return {String}
   */
  getUserName() {
    return this.userName;
  }

  /**
   * @return {String}
   */
  getPassord() {
    return this.password;
  }

  /**
   * @return {String}
   */
  getDomain() {
    return this.domain;
  }
}

module.exports = AuthInfo;
