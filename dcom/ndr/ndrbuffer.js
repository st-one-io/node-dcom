// @ts-check
const HashMap = require('hashmap');
const Encdec = require('./encdec.js');

function NdrBuffer(buf, start){
  this.referent = undefined;
  this.referents = new HashMap();
  this.entry = {
    referent: 0,
    obj: undefined
  };
  // array of bytes
  this.buf = (buf instanceof Buffer)? buf : Buffer.from(buf);
  // integers
  this.start = start;
  this.index = start;
  this.length = 0;
  //NdrBuffer
  this.deferred = this;
  // bool
  this.ignoreAlign = false;
};

/**
 * @param {Number}  idx
 * @returns {Number}
 */
NdrBuffer.prototype.derive = function (idx){
  let nb = new NdrBuffer(buf, start);
  nb.index = idx;
  nb.deferred = this.deferred;
  nb.ignoreAlign = this.ignoreAlign;
  return nb;
}

NdrBuffer.prototype.reset = function (){
  if (this.index == undefined && this.start == undefined) {
    this.index = 0;
    this.start = 0;
    this.length = 0;
    this.deferred = this;
    return
  }
  this.index = this.start;
  this.length = 0;
  this.deferred = this;
  
}

NdrBuffer.prototype.getIndex = function (){
  return this.index;
}

NdrBuffer.prototype.setIndex = function (index){
  this.index = index;
}

NdrBuffer.prototype.getCapacity = function (){
  return this.buf.length - this.start;
}

NdrBuffer.prototype.getBuffer = function (){
  return this.buf;
}

NdrBuffer.prototype.alignToValue = function (boundary, value){
  if (this.ignoreAlign){
    return 0;
  }

  let n = this.align(boundary);
  let i = n;
  while (i > 0){
    this.buf[this.index -i] = value;
    i--;
  }
  return n;
}

NdrBuffer.prototype.writeOctetArray = function (b, i, l){
  let first = this.buf.slice(0, this.index);
  let end = this.buf.slice(this.index, this.buf.length);
  let middle = Buffer.from(b.slice(i, l));
  
  this.buf = Buffer.concat([first, middle, end]);

  this.advance(l);
}

NdrBuffer.prototype.readOctetArray = function (b, i, l){
  /*let temp = [...this.buf.slice(this.index, (this.index + l))];
  let temp_index= i;
  while (temp.length > 0){
    b.splice(temp_index++, 1, temp.shift());
    i++;
  }*/
  let middle = this.buf.slice(this.index, (this.index + l));
  let begin = Buffer.from(b.slice(0, i));
  let end = Buffer.from(b.slice((i + middle.length), b.length));

  this.advance(l);
  return Buffer.concat([begin, middle, end]);
}

NdrBuffer.prototype.getLength = function (){
  return this.deferred.length;
}

NdrBuffer.prototype.advance = function (n){
  this.index += n;
  if ((this.index - this.start) > this.length){
    this.deferred.length = this.index - this.start;
  }
}

NdrBuffer.prototype.align = function (boundary){
  if (this.ignoreAlign){
    return 0;
  }

  let m = boundary - 1;
  let i = this.index - this.start;
  let n = ((i + m) & ~m) - i;
  this.advance(n);
  return n;
}

NdrBuffer.prototype.enc_ndr_small = function (s){
  this.buf[this.index] = s & 0xFF;
  this.advance(1);
}

NdrBuffer.prototype.dec_ndr_small = function (){
  let val = Buffer.from(this.buf).readUInt8(this.index);
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
  let val = Encdec.dec_uint16le(this.buf,this.index);
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
  let val = Encdec.dec_uint32le(this.buf, this.index);
  this.advance(4);
  return val;
}

NdrBuffer.prototype.enc_ndr_string = function (s){
  this.align(4);
  let i = this.index;
  let len = s.length;

  Encdec.enc_uint32le(len + 1, this.buf, i);
  i += 4;
  Encdec.enc_uint32le(0, this.buf, i);
  i += 4;
  Encdec.enc_uint32le(len + 1, this.buf, i);
  i += 4;

  // TO-DO: Here the guys from J-Interop do a encoding suppor check.
  // If any unknown problem appear, remember this has to be implemented.

  i += len * 2;
  this.buf[i++] = '\0';
  this.buf[i++] = '\0';
  this.advance(i - this.index);
}

NdrBuffer.prototype.dec_ndr_string = function (){
  this.align(4);
  let i = this.index;
  let val = null;
  let len = Encdec.dec_uint32le(this.buf, i);

  i += 12;
  if (len != 0){
    len--;
    size = len * 2;

    if (size < 0 || size > 0xFFFF) throw "INVALID CONFORMANCE";
    let val = String(this.buf);
  }
  this.advance(i - this.index);
  return val;
}

NdrBuffer.prototype.getDceReferent = function (obj){
  let e;

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
