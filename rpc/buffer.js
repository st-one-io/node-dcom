
class Buffer {
  constructor(buffer, capacityIncrement){
    this.NO_INCREMENT = 0;

    if(buffer == undefined){
      this.buffer = null;
    }else{ this.buffer = buffer;}

    if(capacityIncrement == undefined){
      this.capacityIncrement = NO_INCREMENT;
    }else{this.capacityIncrement = capacityIncrement;}

    this.index = 0;
    this.length;
  }

  get capacityIncrement(){
    return this.capacityIncrement;
  }

  get capacity(){
    return this.buffer.length;
  }

  set capacityIncrement(capacityIncrement){
    this.capacityIncrement = capacityIncrement;
  }

  get buffer(){
    return this.buffer;
  }

  set buffer(buffer){
    this.buffer = buffer;
  }

  get length(){
    return this.length;
  }

  set length(length){
    this.length = length;
  }

  copy(){
    var copy = [this.length];
    var temp = buffer.slice(0, this.length);
    var temp_index= 0;
    while(temp > 0)
      copy.splice(temp_index++, 0, temp.shift());
    return copy;
  }

  reset(){
    this.lenght = 0
    this.index = 0;
  }

  get index(){
    return this.index;
  }

  getIndex(advance){
    try{
      return this.index;
    }finally{
      this.index += advance;
      if(this.index > this.length) this.length = this.index;
      if(this.length > this.buffer.length) grow(this.length);
    }
  }

  set index(index){
    this.index = index;
    if (this.index > this.length) this.length = this.index;
    if (this.length > this.buffer.length) grow(this.length);
  }

  align(boundary, value){
    var align = this.index % boundary;
    if (align == 0) return 0;
    if(value == undefined){
      advance(align = boundary - align);
      return align;
    }else{
      advance(align = boundary - align, value);
      return align;
    }
  }

  advance(step, value){
    if (value == undefined){
      this.index += step;
    }else{
      for (var finish = this.index + step;this.index < finish; this.index++){
        buffer[this.index] = value;
      }
    }
    if (this.index > this.length) this.length = this.index;
    if (this.length > this.buffer.length) grow(this.length);
  }

  grow(length){
    var newLength = this.buffer.length;
    while (this.newLength < this.length){
      this.newLength += capacityIncrement;
    }
    var newBuffer = [this.newLength];

    var temp = this.buffer.slice(0, this.buffer.length);
    var temp_index;
    while(temp.length > 0)
      newBuffer.splice(temp_index, 0, temp.shift());
    this.buffer = newBuffer;
  }
}

module.export = Buffer;
