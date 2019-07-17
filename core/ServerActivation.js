// @ts-check

/**
 * ServerActivation Interface
 */
class ServerActivation
{
    /**
     * constructor
     */
    constructor()
    {
        this.RPC_C_IMP_LEVEL_IDENTIFY = 2;
        this.TPC_C_IMP_LEVEL_IMPERSONATE = 3;
    }
    
    isActivationSuccessful(){};

    getDualStringArrayForOxid(){};

    getMInterfacePointer(){};

    getIPID(){};

    isDual(){};

    getDispIpid(){};

    getDispRefs(){};

    setDispIpid(dispIpid){};
}

module.exports = ServerActivation;