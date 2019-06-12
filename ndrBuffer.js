var HashMap = require('hashmap');
var Encdec = require('./encdec.js');

module.exports = function ndrBuffer(buf, start){
  this.referent = undefined;
  this.referents = new HashMap();
  this.entry = {
    referent: 0,
    obj: undefined
  };
  // array of bytes
  this.buf = buf;
  // integers
  this.start = start;
  this.index = start;
  this.length = 0;
  //ndrBuffer
  this.deferred = this;
  // bool
  this.ignoreAlign = false;

  this.derive = function (idx){
    var nb = new ndrBuffer(buf, start);
    nb.index = idx;
    nb.deferred = this.deferred;
    nb.ignoreAlign = this.ignoreAlign;
    return nb;
  }

  this.reset = function (){
    this.index = start;
    length = 0;
    deferred = this;
  }

  this.getIndex = function (){
    return this.index;
  }

  this.setIndex = function (index){
    this.index = index;
  }

  this.getCapacity = function (){
    return buf.length - start;
  }

  this.getBuffer = function (){
    return buf;
  }

  this.alignToValue = function (boundary, value){
    if (ignoreAlign){
      return 0;
    }
    var n = alignToValue(boundary);
    var i = n;
    while (i > 0){
      buf[index -i] = value;
      i--;
    }
    return n;
  }

  this.writeOctetArray = function (b, i, l){
    b.splice(i, 0, buf.slice(index, (index + l)));
    advance(l);
  }

  this.readOctetArray = function (b, i, l){
    b.splice(i, 0, buf.slice(index, (index + l)));
    advance(l);
  }

  this.getLength = function (){
    return this.deferred.length;
  }

  this.advance = function (n){
    index += n;
    if ((index - start) > deferred.length){
      deferred.length = index - start;
    }
  }

  this.align = function (boundary){
    if (ignoreAlign){
      return 0;
    }

    var m = boundary - 1;
    var i = index - start;
    var n = ((i + m) & ~m) - i;
    advance(n);
    return n;
  }

  this.enc_ndr_small = function (s){
    buf[index] = s & 0xFF;
    advance(1);
  }

  this.dec_ndr_small = function (){
    var val = buf[index] & 0xFF;
    advance(1);
    return val;
  }

  this.enc_ndr_short = function (s){
    align(2);
    Encdec.enc_uint16le(s, buf, index);
    advance(2);
  }

  this.dec_ndr_short = function (){
    align(2);
    var val = Encdec.dec_uint16le(buf, index);
    advance(2);
    return val;
  }

  this.enc_ndr_long = function (l){
    align(4);
    Encdec.enc_uint32le(l, buf, index);
    advance(4);
  }

  this.dec_ndr_long = function (){
    align(4);
    var val = Encdec.dec_uint32le(buf, index);
    advance(4);
    return val;
  }

  this.enc_ndr_string = function (s){
    align(4);
    var i = index;
    var len = s.length;

    Encdec.enc_uint32le(len + 1, buf, i);
    i += 4;
    Encdec.enc_uint32le(0, buf, i);
    i += 4;
    Encdec.enc_uint32le(len + 1, buf, i);
    i += 4;

    // TO-DO: Here the guys from J-Interop do a encoding suppor check.
    // If any unknown problem appear, remember this has to be implemented.

    i += len * 2;
    buf[i++] = '\0';
    buf[i++] = '\0';
    advance(i - index);
  }

  this.dec_ndr_string = function (){
    align(4);
    var i = index;
    var val = null;
    var len = Encdec_dec_uint32le(buf, i);

    i += 12;
    if (len != 0){
      len--;
      size = len * 2;

      if (size < 0 || size > 0xFFFF) throw "INVALID CONFORMANCE";
      var val = String(buf);
    }
    advance(i - index);
    return val;
  }

  this.getDceReferent = function (obj){
    var e;

    if (referents == null){
      referents = new HashMap();
      referent = 1;
    }

    if ((e = referents.get(obj)) === null){
      e = new entry();
      e.referent = referent++;
      e.obj = obj;
      referents.set(obj, e);
    }
    return e.referent;
  }

  this.enc_ndr_referent = function (obj, type) {
    if (obj == null){
      enc_ndr_long(0);
      return;
    }

    switch(type){
      case 1:
      case 3:
        //TO-DO: find a way to hash an object, like Java's identityHash()
      case 5:
        enc_ndr_long(getDceReferent(obj));
        return;
    }
  }

  this.toString = function(){
    return String("start=" + start + ", index=" + index + ",length=" + getLength());
  }
};
