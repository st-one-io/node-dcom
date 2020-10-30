const { Session, Clsid, ComServer } = require('../dcom')

const domain = 'WORKGROUP'
const username = 'myuser'
const password = 'mypassword'
const ipAddress = '1.2.3.4'
const timeout = 1000
const classIdString = 'F8582CF2-88FB-11D0-B850-00C0F0104305' // Matrikon.OPC.Simulation

const sessionSingleton = new Session()

async function main () {
  const comSession = sessionSingleton.createSession(domain, username, password)
  comSession.setGlobalSocketTimeout(timeout)
  const clsid = new Clsid(classIdString)
  const comServer = new ComServer(clsid, ipAddress, comSession, { major: 5, minor: 7 })

  try {
    // start the COM Server
    await comServer.init()
    console.log(`Successfully connected to ${ipAddress}`)

    await comServer.closeStub()
  } catch (err) {
    console.trace(err)
  }

  await comSession.destroySession(comSession)
}

main()
