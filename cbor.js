/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Patrick Gansterer <paroga@paroga.com>
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

(function (global, undefined) {
  "use strict";
  var POW_2_24 = 5.960464477539063e-8,
    POW_2_32 = 4294967296,
    POW_2_53 = 9007199254740992;

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

  function encode(value, options) {
    //console.log("Beginning encoding...");
    var data;
    var encodeView;
    var lastLength = 0;
    var offset = 0;

    function prepareWrite(length) {
      var newByteLength = data.byteLength;
      var requiredLength = offset + length;
      if (newByteLength < requiredLength)
        throw new Error('Not enough space allocated during accounting pass.');
      lastLength = length;
      return encodeView;
    }

    function commitWrite(view, value) {
      if (value === undefined)
        throw new Error('value is not specified!');
      //console.log("wrote", value, offset, lastLength);
      offset += lastLength;
    }

    var fx_floatView = new Float32Array(1);
    var fx_int32View = new Int32Array(fx_floatView.buffer);

    function checkFloat32(value) {
      fx_floatView[0] = value;
      var xf = fx_floatView[0];
      // skip NaN check, should be encoded as float 16
      return xf === value ? fx_int32View[0] : false;
    }

    function getFloat16(value) {
      fx_floatView[0] = value;
      var fbits = fx_int32View[0];

      var sign = (fbits >> 16) & 0x8000;          // sign only
      var val = ( fbits & 0x7fffffff ) + 0x1000; // rounded value

      if (val >= 0x47800000) {             // might be or become NaN/Inf
        if (( fbits & 0x7fffffff ) >= 0x47800000) {
          // is or must become NaN/Inf
          if (val < 0x7f800000) {          // was value but too large
            return sign | 0x7c00;           // make it +/-Inf
          }
          return sign | 0x7c00 |            // remains +/-Inf or NaN
            ( fbits & 0x007fffff ) >> 13; // keep NaN (and Inf) bits
        }
        return sign | 0x7bff;               // unrounded not quite Inf
      }
      if (val >= 0x38800000) {             // remains normalized value
        return sign | val - 0x38000000 >> 13; // exp - 127 + 15
      }
      if (val < 0x33000000) {             // too small for subnormal
        return sign;                        // becomes +/-0
      }
      val = ( fbits & 0x7fffffff ) >> 23;   // tmp exp for subnormal calc
      return sign | ( ( fbits & 0x7fffff | 0x800000 ) // add subnormal bit
        + ( 0x800000 >>> val - 102 )     // round depending on cut off
        >> 126 - val );                  // div by 2^(1-(exp-127+15)) and >> 13 | exp=0
    }

    function checkFloat16(value) {
      var data = getFloat16(value);
      var decoded = decodeFloat16(data);
      return decoded === value || isNaN(decoded) && isNaN(value) ? data : false;
    }

    function writeFloat16(value) {
      writeUint8(0xf9);
      commitWrite(prepareWrite(2).setUint16(offset, getFloat16(value)), value);
    }

    function writeFloat32(value) {
      writeUint8(0xfa);
      commitWrite(prepareWrite(4).setFloat32(offset, value), value);
    }

    function writeFloat64(value) {
      writeUint8(0xfb);
      commitWrite(prepareWrite(8).setFloat64(offset, value), value);
    }

    function accountForFloat(value) {
      var f16 = checkFloat16(value);
      if (f16 !== false) {
        return 3;
      }
      var f32 = checkFloat32(value);
      if (f32 !== false) {
        return 5;
      }
      return 9;
    }

    function writeFloat(value) {
      var f16 = checkFloat16(value);
      if (f16 !== false) {
        writeUint8(0xf9);
        commitWrite(prepareWrite(2).setUint16(offset, f16), value);
        return;
      }
      var f32 = checkFloat32(value);
      if (f32 !== false) {
        writeUint8(0xfa);
        commitWrite(prepareWrite(4).setUint32(offset, f32), value);
        return;
      }
      //writeUint8(0xfb);
      writeFloat64(value);
    }

    function writeUint8(value) {
      commitWrite(prepareWrite(1).setUint8(offset, value), value);
    }

    function writeUint8Array(value) {
      prepareWrite(value.length);
      for (var i = 0; i < value.length; ++i)
        encodeView.setUint8(offset + i, value[i]);
      commitWrite(undefined, value);
    }

    function writeUint16(value) {
      commitWrite(prepareWrite(2).setUint16(offset, value), value);
    }

    function writeUint32(value) {
      commitWrite(prepareWrite(4).setUint32(offset, value), value);
    }

    function writeUint64(value) {
      var low = value % POW_2_32;
      var high = (value - low) / POW_2_32;
      //var encodeView = ensureSpace(8);
      encodeView.setUint32(offset, high);
      encodeView.setUint32(offset + 4, low);
      commitWrite(undefined, value);
    }

    function accountForTypeAndLength(type, length) {
      if (length < 24) {
        return 1;
      } else if (length < 0x100) {
        return 2;
      } else if (length < 0x10000) {
        return 3;
      } else if (length < 0x100000000) {
        return 5;
      } else {
        return 9;
      }
    }

    function writeTypeAndLength(type, length) {
      if (length < 24) {
        writeUint8(type << 5 | length);
      } else if (length < 0x100) {
        writeUint8(type << 5 | 0x18);
        writeUint8(length);
      } else if (length < 0x10000) {
        writeUint8(type << 5 | 0x19);
        writeUint16(length);
      } else if (length < 0x100000000) {
        writeUint8(type << 5 | 0x1A);
        writeUint32(length);
      } else {
        writeUint8(type << 5 | 0x1B);
        writeUint64(length);
      }
    }

    function getByteLengthOfUtf8String(value) {
      var c = 0;
      for (var i = 0; i < value.length; ++i) {
        var charCode = value.charCodeAt(i);
        if (charCode < 0x80) {
          c += 1;
        } else if (charCode < 0x800) {
          c += 2;
        } else if (charCode < 0xd800) {
          c += 3;
        } else {
          ++i;
          c += 4;
        }
      }
      return c;
    }

    function accountForUtf8String(value) {
      var c = getByteLengthOfUtf8String(value);
      return accountForTypeAndLength(3, c) + c;
    }

    function writeUtf8String(value) {
      var utf8len = getByteLengthOfUtf8String(value);
      //console.log("Writing string "+value+" at offset "+offset+" in "+utf8len+" bytes");
      //if (value.length > utf8len)
      //  throw new Error("Incorrect string length accounting: Can not write less bytes than characters.");
      //if (value.length < utf8len)
      //  console.log("Writing "+ value.length + " chars in "+ utf8len +" bytes\nString: "+ value);
      var utf8data = new Uint8Array(utf8len);
      var charIndex = 0;
      for (i = 0; i < value.length; ++i) {
        var charCode = value.charCodeAt(i);
        if (charCode < 0x80) {
          //console.log("Writing " + charCode.toString(16) + " in 1 byte");
          utf8data[charIndex++] = charCode;
        } else if (charCode < 0x800) {
          //console.log("Writing " + charCode.toString(16) + " in 2 bytes");
          utf8data[charIndex++] = (0xc0 | charCode >> 6);
          utf8data[charIndex++] = (0x80 | charCode & 0x3f);
        } else if (charCode < 0xd800) {
          //console.log("Writing " + charCode.toString(16) + " in 3 bytes");
          utf8data[charIndex++] = (0xe0 | charCode >> 12);
          utf8data[charIndex++] = (0x80 | (charCode >> 6) & 0x3f);
          utf8data[charIndex++] = (0x80 | charCode & 0x3f);
        } else {
          var charCode2 = value.charCodeAt(++i);
          //console.log("Writing " + charCode.toString(16) + " and "+charCode2.toString(16)+ " in 4 bytes");
          charCode = (charCode & 0x3ff) << 10;
          charCode |= charCode2 & 0x3ff;
          charCode += 0x10000;

          utf8data[charIndex++] = (0xf0 | charCode >> 18);
          utf8data[charIndex++] = (0x80 | (charCode >> 12) & 0x3f);
          utf8data[charIndex++] = (0x80 | (charCode >> 6) & 0x3f);
          utf8data[charIndex++] = (0x80 | charCode & 0x3f);
        }
      }
      //if (charIndex != utf8len)
      //  throw new Error("Incorrect string length accounting: " +
      //    charIndex + " vs " + utf8len + ", difference of " + (utf8len - charIndex));
      writeTypeAndLength(3, utf8len);
      return writeUint8Array(utf8data);
    }

    function accountForItem(value) {
      var i;
      var c = 0;
      if (value === false)
        return 1;
      if (value === true)
        return 1;
      if (value === null)
        return 1;
      if (value === undefined)
        return 1;

      switch (typeof value) {
        case "number":
          if (isNaN(value))
            return 3;
          if (Math.floor(value) === value) {
            if (0 <= value && value <= POW_2_53)
              return accountForTypeAndLength(0, value);
            if (-POW_2_53 <= value && value < 0)
              return accountForTypeAndLength(1, -(value + 1));
          }
          return accountForFloat(value);

        case "string":
          return accountForUtf8String(value);

        default:
          var length;
          if (Array.isArray(value)) {
            length = value.length;
            c += accountForTypeAndLength(4, length);
            for (i = 0; i < length; ++i)
              c += accountForItem(value[i]);
          } else if (value instanceof Uint8Array) {
            c += accountForTypeAndLength(2, value.length);
            c += value.length;
          } else {
            var keys = Object.keys(value);
            length = keys.length;
            c += accountForTypeAndLength(5, length);
            for (i = 0; i < length; ++i) {
              var key = keys[i];
              var firstChar = key.charCodeAt(0);
              var firstCharIsNum = firstChar >= 48 && firstChar <= 57;
              var numKey = firstCharIsNum && parseInt(key, 10);
              if (!isNaN(numKey) && key == numKey)
                key = numKey;
              c += accountForItem(key);
              c += accountForItem(value[key]);
            }
          }
      }

      return c;
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
              var key = keys[i];
              var firstChar = key.charCodeAt(0);
              var firstCharIsNum = firstChar >= 48 && firstChar <= 57;
              var numKey = firstCharIsNum && parseInt(key, 10);
              if (!isNaN(numKey) && key == numKey)
                key = numKey;
              encodeItem(key);
              encodeItem(value[key]);
            }
          }
      }
    }


    data = new ArrayBuffer(accountForItem(value));
    encodeView = new DataView(data);
    encodeItem(value);

    //console.log("Finished encoding...", data.byteLength);
    return data;
  }

  function decode(data, tagger, simpleValue, options) {
    if (!data)
      throw new Error("No data was passed to decode.");
    //console.log("Beginning decoding...", data.byteLength);
    if (data.byteLength === 0)
      return undefined;
    var decodeView = new DataView(data);
    var offset = 0;
    // support for over-sized buffers
    var allowRemainingBytes = options && options.allowRemainingBytes || false;

    if (typeof tagger !== "function")
      tagger = function (value) {
        return value;
      };
    if (typeof simpleValue !== "function")
      simpleValue = function () {
        return undefined;
      };

    function commitRead(length, value) {
      offset += length;
      //console.log("read", value);
      return value;
    }

    function readArrayBuffer(length) {
      return commitRead(length, new Uint8Array(data, offset, length));
    }


    function readFloat16() {
      /*
       var tempArrayBuffer = new ArrayBuffer(4);
       var tempDataView = new DataView(tempArrayBuffer);
       var value = readUint16();

       var sign = value & 0x8000;
       var exponent = value & 0x7c00;
       var fraction = value & 0x03ff;

       if (exponent === 0x7c00)
       exponent = 0xff << 10;
       else if (exponent !== 0)
       exponent += (127 - 15) << 10;
       else if (fraction !== 0)
       return fraction * POW_2_24;

       tempDataView.setUint32(0, sign << 16 | exponent << 13 | fraction << 13);
       return tempDataView.getFloat32(0);
       */
      return decodeFloat16(readUint16());
    }

    function readFloat32() {
      return commitRead(4, decodeView.getFloat32(offset));
    }

    function readFloat64() {
      return commitRead(8, decodeView.getFloat64(offset));
    }

    function readUint8() {
      return commitRead(1, decodeView.getUint8(offset));
    }

    function readUint16() {
      return commitRead(2, decodeView.getUint16(offset));
    }

    function readUint32() {
      return commitRead(4, decodeView.getUint32(offset));
    }

    function readUint64() {
      return readUint32() * POW_2_32 + readUint32();
    }

    function readBreak() {
      if (decodeView.getUint8(offset) !== 0xff)
        return false;
      offset += 1;
      return true;
    }

    function readLength(additionalInformation) {
      //console.log("reading length for ...", additionalInformation);
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

    function readStringLength(majorType) {
      var initialByte = readUint8();
      if (initialByte === 0xff)
        return -1;
      var length = readLength(initialByte & 0x1f);
      if (length < 0 || (initialByte >> 5) !== majorType)
        throw "Invalid indefinite length element";
      return length;
    }

    function appendUtf16Data(utf16data, length) {
      for (var i = 0; i < length; ++i) {
        var value = readUint8();
        var highBit = value & 0x80;
        if (highBit) {
          if (value < 0xe0) {
            value = (value & 0x1f) << 6
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
          utf16data.push(value);
        } else {
          value -= 0x10000;
          utf16data.push(0xd800 | (value >> 10));
          utf16data.push(0xdc00 | (value & 0x3ff));
        }
      }
    }

    function decodeItem() {
      //console.log("decoding item");

      var initialByte = readUint8();
      var majorType = initialByte >> 5;
      var additionalInformation = initialByte & 0x1f;
      var i;
      var length;

      if (majorType === 7) {
        //console.log("decoding float...", additionalInformation);
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
        case 0:
          //console.log("read uint " + length)
          return length;
        case 1:
          //console.log("read int " + length)
          return -1 - length;
        case 2:
          if (length < 0) {
            var elements = [];
            var fullArrayLength = 0;
            while ((length = readStringLength(majorType)) >= 0) {
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
          //console.log("decoding string at "+offset+" 0x"+ initialByte.toString(16));
          var utf16data = [];
          if (length < 0) {
            //console.log("indefinite length");
            while ((length = readStringLength(majorType)) >= 0) {
              //console.log("chunk of "+length+" bytes");
              appendUtf16Data(utf16data, length);
            }
          } else {
            //console.log("exactly "+length+" bytes");
            appendUtf16Data(utf16data, length);
          }
          var str = String.fromCharCode.apply(null, utf16data);
          //console.log("read string...", str);
          return str;
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
        default: {
          throw new Error('Unhandled identifier ' + initialByte
            + ' with major type code ' + majorType);
        }
      }
    }

    var ret = decodeItem();
    //console.log("First item is", ret);

    // In a keyless serialization, the recursion chain never happens and
    // stops parsing at the first element. This isn't meant to be a pretty
    // fix, but the least intrusive workaround without reworking everything.

    if (typeof ret !== "object" && offset !== data.byteLength) {
      var j = 0;
      var retP = {};
      retP[j++] = ret;

      //console.log("bytes remaining", data.byteLength - offset);
      while (offset !== data.byteLength)
        retP[j++] = decodeItem();

      return retP;
    }

    if (offset !== data.byteLength && !allowRemainingBytes)
      throw new Error((data.byteLength - offset) + " remaining bytes after end of encoding");
    //console.log("Decoded and returned", ret);
    return ret;
  }

  var obj = {encode: encode, decode: decode};

  if (typeof define === "function" && define.amd)
    define("cbor/cbor", obj);
  else if (!global.CBOR)
    global.CBOR = obj;

})(this);
