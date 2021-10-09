/* Or use this example tcp client written in node.js.  (Originated with 
   example code from 
   http://www.hacksparrow.com/tcp-socket-programming-in-node-js.html.) */
const morse = require("morse-decoder");
const net = require("net");
const base32 = require("hi-base32");

const client = new net.Socket();
client.connect(52017, "challenge01.root-me.org", function () {
  console.log("Connected");
});

client.on("data", function (data) {
  console.log("Received: " + data);
  const regex = /'(.*)'/g;
  const encoded = regex.exec(data)[1];
  const is_morse = /^[\.\-\/]+$/;
  const is_hex = /^[0-9a-f]+$/;
  console.log("Encoded: " + encoded);
  if (encoded.match(is_morse)) {
    const response = morse.decode(encoded.replace(/\//g, " "));
    console.log("(Morse) Decoded: " + response);
    client.write(response.toLowerCase() + "\n");
  } else if (encoded.match(is_hex)) {
    const response = new Buffer.from(encoded.toString("utf8"), "hex").toString(
      "ascii"
    );
    console.log("(Hex) Decoded: " + response);
    client.write(response.toLowerCase() + "\n");
  } else {
    try {
      const response = base32.decode(encoded);
      console.log("(Base32) Decoded: " + response);
      client.write(response.toLowerCase() + "\n");
    } catch (err) {
      try {
        const response = new Buffer.from(
          fromBase85(encoded, ["0-9A-Za-z!#$%&()*+\\-;<=>?@^_`{|}~"])
        ).toString("ascii");
        if (!response.match("^[a-z]+$")) {
          throw "no base 85";
        }
        console.log("(Base85) Decoded: " + response);
        client.write(response.toLowerCase() + "\n");
      } catch (err) {
        console.error(err);
        const response = new Buffer.from(
          encoded.toString("utf8"),
          "base64"
        ).toString("ascii");
        console.log("(Base64) Decoded: " + response);
        client.write(response.toLowerCase() + "\n");
      }
    }
  }
});

client.on("close", function () {
  console.log("Connection closed");
});

function fromBase85(input, args) {
  const alphabet = expandAlphRange(args[0]).join(""),
    encoding = alphabetName(alphabet),
    result = [];

  if (alphabet.length !== 85 || new Set(alphabet).size !== 85) {
    console.error("Alphabet must be of length 85");
    return;
  }

  if (input.length === 0) return [];

  const matches = input.match(/<~(.+?)~>/);
  if (matches !== null) input = matches[1];

  let i = 0;
  let block, blockBytes;
  while (i < input.length) {
    if (encoding === "Standard" && input[i] === "z") {
      result.push(0, 0, 0, 0);
      i++;
    } else {
      let digits = [];
      digits = input
        .substr(i, 5)
        .split("")
        .map((chr, idx) => {
          const digit = alphabet.indexOf(chr);
          if (digit < 0 || digit > 84) {
            throw `Invalid character '${chr}' at index ${idx}`;
          }
          return digit;
        });

      block =
        digits[0] * 52200625 +
        digits[1] * 614125 +
        (i + 2 < input.length ? digits[2] : 84) * 7225 +
        (i + 3 < input.length ? digits[3] : 84) * 85 +
        (i + 4 < input.length ? digits[4] : 84);

      blockBytes = [
        (block >> 24) & 0xff,
        (block >> 16) & 0xff,
        (block >> 8) & 0xff,
        block & 0xff,
      ];

      if (input.length < i + 5) {
        blockBytes.splice(input.length - (i + 5), 5);
      }

      result.push.apply(result, blockBytes);
      i += 5;
    }
  }

  return result;
}

/**
 * Base85 resources.
 *
 * @author PenguinGeorge [george@penguingeorge.com]
 * @copyright Crown Copyright 2018
 * @license Apache-2.0
 */

/**
 * Base85 alphabet options.
 */
const ALPHABET_OPTIONS = [
  {
    name: "Standard",
    value: "!-u",
  },
  {
    name: "Z85 (ZeroMQ)",
    value: "0-9a-zA-Z.\\-:+=^!/*?&<>()[]{}@%$#",
  },
  {
    name: "IPv6",
    value: "0-9A-Za-z!#$%&()*+\\-;<=>?@^_`{|}~",
  },
];

/**
 * Returns the name of the alphabet, when given the alphabet.
 *
 * @param {string} alphabet
 * @returns {string}
 */
function alphabetName(alphabet) {
  alphabet = alphabet.replace(/'/g, "&apos;");
  alphabet = alphabet.replace(/"/g, "&quot;");
  alphabet = alphabet.replace(/\\/g, "&bsol;");
  let name;

  ALPHABET_OPTIONS.forEach(function (a) {
    if (escape(alphabet) === escape(a.value)) name = a.name;
  });

  return name;
}

function chr(o) {
  // Detect astral symbols
  // Thanks to @mathiasbynens for this solution
  // https://mathiasbynens.be/notes/javascript-unicode
  if (o > 0xffff) {
    o -= 0x10000;
    const high = String.fromCharCode(((o >>> 10) & 0x3ff) | 0xd800);
    o = 0xdc00 | (o & 0x3ff);
    return high + String.fromCharCode(o);
  }

  return String.fromCharCode(o);
}

function ord(c) {
  // Detect astral symbols
  // Thanks to @mathiasbynens for this solution
  // https://mathiasbynens.be/notes/javascript-unicode
  if (c.length === 2) {
    const high = c.charCodeAt(0);
    const low = c.charCodeAt(1);
    if (high >= 0xd800 && high < 0xdc00 && low >= 0xdc00 && low < 0xe000) {
      return (high - 0xd800) * 0x400 + low - 0xdc00 + 0x10000;
    }
  }

  return c.charCodeAt(0);
}

function expandAlphRange(alphStr) {
  const alphArr = [];

  for (let i = 0; i < alphStr.length; i++) {
    if (
      i < alphStr.length - 2 &&
      alphStr[i + 1] === "-" &&
      alphStr[i] !== "\\"
    ) {
      const start = ord(alphStr[i]),
        end = ord(alphStr[i + 2]);

      for (let j = start; j <= end; j++) {
        alphArr.push(chr(j));
      }
      i += 2;
    } else if (
      i < alphStr.length - 2 &&
      alphStr[i] === "\\" &&
      alphStr[i + 1] === "-"
    ) {
      alphArr.push("-");
      i++;
    } else {
      alphArr.push(alphStr[i]);
    }
  }
  return alphArr;
}
