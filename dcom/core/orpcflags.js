//@ts-check

module.exports = Object.freeze({
    ORPCF_NULL: 0,  // no additional info in packet
    ORPCF_LOCAL: 1,  // call is local to this machine
    ORPCF_RESERVED1: 2,  // reserved for local use
    ORPCF_RESERVED2: 4,  // reserved for local use
    ORPCF_RESERVED3: 8,  // reserved for local use
    ORPCF_RESERVED4: 16  // reserved for local use
});