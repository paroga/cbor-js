/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2014-2016 Patrick Gansterer <paroga@paroga.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

(function(global, undefined) { "use strict";
var //POW_2_24 = 5.960464477539063e-8, // no longer used
    POW_2_32 = 4294967296,
    POW_2_53 = 9007199254740992;

  var singleFloatView = new Float32Array(1);
  var singleIntView = new Uint32Array(singleFloatView.buffer);


function decodeFloat16(value) {
  var exponent = (value & 0x7C00) >> 10,
    fraction = value & 0x03FF;
  return (value >> 15 ? -1 : 1) * (
      exponent ?
        (
          exponent === 0x1F ?
            fraction ? NaN : Infinity :
          Math.pow(2, exponent - 15) * (1 + fraction / 0x400)
        ) :
      6.103515625e-5 * (fraction / 0x400)
    );
}

function checkFloat32(value) {
  singleFloatView[0] = value;
  var xf = singleFloatView[0];
  // skip NaN check, should be encoded as float 16
  return xf === value ? singleIntView[0] : false;
}

function getFloat16(value) {
  singleFloatView[0] = value;
  var fbits = singleIntView[0];


  /* fast but dirty, causes test failures
   return (
   ((fbits>>16)&0x8000)|
   ((((fbits&0x7f800000)-0x38000000)>>13)&0x7c00)|
   ((fbits>>13)&0x03ff)
   );
   */


  var sign = ( fbits >> 16 ) & 0x8000;          // sign only
  var exponentAndMantissa = fbits & 0x7fffffff;
  var val = ( exponentAndMantissa ) + 0x1000; // rounded value

  if (val >= 0x47800000) {
    /* jshint laxbreak:true */
    return val < 0x7f800000
      ? sign | 0x7c00
      : sign | 0x7c00 | ( fbits & 0x007fffff ) >> 13;
    /* jshint laxbreak:false */
  }


  if (val >= 0x38800000) {             // remains normalized value
    return sign | val - 0x38000000 >> 13; // exp - 127 + 15
  }

  if (val < 0x33000000) {             // too small for subnormal
    return sign;                        // becomes +/-0
  }

  val = ( exponentAndMantissa ) >> 23;   // tmp exp for subnormal calc
  return sign | ( ( fbits & 0x7fffff | 0x800000 ) + // add subnormal bit
    ( 0x800000 >>> val - 102 )       // round depending on cut off
    >> 126 - val );                  // div by 2^(1-(exp-127+15)) and >> 13 | exp=0
}

function checkFloat16(value) {
  var data = getFloat16(value);
  var decoded = decodeFloat16(data);
  return decoded === value || isNaN(decoded) && isNaN(value) ? data : false;
}

function getByteLengthOfUtf8String(value) {
  var c = 0;
  for (var i = 0; i < value.length; ++i) {
    var charCode = value.charCodeAt(i);
    /* jshint laxbreak:true */
    //noinspection CommaExpressionJS
    c += charCode < 0x80
      ? 1
      : charCode < 0x800
      ? 2
      : charCode < 0xd800
      ? 3
      : (++i, 4);
    /* jshint laxbreak:false */
  }
  return c;
}

function encode(value) {
  var i;
  var data = new ArrayBuffer(256);
  var dataView = new DataView(data);
  var lastLength;
  var offset = 0;

  function prepareWrite(length) {
    var newByteLength = data.byteLength;
    var requiredLength = offset + length;
    while (newByteLength < requiredLength)
      newByteLength <<= 1;
    if (newByteLength !== data.byteLength) {
      var oldDataView = dataView;
      data = new ArrayBuffer(newByteLength);
      dataView = new DataView(data);
      var uint32count = (offset + 3) >> 2;
      for (var i = 0; i < uint32count; ++i)
        dataView.setUint32(i << 2, oldDataView.getUint32(i << 2));
    }

    lastLength = length;
    return dataView;
  }

  function maybeIntKey(key) {
    var charCode = key.charCodeAt(0);
    var isNumKey = charCode >= 48 && charCode <= 57;
    for (var ki = 1; isNumKey && ki < key.length; ++ki) {
      charCode = key.charCodeAt(ki);
      isNumKey = charCode >= 48 && charCode <= 57;
    }
    if (isNumKey)
      key = parseInt(key, 10);
    return key;
  }

  function commitWrite() {
    offset += lastLength;
  }

  function writeFloat16(value) {
    dataView.setUint8(offset, 0xf9);
    dataView.setUint16(offset+1, getFloat16(value));
    offset += 3;
  }

  function writeFloat(value) {
    var f16 = checkFloat16(value);
    if (f16 !== false) {
      dataView.setUint8(offset, 0xf9);
      dataView.setUint16(offset+1, f16);
      offset += 3;
      return;
    }
    var f32 = checkFloat32(value);
    if (f32 !== false) {
      dataView.setUint8(offset, 0xfa);
      dataView.setUint32(offset+1, f32);
      offset += 5;
      return;
    }
    //writeUint8(0xfb);
    //writeFloat64(value);

    dataView.setUint8(offset, 0xfb);
    dataView.setFloat64(offset+1, value);
    offset += 9;
  }


  function writeUint8(value) {
    commitWrite(prepareWrite(1).setUint8(offset, value));
  }
  function writeUint8Array(value) {
    var dataView = prepareWrite(value.length);
    for (var i = 0; i < value.length; ++i)
      dataView.setUint8(offset + i, value[i]);
    commitWrite();
  }
  function writeUint16(value) {
    commitWrite(prepareWrite(2).setUint16(offset, value));
  }
  function writeUint32(value) {
    commitWrite(prepareWrite(4).setUint32(offset, value));
  }
  function writeUint64(value) {
    var low = value % POW_2_32;
    var high = (value - low) / POW_2_32;
    var dataView = prepareWrite(8);
    dataView.setUint32(offset, high);
    dataView.setUint32(offset + 4, low);
    commitWrite();
  }
  function writeTypeAndLength(type, length) {
    if (length < 24) {
      writeUint8(type << 5 | length);
    } else if (length < 0x100) {
      writeUint8(type << 5 | 24);
      writeUint8(length);
    } else if (length < 0x10000) {
      writeUint8(type << 5 | 25);
      writeUint16(length);
    } else if (length < 0x100000000) {
      writeUint8(type << 5 | 26);
      writeUint32(length);
    } else {
      writeUint8(type << 5 | 27);
      writeUint64(length);
    }
  }

  function writeUtf8String(value) {
    var utf8len = getByteLengthOfUtf8String(value);
    writeTypeAndLength(3, utf8len);
    for (var i = 0; i < value.length; ++i) {
      var charCode = value.charCodeAt(i);
      if (charCode < 0x80) {
        dataView.setUint8(offset++, charCode);
      } else if (charCode < 0x800) {
        dataView.setUint8(offset, 0xc0 | charCode >> 6);
        dataView.setUint8(offset+1, 0x80 | charCode & 0x3f);
        offset += 2;
      } else if (charCode < 0xd800) {
        dataView.setUint8(offset, 0xe0 | charCode >> 12);
        dataView.setUint8(offset+1, 0x80 | (charCode >> 6) & 0x3f);
        dataView.setUint8(offset+2, 0x80 | charCode & 0x3f);
        offset += 3;
      } else {
        charCode = (((charCode & 0x3ff) << 10) | (value.charCodeAt(++i) & 0x3ff)) + 0x10000;

        dataView.setUint8(offset, 0xf0 | charCode >> 18);
        dataView.setUint8(offset+1, 0x80 | (charCode >> 12) & 0x3f);
        dataView.setUint8(offset+2, 0x80 | (charCode >> 6) & 0x3f);
        dataView.setUint8(offset+3, 0x80 | charCode & 0x3f);
        offset += 4;
      }
    }
  }

  function encodeItem(value) {
    var i;

    if (value === false)
      return writeUint8(0xf4);
    if (value === true)
      return writeUint8(0xf5);
    if (value === null)
      return writeUint8(0xf6);
    if (value === undefined)
      return writeUint8(0xf7);

    switch (typeof value) {
      case "number":
          if (isNaN(value))
            return writeFloat16(value);
        if (Math.floor(value) === value) {
          if (0 <= value && value <= POW_2_53)
            return writeTypeAndLength(0, value);
          if (-POW_2_53 <= value && value < 0)
            return writeTypeAndLength(1, -(value + 1));
        }

        //writeUint8(0xfb);
        //return writeFloat64(value);
        return writeFloat(value);

      case "string":
        return writeUtf8String(value);

      default:
        var length;
        if (Array.isArray(value)) {
          length = value.length;
          writeTypeAndLength(4, length);
          for (i = 0; i < length; ++i)
            encodeItem(value[i]);
        } else if (value instanceof Uint8Array) {
          writeTypeAndLength(2, value.length);
          writeUint8Array(value);
        } else {
          var keys = Object.keys(value);
          length = keys.length;
          writeTypeAndLength(5, length);
          for (i = 0; i < length; ++i) {
            var key = maybeIntKey(keys[i]);
            encodeItem(key);
            encodeItem(value[key]);
          }
        }
    }
  }

  encodeItem(value);
  /* istanbul ignore if */
  if ("slice" in data)
    return data.slice(0, offset);

  var ret = new ArrayBuffer(offset);
  var retView = new DataView(ret);
  for (i = 0; i < offset; ++i)
    retView.setUint8(i, dataView.getUint8(i));
  return ret;
}

function decode(data, tagger, simpleValue, options) {
  if ( data.byteLength === 0)
    return undefined;
  var dataView = new DataView(data);
  var offset = 0;

    var allowRemainingBytes = options && options.allowRemainingBytes || false;
  if (typeof tagger !== "function")
    tagger = function(value) { return value; };
  if (typeof simpleValue !== "function")
    simpleValue = function() { return undefined; };

  function commitRead(length, value) {
    offset += length;
    return value;
  }
  function readArrayBuffer(length) {
    return commitRead(length, new Uint8Array(data, offset, length));
  }
    function readFloat16() {
      return decodeFloat16(readUint16());
    }

  function readFloat32() {
    return commitRead(4, dataView.getFloat32(offset));
  }
  function readFloat64() {
    return commitRead(8, dataView.getFloat64(offset));
  }
  function readUint8() {
    return commitRead(1, dataView.getUint8(offset));
  }
  function readUint16() {
    return commitRead(2, dataView.getUint16(offset));
  }
  function readUint32() {
    return commitRead(4, dataView.getUint32(offset));
  }
  function readUint64() {
    return readUint32() * POW_2_32 + readUint32();
  }
  function readBreak() {
    if (dataView.getUint8(offset) !== 0xff)
      return false;
    offset += 1;
    return true;
  }
  function readLength(additionalInformation) {
    if (additionalInformation < 24)
      return additionalInformation;
    if (additionalInformation === 24)
      return readUint8();
    if (additionalInformation === 25)
      return readUint16();
    if (additionalInformation === 26)
      return readUint32();
    if (additionalInformation === 27)
      return readUint64();
    if (additionalInformation === 31)
      return -1;
    throw "Invalid length encoding";
  }

  function readIndefiniteStringLength(majorType) {
    var initialByte = readUint8();
    if (initialByte === 0xff)
      return -1;
    var length = readLength(initialByte & 0x1f);
    if (length < 0 || (initialByte >> 5) !== majorType)
      throw "Invalid indefinite length element";
    return length;
  }

  function appendUtf16Data(newStr, length) {
    for (var i = 0; i < length; ++i) {
      var value = readUint8();
        var highBit = value & 0x80;
        if (highBit) {
        if (value < 0xe0) {
          value = (value & 0x1f) <<  6
                | (readUint8() & 0x3f);
          length -= 1;
        } else if (value < 0xf0) {
          value = (value & 0x0f) << 12
                | (readUint8() & 0x3f) << 6
                | (readUint8() & 0x3f);
          length -= 2;
        } else {
          value = (value & 0x0f) << 18
                | (readUint8() & 0x3f) << 12
                | (readUint8() & 0x3f) << 6
                | (readUint8() & 0x3f);
          length -= 3;
        }
      }

      if (value < 0x10000) {
          newStr += String.fromCharCode(value);
      } else {
        value -= 0x10000;
          newStr += String.fromCharCode(
            (0xd800 | (value >> 10)),
            (0xdc00 | (value & 0x3ff)));
      }
    }
      return newStr;
  }

  function decodeItem() {
    var initialByte = readUint8();
    var majorType = initialByte >> 5;
    var additionalInformation = initialByte & 0x1f;
    var i;
    var length;

    if (majorType === 7) {
      switch (additionalInformation) {
        case 25:
          return readFloat16();
        case 26:
          return readFloat32();
        case 27:
          return readFloat64();
      }
    }

    length = readLength(additionalInformation);
    if (length < 0 && (majorType < 2 || 6 < majorType))
      throw "Invalid length";

    switch (majorType) {
        default:
        //case 0:
        return length;
      case 1:
        return -1 - length;
      case 2:
        if (length < 0) {
          var elements = [];
          var fullArrayLength = 0;
          while ((length = readIndefiniteStringLength(majorType)) >= 0) {
            fullArrayLength += length;
            elements.push(readArrayBuffer(length));
          }
          var fullArray = new Uint8Array(fullArrayLength);
          var fullArrayOffset = 0;
          for (i = 0; i < elements.length; ++i) {
            fullArray.set(elements[i], fullArrayOffset);
            fullArrayOffset += elements[i].length;
          }
          return fullArray;
        }
        return readArrayBuffer(length);
      case 3:
        var newStr = "";
        if (length < 0) {
          while ((length = readIndefiniteStringLength(majorType)) >= 0) {
            newStr = appendUtf16Data(newStr, length);
          }
        } else {
          newStr = appendUtf16Data(newStr, length);
        }
        return newStr;
      case 4:
        var retArray;
        if (length < 0) {
          retArray = [];
          while (!readBreak())
            retArray.push(decodeItem());
        } else {
          retArray = new Array(length);
          for (i = 0; i < length; ++i)
            retArray[i] = decodeItem();
        }
        return retArray;
      case 5:
        var retObject = {};
        for (i = 0; i < length || length < 0 && !readBreak(); ++i) {
          var key = decodeItem();
          retObject[key] = decodeItem();
        }
        return retObject;
      case 6:
        return tagger(decodeItem(), length);
      case 7:
        switch (length) {
          case 20:
            return false;
          case 21:
            return true;
          case 22:
            return null;
          case 23:
            return undefined;
          default:
            return simpleValue(length);
        }
    }
  }

  var ret = decodeItem();
    if (offset !== data.byteLength && !allowRemainingBytes)
      throw new Error((data.byteLength - offset) + " remaining bytes after end of encoding");
  return ret;
}

var obj = { encode: encode, decode: decode };

if (typeof define === "function" && define.amd)
  define("cbor/cbor", obj);
else /* istanbul ignore if */ if (typeof module !== "undefined" && module.exports)
  module.exports = obj;
else if (!global.CBOR)
  global.CBOR = obj;

})(this);
