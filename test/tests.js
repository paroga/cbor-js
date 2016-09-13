var testcases = function (undefined) {
  function generateArrayBuffer(data) {
    var ret = new ArrayBuffer(data.length);
    var uintArray = new Uint8Array(ret);
    for (var i = 0; i < data.length; ++i) {
      uintArray[i] = data[i];
    }
    return new Uint8Array(data);
  }

  return [
    [
      "PositiveIntegerFix 0",
      "00",
      0
    ], [
      "PositiveIntegerFix 1",
      "01",
      1
    ], [
      "PositiveIntegerFix 10",
      "0a",
      10
    ], [
      "PositiveIntegerFix 23",
      "17",
      23
    ], [
      "PositiveIntegerFix 24",
      "1818",
      24
    ], [
      "PositiveInteger8 25",
      "1819",
      25
    ], [
      "PositiveInteger8 100",
      "1864",
      100
    ], [
      "PositiveInteger16 1000",
      "1903e8",
      1000
    ], [
      "PositiveInteger32 1000000",
      "1a000f4240",
      1000000
    ], [
      "PositiveInteger64 1000000000000",
      "1b000000e8d4a51000",
      1000000000000
    ], [
      "PositiveInteger64 9007199254740991",
      "1b001fffffffffffff",
      9007199254740991
    ], [
      "PositiveInteger64 9007199254740992",
      "1b0020000000000000",
      9007199254740992
    ], [
      "PositiveInteger64 18446744073709551615",
      "1bffffffffffffffff",
      18446744073709551615,
      true
    ], [
      "NegativeIntegerFix -1",
      "20",
      -1
    ], [
      "NegativeIntegerFix -10",
      "29",
      -10
    ], [
      "NegativeIntegerFix -24",
      "37",
      -24
    ], [
      "NegativeInteger8 -25",
      "3818",
      -25
    ], [
      "NegativeInteger8 -26",
      "3819",
      -26
    ], [
      "NegativeInteger8 -100",
      "3863",
      -100
    ], [
      "NegativeInteger16 -1000",
      "3903e7",
      -1000
    ], [
      "NegativeInteger32 -1000000",
      "3a000f423f",
      -1000000
    ], [
      "NegativeInteger64 -1000000000000",
      "3b000000e8d4a50fff",
      -1000000000000
    ], [
      "NegativeInteger64 -9007199254740992",
      "3b001fffffffffffff",
      -9007199254740992
    ], [
      "NegativeInteger64 -18446744073709551616",
      "3bffffffffffffffff",
      -18446744073709551616,
      true
    ], [
      "ByteString []",
      "40",
      generateArrayBuffer([])
    ], [
      "Bytestring [1,2,3,4]",
      "4401020304",
      generateArrayBuffer([1, 2, 3, 4])
    ], [
      "Bytestring [1,2,3,4,5]",
      "5f42010243030405ff",
      generateArrayBuffer([1, 2, 3, 4, 5]),
      true
    ], [
      "String ''",
      "60",
      ""
    ], [
      "String 'a'",
      "6161",
      "a"
    ], [
      "String 'IETF'",
      "6449455446",
      "IETF"
    ], [
      "String '\"\\'",
      "62225c",
      "\"\\"
    ], [
      "String '\u00fc' (U+00FC)",
      "62c3bc",
      "\u00fc"
    ], [
      "String '\u6c34' (U+6C34)",
      "63e6b0b4",
      "\u6c34"
    ], [
      "String '\ud800\udd51' (U+10151)",
      "64f0908591",
      "\ud800\udd51"
    ], [
      "String 'streaming'",
      "7f657374726561646d696e67ff",
      "streaming",
      true
    ], [
      "Array []",
      "80",
      []
    ], [
      "Array ['a', {'b': 'c'}]",
      "826161a161626163",
      ["a", {"b": "c"}]
    ], [
      "Array ['a, {_ 'b': 'c'}]",
      "826161bf61626163ff",
      ["a", {"b": "c"}],
      true
    ], [
      "Array [1,2,3]",
      "83010203",
      [1, 2, 3]
    ], [
      "Array [1, [2, 3], [4, 5]]",
      "8301820203820405",
      [1, [2, 3], [4, 5]]
    ], [
      "Array [1, [2, 3], [_ 4, 5]]",
      "83018202039f0405ff",
      [1, [2, 3], [4, 5]],
      true
    ], [
      "Array [1, [_ 2, 3], [4, 5]]",
      "83019f0203ff820405",
      [1, [2, 3], [4, 5]],
      true
    ], [
      "Array [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]",
      "98190102030405060708090a0b0c0d0e0f101112131415161718181819",
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]
    ], [
      "Array [_ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]",
      "9f0102030405060708090a0b0c0d0e0f101112131415161718181819ff",
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
      true
    ], [
      "Array [_ 1, [2, 3], [4, 5]]",
      "9f01820203820405ff",
      [1, [2, 3], [4, 5]],
      true
    ], [
      "Array [_ 1, [2, 3], [_ 4, 5]]",
      "9f018202039f0405ffff",
      [1, [2, 3], [4, 5]],
      true
    ], [
      "Array [_ ]",
      "9fff",
      [],
      true
    ], [
      "Object {}",
      "a0",
      {}
    ], [
      "Object {1: 2, 3: 4}",
      "a201020304",
      {1: 2, 3: 4},
      true
    ], [
      "Object {'a': 1, 'b': [2, 3]}",
      "a26161016162820203",
      {"a": 1, "b": [2, 3]},
      true
    ], [
      "Object {'a': 'A', 'b': 'B', 'c': 'C', 'd': 'D', 'e': 'E'}",
      "a56161614161626142616361436164614461656145",
      {"a": "A", "b": "B", "c": "C", "d": "D", "e": "E"},
      true
    ], [
      "Object {_ 'a': 1, 'b': [_ 2, 3]}",
      "bf61610161629f0203ffff",
      {"a": 1, "b": [2, 3]},
      true
    ], [
      "Object {_ 'Fun': true, 'Amt': -2}",
      "bf6346756ef563416d7421ff",
      {"Fun": true, "Amt": -2},
      true
    ], [
      "Tag Self-describe CBOR 0",
      "d9d9f700",
      0,
      true
    ], [
      "false",
      "f4",
      false
    ], [
      "true",
      "f5",
      true
    ], [
      "null",
      "f6",
      null
    ], [
      "undefined",
      "f7",
      undefined
    ], [
      "UnassignedSimpleValue 255",
      "f8ff",
      undefined,
      true
    ], [
      "Float16 0.0",
      "f90000",
      0.0,
      true
    ], [
      "Float16 -0.0",
      "f98000",
      -0.0,
      true
    ], [
      "Float16 1.0",
      "f93c00",
      1.0,
      true
    ], [
      "Float16 1.5",
      "f93e00",
      1.5,
      false
    ], [
      "Float16 65504.0",
      "f97bff",
      65504.0,
      true
    ], [
      "Float16 5.960464477539063e-8",
      "f90001",
      5.960464477539063e-8,
      false
    ], [
      "Float16 0.00006103515625",
      "f90400",
      0.00006103515625,
      false
    ], [
      "Float16 -4.0",
      "f9c400",
      -4.0,
      true
    ], [
      "Float16 +Infinity",
      "f97c00",
      Infinity,
      true
    ], [
      "Float16 NaN",
      "f97e00",
      NaN,
      true
    ], [
      "Float16 -Infinity",
      "f9fc00",
      -Infinity,
      true
    ], [
      "Float32 100000.0",
      "fa47c35000",
      100000.0,
      true
    ], [
      "Float32 3.4028234663852886e+38",
      "fa7f7fffff",
      3.4028234663852886e+38,
      true
    ], [
      "Float32 +Infinity",
      "fa7f800000",
      Infinity,
      true
    ], [
      "Float32 NaN",
      "fa7fc00000",
      NaN,
      true
    ], [
      "Float32 -Infinity",
      "faff800000",
      -Infinity,
      true
    ], [
      "Float64 1.1",
      "fb3ff199999999999a",
      1.1
    ], [
      "Float64 9007199254740994",
      "fb4340000000000001",
      9007199254740994
    ], [
      "Float64 1.0e+300",
      "fb7e37e43c8800759c",
      1.0e+300
    ], [
      "Float64 -4.1",
      "fbc010666666666666",
      -4.1
    ], [
      "Float64 -9007199254740994",
      "fbc340000000000001",
      -9007199254740994
    ], [
      "Float64 +Infinity",
      "fb7ff0000000000000",
      Infinity,
      true
    ], [
      "Float64 NaN",
      "fb7ff8000000000000",
      NaN,
      true
    ], [
      "Float64 -Infinity",
      "fbfff0000000000000",
      -Infinity,
      true
    ]];
}();

function myDeepEqual(actual, expected, text) {
  if (actual instanceof Uint8Array && expected instanceof Uint8Array) {
    var bufferMatch = actual.length === expected.length;
    for (var i = 0; i < actual.length; ++i) {
      bufferMatch = bufferMatch && actual[i] === expected[i];
    }
    if (bufferMatch)
      return ok(true, text);
  }

  return deepEqual(actual, expected, text);
}

function hexToArrayBuffer(data) {
  var length = data.length / 2;
  var ret = new Uint8Array(length);
  for (var i = 0; i < length; ++i) {
    ret[i] = parseInt(data.substr(i * 2, 2), 16);
  }
  return ret.buffer;
}
function arrayBufferToHex(encoded) {
  var hex = "";
  var uint8Array = new Uint8Array(encoded);
  for (var i = 0; i < uint8Array.length; ++i) {
    var byte = uint8Array[i];
    hex += (byte >> 4).toString(16);
    hex += (byte & 0xf).toString(16);
  }
  return hex;
}

for (var i = 0; i < testcases.length; ++i) {
  try {
    //noinspection ExceptionCaughtLocallyJS
    throw testcases[i];
  }
  catch (testcase) {
    //var testcase = testcases[i];
    test(testcase[0], function () {
      var name = testcase[0];
      var data = testcase[1];
      var expected = testcase[2];
      var binaryDifference = testcase[3];
      //console.log("Test ", name);
      var decoded, encoded, decodedEncoded;
      try {
        //console.log("Decoding data... "+data);
        decoded = CBOR.decode(hexToArrayBuffer(data));
      } catch (err) {
        console.error("Error on test: " + name);
        console.error("Expected: " + data);
        console.error("Resulted: " + hex);
        console.error("While decoding data...\n" + err.stack);
        throw err;
      }
      myDeepEqual(decoded, expected, "Decoding");
      //console.log("decoded data was as expected");
      try {
        //console.log("Encoding data...");
        encoded = CBOR.encode(expected);
      } catch (err) {
        console.error("Error on test: " + name);
        console.error("Expected: " + data);
        console.error("Resulted: " + hex);
        console.error("While encoding data...\n" + err.stack);
        throw err;
      }
      var hex = arrayBufferToHex(encoded);
      if (!binaryDifference) {
        equal(hex, data, "Encoding difference (byteMatch)");
        //console.log("encoded data was as expected "+hex);
      } else {
        //console.log("encoded data was "+hex);
      }
      try {
        //console.log("Decoding the encoded data...");
        decodedEncoded = CBOR.decode(encoded);
      } catch (err) {
        console.error("Error on test: " + name);
        console.error("Expected: " + data);
        console.error("Resulted: " + hex);
        console.error("While decoding the encoded data...\n" + err.stack);
        throw err;
      }
      myDeepEqual(decodedEncoded, expected, "Encoding (deepEqual)");
    });
  }
}

test("Big Array", function () {
  var value = new Array(0x10001);
  for (var i = 0; i < value.length; ++i)
    value[i] = i;
  deepEqual(CBOR.decode(CBOR.encode(value)), value, 'deepEqual');
});

test("Remaining Bytes Throws", function () {
  var threw = false;
  try {
    var arrayBuffer = new Uint8Array([0, 26, 0, 18]).buffer;
    CBOR.decode(arrayBuffer);
  } catch (e) {
    threw = e;
  }

  ok(threw, "Thrown exception");
});

test("Remaining Bytes Throws When Not Opted", function () {
  var threw = false;
  try {
    var arrayBuffer = new Uint8Array([0xa1, 0x61, 0x61, 0x01, 0x00, 0x00, 0x00, 0x00]).buffer;
    CBOR.decode(arrayBuffer);
  } catch (e) {
    threw = e;
  }

  ok(threw, "Thrown exception");
});

test("Remaining Bytes Does Not Throw When Opted", function () {
  var threw = false;
  try {
    var arrayBuffer = new Uint8Array([0xa1, 0x61, 0x61, 0x01, 0x00, 0x00, 0x00, 0x00]).buffer;
    var result = CBOR.decode(arrayBuffer,null,null,{allowRemainingBytes:true});
    myDeepEqual(result, {a:1}, "Result is clean")
  } catch (e) {
    threw = e;
  }

  notOk(threw, "Thrown exception");

  CBOR.decode(new Uint8Array([0, 0]).buffer,null,null,{allowRemainingBytes:true});
});

test("No Remaining Bytes 1", function () {
  var threw = false;
  var expected = {
    "cookie": {
      "path": "/",
      "_expires": null,
      "originalMaxAge": null,
      "httpOnly": true,
      "secure": true,
      "sameSite": true
    },
    "passport": {
      "user": "ya29.Ci9bA7ax9WxhPwJcLPLSKEx6Q5kjgUr0huhR1MAVG-8ivzjVXpKwGc94tb-8bDOW3g"
    },
    "__lastAccess": 1473628668402
  };

  var decoded = false;

  var arrayBuffer = hexToArrayBuffer(
    'a366636f6f6b6965a66470617468612f685f65787069726573f66e6f72696769' +
    '6e616c4d6178416765f668687474704f6e6c79f566736563757265f56873616d' +
    '6553697465f56870617373706f7274a164757365727847796132392e43693962' +
    '413761783957786850774a634c504c534b45783651356b6a6755723068756852' +
    '314d4156472d3869767a6a5658704b774763393474622d3862444f5733676c5f' +
    '5f6c6173744163636573731b000001571b1d01f2');

  decoded = CBOR.decode(arrayBuffer);

  deepEqual(decoded, expected, "Got expected result");
});

test("Invalid length encoding", function () {
  var threw = false;
  try {
    CBOR.decode(hexToArrayBuffer("1e"))
  } catch (e) {
    threw = e;
  }

  ok(threw, "Thrown exception");
});

test("Invalid length", function () {
  var threw = false;
  try {
    CBOR.decode(hexToArrayBuffer("1f"))
  } catch (e) {
    threw = e;
  }

  ok(threw, "Thrown exception");
});

test("Invalid indefinite length element type", function () {
  var threw = false;
  try {
    CBOR.decode(hexToArrayBuffer("5f00"))
  } catch (e) {
    threw = e;
  }

  ok(threw, "Thrown exception");
});

test("Invalid indefinite length element length", function () {
  var threw = false;
  try {
    CBOR.decode(hexToArrayBuffer("5f5f"))
  } catch (e) {
    threw = e;
  }

  ok(threw, "Thrown exception");
});

test("Tagging", function () {
  function TaggedValue(value, tag) {
    this.value = value;
    this.tag = tag;
  }

  function SimpleValue(value) {
    this.value = value;
  }

  var arrayBuffer = hexToArrayBuffer("83d81203d9456708f8f0");
  var decoded = CBOR.decode(arrayBuffer, function (value, tag) {
    return new TaggedValue(value, tag);
  }, function (value) {
    return new SimpleValue(value);
  });

  ok(decoded[0] instanceof TaggedValue, "first item is a TaggedValue");
  equal(decoded[0].value, 3, "first item value");
  equal(decoded[0].tag, 0x12, "first item tag");
  ok(decoded[1] instanceof TaggedValue, "second item is a TaggedValue");
  equal(decoded[1].value, 8, "second item value");
  equal(decoded[1].tag, 0x4567, "second item tag");
  ok(decoded[2] instanceof SimpleValue, "third item is a SimpleValue");
  equal(decoded[2].value, 0xf0, "third item tag");
});

test("Encode Integer Keys as Integers", function() {
  var good = 'a10a00';
  var bad = 'a162313000';
  var encoded = CBOR.encode({ 10: 0 });
  var hex = arrayBufferToHex(encoded);
  notEqual(hex, bad, "Encode integer string key not as string");
  equal(hex, good, "Encode integer string key as int");
});

test("Throw when decoding nothing", function() {
  var exc = false;
  try {
    CBOR.decode();
  } catch ( err ) {
    exc = true;
  }
  ok(exc, "Should throw when decoding nothing");
});
test("Should return undefined when passed empty buffer", function() {
  var decoded = CBOR.decode(new ArrayBuffer(0));
  equal(decoded, undefined, "decode empty as undefined");
});

test("Should throw when decoding nothing", function() {
  var exc = false;
  try {
    CBOR.decode();
  } catch ( err ) {
    exc = true;
  }
  ok(exc, "Should throw when decoding nothing");
});
test("Should return undefined when passed empty buffer", function() {
  var decoded = CBOR.decode(new ArrayBuffer(0));
  equal(decoded, undefined, "decode empty as undefined");
});

test("Should encode would-be denormals some form correctly, not as denormals", function() {
  var encoded, decoded;
  encoded = CBOR.encode(1e-309);
  ok(encoded, "encoding must produce result");
  decoded = CBOR.decode(encoded);
  equal(decoded, 1e-309, "decoded as expected");

  encoded = CBOR.encode(-1e-309);
  ok(encoded, "encoding must produce result");
  decoded = CBOR.decode(encoded);
  equal(decoded, -1e-309, "decoded as expected");

  encoded = CBOR.encode(1e+309);
  ok(encoded, "encoding must produce result");
  decoded = CBOR.decode(encoded);
  equal(decoded, 1e+309, "decoded as expected");

  encoded = CBOR.encode(65504.00000000001);
  ok(encoded, "encoding must produce result");
  decoded = CBOR.decode(encoded);
  equal(decoded, 65504.00000000001, "decoded as expected");

  encoded = CBOR.encode(-65504.00000000001);
  ok(encoded, "encoding must produce result");
  decoded = CBOR.decode(encoded);
  equal(decoded, -65504.00000000001, "decoded as expected");

});

test("Should throw when decoding invalid codes", function() {
  var exc = false;
  try {
    CBOR.decode(hexToArrayBuffer('fc'));
  } catch ( err ) {
    exc = true;
  }
  ok(exc, "Should throw when decoding invalid codes");
});
/* no facility for testing; phantomjs does not have TextEncoder/TextDecoder/StringEncoder/StringDecoder
test("Cover Native Branches", function () {
  var threw = false;
  var expected = {
    "cookie": {
      "path": "/",
      "_expires": null,
      "originalMaxAge": null,
      "httpOnly": true,
      "secure": true,
      "sameSite": true
    },
    "passport": {
      "user": "ya29.Ci9bA7ax9WxhPwJcLPLSKEx6Q5kjgUr0huhR1MAVG-8ivzjVXpKwGc94tb-8bDOW3g"
    },
    "__lastAccess": 1473628668402
  };

  var decoded = false;

  var arrayBuffer = hexToArrayBuffer(
    'a366636f6f6b6965a66470617468612f685f65787069726573f66e6f72696769' +
    '6e616c4d6178416765f668687474704f6e6c79f566736563757265f56873616d' +
    '6553697465f56870617373706f7274a164757365727847796132392e43693962' +
    '413761783957786850774a634c504c534b45783651356b6a6755723068756852' +
    '314d4156472d3869767a6a5658704b774763393474622d3862444f5733676c5f' +
    '5f6c6173744163636573731b000001571b1d01f2');

  CBOR.options.useJsFallbackUtf8 = true;
  CBOR.options.useJsFallbackCodePt = false;
  try {
    decoded = CBOR.decode(arrayBuffer);
  } catch ( err ) {
    // ...
  }

  CBOR.options.useJsFallbackUtf8 = false;
  try {
    decoded = CBOR.decode(arrayBuffer);
  } catch ( err ) {
    // ...
  }
  CBOR.options.useJsFallbackUtf8 = true;
  CBOR.options.useJsFallbackCodePt = true;

  expect(0);
});
*/

