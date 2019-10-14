# node-dcom

node-com is a partial DCOM-compatible lib for Node.js environment. Most of the implementation do not follow the official specification so not all the protocol features are supported. This was implemented as a part of our OPC-DA node for Node-RED so features were implemented as they were needed for what we wanted to achieve with that node.

## Table of Contents

- [Install](#install)
- [Usage]()
  - [Creating a Session](#creatingasession)
  - [Creating a Server](#creatingaserver)
  - [Creating a COM Object](#comobject)
- [Contributin](#contributin)

## Install

Using npm:

```
npm install node-dcom
```

## Creating a Session

To create a session you will need the following information from the server: user name, password, and domain.  In the example we call ```createSession``` :

```javascript
let session = new Session();
session = session.createSession(domain, username, password);
```

By default the global timeout is set to 0 so you should also set the correct connection timeout according to how you network behaves. If no values are defined for the timeout or if the value is too low for the average response time of your connection you'll be able to create a session but the next step (creating a server) will have frequent timeouts.

```javascript
session.setGlobalSocketTimeout(timeout);
```

## Creating a Server

Now that you've already created a session you can create a server reference. To create this you'll need the [ClassID](https://docs.microsoft.com/en-us/windows/win32/com/clsid-key-hklm) of the server you want to connect and it's IP address. With those at hand you create a ``clsid``  object and pass it as one of the parameters for the server:

```javascript
let Clsid = new Clsid(ClassID);
let comServer = new ComServer(Clsid, address, session);
comServer.init();
```

With that the server will create an endpoint that will be attached to the given address, authenticate, and will issue an activation request. To be able to query object on this server you'll have to create create a COM Object reference for the server:

```javascript
let server = comServer.getInstance();
```

## Creating a COM Object

WIth both the session and server instance created you can finally create a COM Object. For this we'll use the ```queryInterface``` function giving the  [ClassID](https://docs.microsoft.com/en-us/windows/win32/com/clsid-key-hklm) (here you can give the string) of the desired object as an argument.

```javascript
server.queryInterface(ClassID);
```

## Contributing

This is a partial implementation and there are lots that could be done to improve what is already supported or to add support for more DCOM features. Feel free to dive in! Open an issue or submit PRs.