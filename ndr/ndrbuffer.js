var HashMap = require('hashmap');
var Encdec = require('./encdec.js');

function NdrBuffer(buf, start){
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
  //NdrBuffer
  this.deferred = this;
  // bool
  this.ignoreAlign = false;
};

NdrBuffer.prototype.derive = function (idx){
  var nb = new NdrBuffer(buf, start);
  nb.index = idx;
  nb.deferred = this.deferred;
  nb.ignoreAlign = this.ignoreAlign;
  return nb;
}

NdrBuffer.prototype.reset = function (){
  this.index = this.start;
  length = 0;
  deferred = this;
}

NdrBuffer.prototype.getIndex = function (){
  return this.index;
}

NdrBuffer.prototype.setIndex = function (index){
  this.index = index;
}

NdrBuffer.prototype.getCapacity = function (){
  return this.buf.length - start;
}

NdrBuffer.prototype.getBuffer = function (){
  return this.buf;
}

NdrBuffer.prototype.alignToValue = function (boundary, value){
  if (this.ignoreAlign){
    return 0;
  }

  var n = this.align(boundary);
  var i = n;
  while (i > 0){
    this.buf[this.index -i] = value;
    i--;
  }
  return n;
}

NdrBuffer.prototype.writeOctetArray = function (b, i, l){
  var temp = this.buf.slice(this.index, (this.index + l));
  var temp_index= i;
  while (temp.length > 0){
    b.splice(temp_index++, 0, temp.shift());
    i++;
  }
  this.advance(l);
}

NdrBuffer.prototype.readOctetArray = function (b, i, l){
  var temp = b.slice(this.index, (this.index + l));
  var temp_index= i;
  while (temp.length > 0){
    buff.splice(temp_index++, 0, temp.shift());
    i++;
  }
  this.advance(l);
}

NdrBuffer.prototype.getLength = function (){
  return this.deferred.length;
}

NdrBuffer.prototype.advance = function (n){
  this.index += n;
  if ((this.index - this.start) > this.deferred.length){
    this.deferred.length = this.index - this.start;
  }
}

NdrBuffer.prototype.align = function (boundary){
  if (this.ignoreAlign){
    return 0;
  }

  var m = boundary - 1;
  var i = this.index - this.start;
  var n = ((i + m) & ~m) - i;
  this.advance(n);
  return n;
}

NdrBuffer.prototype.enc_ndr_small = function (s){
  this.buf[this.index] = s & 0xFF;
  this.advance(1);
}

NdrBuffer.prototype.dec_ndr_small = function (){
  var val = this.buf[this.index] & 0xFF;
  this.advance(1);
  return val;
}

NdrBuffer.prototype.enc_ndr_short = function (s){
  this.align(2);
  Encdec.enc_uint16le(s, this.buf, this.index);
  this.advance(2);
}

NdrBuffer.prototype.dec_ndr_short = function (){
  this.align(2);
  var val = Encdec.dec_uint16le(buf,this.index);
  this.advance(2);
  return val;
}

NdrBuffer.prototype.enc_ndr_long = function (l){
  this.align(4);
  Encdec.enc_uint32le(l, this.buf, this.index);
  this.advance(4);
}

NdrBuffer.prototype.dec_ndr_long = function (){
  this.align(4);
  var val = Encdec.dec_uint32le(buf, this.index);
  this.advance(4);
  return val;
}

NdrBuffer.prototype.enc_ndr_string = function (s){
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

NdrBuffer.prototype.dec_ndr_string = function (){
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

NdrBuffer.prototype.getDceReferent = function (obj){
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

NdrBuffer.prototype.enc_ndr_referent = function (obj, type) {
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

NdrBuffer.prototype.toString = function(){
  return String("start=" + this.start + ", index=" + this.index + ",length=" + this.getLength());
}

module.exports = NdrBuffer;
