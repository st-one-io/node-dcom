var HashMap = require('hashmap');
var Encdec = require('./encdec.js');

function ndrBuffer(buf, start){
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
};

ndrBuffer.prototype.derive = function (idx){
  var nb = new ndrBuffer(buf, start);
  nb.index = idx;
  nb.deferred = this.deferred;
  nb.ignoreAlign = this.ignoreAlign;
  return nb;
}

ndrBuffer.prototype.reset = function (){
  this.index = start;
  length = 0;
  deferred = this;
}

ndrBuffer.prototype.getIndex = function (){
  return this.index;
}

ndrBuffer.prototype.setIndex = function (index){
  this.index = index;
}

ndrBuffer.prototype.getCapacity = function (){
  return buf.length - start;
}

ndrBuffer.prototype.getBuffer = function (){
  return buf;
}

ndrBuffer.prototype.alignToValue = function (boundary, value){
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

ndrBuffer.prototype.writeOctetArray = function (b, i, l){
  var temp = buf.slice(this.index, (this.index + l));
  while (temp.length > 0){
    b.splice(i, 0, temp.shift());
    i++;
  }
  this.advance(l);
}

ndrBuffer.prototype.readOctetArray = function (b, i, l){
  var temp = b.slice(this.index, (this.index + l));
  while (temp.length > 0){
    buff.splice(i, 0, temp.shift());
    i++;
  }
  this.advance(l);
}

ndrBuffer.prototype.getLength = function (){
  return this.deferred.length;
}

ndrBuffer.prototype.advance = function (n){
  this.index += n;
  if ((this.index - this.start) > this.deferred.length){
    this.deferred.length = this.index - this.start;
  }
}

ndrBuffer.prototype.align = function (boundary){
  if (ignoreAlign){
    return 0;
  }

  var m = boundary - 1;
  var i = index - start;
  var n = ((i + m) & ~m) - i;
  this.advance(n);
  return n;
}

ndrBuffer.prototype.enc_ndr_small = function (s){
  buf[this.index] = s & 0xFF;
  this.advance(1);
}

ndrBuffer.prototype.dec_ndr_small = function (){
  var val = buf[this.index] & 0xFF;
  this.advance(1);
  return val;
}

ndrBuffer.prototype.enc_ndr_short = function (s){
  this.align(2);
  Encdec.enc_uint16le(s, buf, this.index);
  this.advance(2);
}

ndrBuffer.prototype.dec_ndr_short = function (){
  this.align(2);
  var val = Encdec.dec_uint16le(buf,this.index);
  this.advance(2);
  return val;
}

ndrBuffer.prototype.enc_ndr_long = function (l){
  this.align(4);
  Encdec.enc_uint32le(l, buf, this.index);
  this.advance(4);
}

ndrBuffer.prototype.dec_ndr_long = function (){
  this.align(4);
  var val = Encdec.dec_uint32le(buf, this.index);
  this.advance(4);
  return val;
}

ndrBuffer.prototype.enc_ndr_string = function (s){
  this.align(4);
  var i = this.index;
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
  this.advance(i - this.index);
}

ndrBuffer.prototype.dec_ndr_string = function (){
  this.align(4);
  var i = this.index;
  var val = null;
  var len = Encdec_dec_uint32le(buf, i);

  i += 12;
  if (len != 0){
    len--;
    size = len * 2;

    if (size < 0 || size > 0xFFFF) throw "INVALID CONFORMANCE";
    var val = String(buf);
  }
  this.advance(i - this.index);
  return val;
}

ndrBuffer.prototype.getDceReferent = function (obj){
  var e;

  if (this.referents == null){
    this.referents = new HashMap();
    this.referent = 1;
  }

  if ((e = this.referents.get(obj)) === null){
    e = new entry();
    e.referent = this.referent++;
    e.obj = obj;
    this.referents.set(obj, e);
  }
  return e.referent;
}

ndrBuffer.prototype.enc_ndr_referent = function (obj, type) {
  if (obj == null){
    this.enc_ndr_long(0);
    return;
  }

  switch(type){
    case 1:
    case 3:
      //TO-DO: find a way to hash an object, like Java's identityHash()
    case 5:
      this.enc_ndr_long(getDceReferent(obj));
      return;
  }
}

ndrBuffer.prototype.toString = function(){
  return String("start=" + this.start + ", index=" + this.index + ",length=" + this.getLength());
}

module.exports = ndrBuffer;
