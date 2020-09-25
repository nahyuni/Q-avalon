var Utils = function() {
	var dup_flag = false;
	var logFlag = false;
	var CRC16_TABLE = [
		0x0000, 0x1021, 0x2042, 0x3063, 0x4084, 0x50a5, 0x60c6, 0x70e7,
		0x8108, 0x9129, 0xa14a, 0xb16b, 0xc18c, 0xd1ad, 0xe1ce, 0xf1ef,
		0x1231, 0x0210, 0x3273, 0x2252, 0x52b5, 0x4294, 0x72f7, 0x62d6,
		0x9339, 0x8318, 0xb37b, 0xa35a, 0xd3bd, 0xc39c, 0xf3ff, 0xe3de,
		0x2462, 0x3443, 0x0420, 0x1401, 0x64e6, 0x74c7, 0x44a4, 0x5485,
		0xa56a, 0xb54b, 0x8528, 0x9509, 0xe5ee, 0xf5cf, 0xc5ac, 0xd58d,
		0x3653, 0x2672, 0x1611, 0x0630, 0x76d7, 0x66f6, 0x5695, 0x46b4,
		0xb75b, 0xa77a, 0x9719, 0x8738, 0xf7df, 0xe7fe, 0xd79d, 0xc7bc,
		0x48c4, 0x58e5, 0x6886, 0x78a7, 0x0840, 0x1861, 0x2802, 0x3823,
		0xc9cc, 0xd9ed, 0xe98e, 0xf9af, 0x8948, 0x9969, 0xa90a, 0xb92b,
		0x5af5, 0x4ad4, 0x7ab7, 0x6a96, 0x1a71, 0x0a50, 0x3a33, 0x2a12,
		0xdbfd, 0xcbdc, 0xfbbf, 0xeb9e, 0x9b79, 0x8b58, 0xbb3b, 0xab1a,
		0x6ca6, 0x7c87, 0x4ce4, 0x5cc5, 0x2c22, 0x3c03, 0x0c60, 0x1c41,
		0xedae, 0xfd8f, 0xcdec, 0xddcd, 0xad2a, 0xbd0b, 0x8d68, 0x9d49,
		0x7e97, 0x6eb6, 0x5ed5, 0x4ef4, 0x3e13, 0x2e32, 0x1e51, 0x0e70,
		0xff9f, 0xefbe, 0xdfdd, 0xcffc, 0xbf1b, 0xaf3a, 0x9f59, 0x8f78,
		0x9188, 0x81a9, 0xb1ca, 0xa1eb, 0xd10c, 0xc12d, 0xf14e, 0xe16f,
		0x1080, 0x00a1, 0x30c2, 0x20e3, 0x5004, 0x4025, 0x7046, 0x6067,
		0x83b9, 0x9398, 0xa3fb, 0xb3da, 0xc33d, 0xd31c, 0xe37f, 0xf35e,
		0x02b1, 0x1290, 0x22f3, 0x32d2, 0x4235, 0x5214, 0x6277, 0x7256,
		0xb5ea, 0xa5cb, 0x95a8, 0x8589, 0xf56e, 0xe54f, 0xd52c, 0xc50d,
		0x34e2, 0x24c3, 0x14a0, 0x0481, 0x7466, 0x6447, 0x5424, 0x4405,
		0xa7db, 0xb7fa, 0x8799, 0x97b8, 0xe75f, 0xf77e, 0xc71d, 0xd73c,
		0x26d3, 0x36f2, 0x0691, 0x16b0, 0x6657, 0x7676, 0x4615, 0x5634,
		0xd94c, 0xc96d, 0xf90e, 0xe92f, 0x99c8, 0x89e9, 0xb98a, 0xa9ab,
		0x5844, 0x4865, 0x7806, 0x6827, 0x18c0, 0x08e1, 0x3882, 0x28a3,
		0xcb7d, 0xdb5c, 0xeb3f, 0xfb1e, 0x8bf9, 0x9bd8, 0xabbb, 0xbb9a,
		0x4a75, 0x5a54, 0x6a37, 0x7a16, 0x0af1, 0x1ad0, 0x2ab3, 0x3a92,
		0xfd2e, 0xed0f, 0xdd6c, 0xcd4d, 0xbdaa, 0xad8b, 0x9de8, 0x8dc9,
		0x7c26, 0x6c07, 0x5c64, 0x4c45, 0x3ca2, 0x2c83, 0x1ce0, 0x0cc1,
		0xef1f, 0xff3e, 0xcf5d, 0xdf7c, 0xaf9b, 0xbfba, 0x8fd9, 0x9ff8,
		0x6e17, 0x7e36, 0x4e55, 0x5e74, 0x2e93, 0x3eb2, 0x0ed1, 0x1ef0,
	];

	var SHA256_TABLE = [
		0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
		0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
		0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
		0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
		0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
		0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
		0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
		0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
		0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
		0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
		0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
		0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
		0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
		0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
		0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
		0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
	];

	var SHA256_INIT = [
		0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
		0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
	];

	var DIFFONE =
		0x00000000ffff0000000000000000000000000000000000000000000000000000;
	var BASE = [
		0x0000000100000000000000000000000000000000000000000000000000000000,
		0x0000000000000001000000000000000000000000000000000000000000000000,
		0x0000000000000000000000010000000000000000000000000000000000000000,
		0x0000000000000000000000000000000100000000000000000000000000000000,
		0x0000000000000000000000000000000000000001000000000000000000000000,
		0x0000000000000000000000000000000000000000000000010000000000000000,
		0x0000000000000000000000000000000000000000000000000000000100000000,
		0x0000000000000000000000000000000000000000000000000000000000000001,
	];

	var check_version = function(version) {
		return version.substr(0, 6) === '3U1504' ||
			version.substr(0, 6) === '4M1505';
	};

	var crc16 = function(buffer) {
		var data = new Uint8Array(buffer);
		var crc = 0;
		var i = 0;
		var len = data.byteLength;
		while (len-- > 0)
			crc = CRC16_TABLE[((crc >>> 8) ^ data[i++]) & 0xff] ^ (crc << 8);
		return crc & 0xffff;
	};

	var ab2hex = function(buffer) {
		var view = new Uint8Array(buffer);
		var str = '';
		for (var v of view)
			str += ('0' + v.toString(16)).slice(-2);
		return str;
	};

	var hex2ab = function(hex) {
		var len = hex.length / 2;
		var buffer = new ArrayBuffer(len);
		var view = new Uint8Array(buffer);
		for (var i = 0; i < len; i++)
			view[i] = parseInt(hex.substr(i * 2, 2), 16);
		return buffer;
	};

	var ab2asc = function(buffer) {
		return String.fromCharCode.apply(null, new Uint8Array(buffer));
	};

	var str2ab = function(str) {
		var len = str.length;
		var buffer = new ArrayBuffer(len);
		var view = new Uint8Array(buffer);
		for (var i = 0; i < len; i++)
			view[i] = str.charCodeAt(i);
		return buffer;
	};

	var genWork = function(job, nonce2, poolId, jqId, ntime) {
		var gen_buffer = new ArrayBuffer(64);
		var gen_view = new DataView(gen_buffer);
		var i;

		var buffer = new ArrayBuffer(76);
		var view = new DataView(buffer);
		view.setUint32(0, parseInt(job.version.substr(0, 8), 16));
		for (var i = 0; i < 8; i++) {
			view.setUint32(
				(i + 1) * 4,
				parseInt(job.prevhash[nonce2 % job.mercleRoot_len].substr(i * 8, 8), 16)
			);
			view.setUint32((i + 9) * 4, parseInt(job.merkleRoot[nonce2 % job.mercleRoot_len].substr(i * 8, 8), 16));
		}
		
		view.setUint32(17 * 4, ntime);
		view.setUint32(18 * 4, parseInt(job.nbits, 16));
		header = ab2hex(buffer);
		var midstat = calc_midstate(header.substr(0, 128));
		var data = header.substr(128, 24);
		// genWork - part 1
		for (i = 0; i < 32; i++)
			gen_view.setUint8(31 - i, parseInt(midstat.substr(i * 2, 2), 16));

		// genWork - part 2
		gen_view.setUint8(32, poolId);
		gen_view.setUint8(33, jqId);
		gen_view.setUint32(34, nonce2, false);
		for (i = 0; i < 12; i++)
			gen_view.setUint8(63 - i, parseInt(data.substr(i * 2, 2), 16));

		return gen_buffer;
	};
	
	var varifyWork = function(job, nonce2, ntime, nonce) {
		var buffer = new ArrayBuffer(80);
		var view = new DataView(buffer);
		view.setUint32(0, parseInt(job.version.substr(0, 8), 16));
		for (var i = 0; i < 8; i++) {
			view.setUint32(
				(i + 1) * 4,
				parseInt(job.prevhash[nonce2 % job.mercleRoot_len].substr(i * 8, 8), 16)
			);
			view.setUint32((i + 9) * 4, parseInt(job.merkleRoot[nonce2 % job.mercleRoot_len].substr(i * 8, 8), 16));
		}
		view.setUint32(17 * 4, ntime);
		view.setUint32(18 * 4, parseInt(job.nbits, 16));
		view.setUint32(19 * 4, nonce, true);
		var hash = regen_hash(ab2hex(buffer));
		result = {
			idx : nonce2,
			blockno : (nonce2 % job.mercleRoot_len) + 1,
			nonce : nonce,
			hash : hash_hex,
			ntime : ntime
		}
		return result;
	};

	var getTargetBits = function(nbits) {
		var exponent  = nbits.substr(0, 2);
		var coefficient = nbits.substr(2, 6);
		exponent = '0x'+exponent;
		coefficient = '0x'+coefficient;
		target = coefficient * 2**(8 * (exponent - 3));
		return padLeft(target.toString(16), 32);
	}

	var _calc_midstat = function(data) {
		var view = new DataView(hex2ab(data.substr(0, 128)));
		var input = [], output = [];
		for (var i = 0; i < 16; i++)
			input[i] = view.getUint32(i * 4, true);
		_sha256_core(input, output, false);

		var buffer = new ArrayBuffer(32);
		view = new DataView(buffer);
		for (i = 0; i < 8; i++)
			view.setUint32(i * 4, output[i], true);
		return ab2hex(buffer);
	};

	var _calc_merkle_root = function(coinbase, merkles) {
		var len = coinbase.length/2;
		var root = gen_hash(coinbase, len);
		var i = 0;
		for (var branch of merkles) {
			root = root + branch;
			root = gen_hash(root, 64);
		}
		root = hex2bigbinary(root);
		return root;
	};

	var _double_sha256 = function(input_str) {
		var input = [], output = [];
		input = _sha256(input_str);
		input[8] = 0x80000000;
		for (var i = 9; i < 15; i++)
			input[i] = 0;
		input[15] = 0x100;

		_sha256_core(input, output, false);
		return output;
	};

	var _sha256 = function(input_str) {
		var len = input_str.length;
		var pre = parseInt(len / 128);
		var i, j;
		var input = [], output = [];

		for (i = 0; i < pre; i++) {
			for (j = 0; j < 16; j++)
				input[j] = parseInt(input_str.substr(i * 128 + j * 8, 8), 16);
			_sha256_core(input, output, output);
		}
		input_str += '8000000000';
		for (j = 0; j <= parseInt((len + 2 - pre * 128) / 8); j++)
			input[j] = parseInt(input_str.substr(pre * 128 + j * 8, 8), 16);
		if (len - pre * 128 > 110) {
			for (; j < 16; j++)
				input[j] = 0;
			_sha256_core(input, output, output);
			j = 0;
		}
		for (; j < 15; j++)
			input[j] = 0;
		input[15] = len * 4;
		_sha256_core(input, output, output);
		return output;
	};

	var _sha256_core = function(input, output, init) {
		if (init === false || init === undefined || init.length === 0)
			init = SHA256_INIT;
		var w = [], v = [];
		var i, s0, s1, ma, ch;
		for (i = 0; i < 8; i++)
			v[i] = init[i];
		for (i = 0; i < 16; i++)
			w[i] = input[i];

		for (i = 0; i < 64; i++) {
			var k = SHA256_TABLE[i];
			s0 = _rotate_right(v[0], 2) ^ _rotate_right(v[0], 13) ^ _rotate_right(v[0], 22);
			s1 = _rotate_right(v[4], 6) ^ _rotate_right(v[4], 11) ^ _rotate_right(v[4], 25);
			ma = (v[0] & v[1]) ^ (v[0] & v[2]) ^ (v[1] & v[2]);
			ch = (v[4] & v[5]) ^ ((~v[4]) & v[6]);

			v[7] = (v[7] + w[0] + k + ch + s1) >>> 0;
			v[3] = (v[3] + v[7]) >>> 0;
			v[7] = (v[7] + ma + s0) >>> 0;

			v.unshift(v[7]);
			v.pop();

			if (i < 48) {
				s0 = _rotate_right(w[1], 7) ^ _rotate_right(w[1], 18) ^ (w[1] >>> 3);
				s1 = _rotate_right(w[14], 17) ^ _rotate_right(w[14], 19) ^ (w[14] >>> 10);

				w.push((w[0] + s0 + w[9] + s1) >>> 0);
			}
			w.shift();
		}

		for (i = 0; i < 8; i++)
			output[i] = (v[i] + init[i]) >>> 0;
	};

	var _rotate_right = function(i, p) {
		p &= 0x1f;
		return (i >>> p | (i << (32 - p))) >>> 0;
	};

	var _bswap32 = function(value) {
		return ((value >>> 24) | (value << 24) | ((value >>> 8) & 0xff00) | ((value << 8) & 0xff0000)) >>> 0;
	};

	var padLeft = function(str, len) {
		len = len || 4;
		len *= 2;
		while (str.length < len)
			str = "0" + str;
		return str;
	};

	var uint2lehex = function(integar, size) {
		var buffer = new ArrayBuffer(4);
		var view = new DataView(buffer);
		view.setUint32(0, integar, true);
		return ab2hex(buffer).substr(0, size * 2);
	};

	var arraySum = function(array) {
		return array.reduce(function(a, b) {return a + b;});
	};

	var getTarget = function(diff) {
		var buffer = new ArrayBuffer(32);
		var base, i, d, view;
		if (diff < 0xffff) {
			view = new DataView(buffer);
			base = 0xffff;
			for (i = 2; i < 16; i++) {
				view.setUint16(i * 2, Math.floor(base / diff));
				base = (base % diff) << 16;
			}
		} else {
			view = new Uint32Array(buffer);
			base = DIFFONE;
			base /= diff;
			for (i = 0; i < 8; i++) {
				d = Math.floor(base / BASE[i]);
				base -= d * BASE[i];
				view[i] = d;
			}
		}
		return buffer;
	};

	require('console-stamp')(console, { pattern: 'dd/mm/yyyy HH:MM:ss.l' });
	var log = function(level, args, header ) {
		if (!logFlag)
			return;
		var template = "[" + header + "] " + args.shift();
		args.unshift(template);
		switch (level) {
		case "error":
			console.error.apply(console, args);
			break;
		case "warn":
			console.warn.apply(console, args);
			break;
		case "info":
			console.info.apply(console, args);
			break;
		case "log":
			console.log.apply(console, args);
			break;
		case "debug":
			console.debug.apply(console, args);
			break;
		}
	};

	var enableLog = function() {
		logFlag = true;
	};
	var disableLog = function() {
		logFlag = false;
	};

	var hexToBytes = function(hex) {
		for (var bytes = [], c = 0; c < hex.length; c += 2)
		bytes.push(parseInt(hex.substr(c, 2), 16));
		return bytes;
	}

	function SHA256(s, length, is_midstat, is_regen) {
	var chrsz   = 8;
	var hexcase = 0;
  
	function safe_add (x, y){
		var lsw = (x & 0xFFFF) + (y & 0xFFFF);
		var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
		return (msw << 16) | (lsw & 0xFFFF);
	}
  
	function S (X, n) { return ( X >>> n ) | (X << (32 - n)); }
	function R (X, n) { return ( X >>> n ); }
	function Ch(x, y, z) { return ((x & y) ^ ((~x) & z)); }
	function Maj(x, y, z) { return ((x & y) ^ (x & z) ^ (y & z)); }
	function Sigma0256(x) { return (S(x, 2) ^ S(x, 13) ^ S(x, 22)); }
	function Sigma1256(x) { return (S(x, 6) ^ S(x, 11) ^ S(x, 25)); }
	function Gamma0256(x) { return (S(x, 7) ^ S(x, 18) ^ R(x, 3)); }
	function Gamma1256(x) { return (S(x, 17) ^ S(x, 19) ^ R(x, 10)); }
  
	function core_sha256 (m, l) {

		var K = new Array(0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1,
			0x923F82A4, 0xAB1C5ED5, 0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
			0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174, 0xE49B69C1, 0xEFBE4786,
			0xFC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
			0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147,
			0x6CA6351, 0x14292967, 0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
			0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85, 0xA2BFE8A1, 0xA81A664B,
			0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
			0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A,
			0x5B9CCA4F, 0x682E6FF3, 0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
			0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2);

		var HASH = new Array(0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19);

		var W = new Array(64);
		var a, b, c, d, e, f, g, h, i, j;
		var T1, T2;
		
		if(is_midstat == 1)
			l = 0;
		else
		{
			m[l >> 5] |= 0x80 << (24 - l % 32);
			m[((l + 64 >> 9) << 4) + 15] = l;
		}

		for ( var i = 0; i<m.length; i+=16 ) {
			a = HASH[0];
			b = HASH[1];
			c = HASH[2];
			d = HASH[3];
			e = HASH[4];
			f = HASH[5];
			g = HASH[6];
			h = HASH[7];
  
			for ( var j = 0; j<64; j++) {
				if (j < 16) W[j] = m[j + i];
				else W[j] = safe_add(safe_add(safe_add(Gamma1256(W[j - 2]), W[j - 7]), Gamma0256(W[j - 15])), W[j - 16]);
  
				T1 = safe_add(safe_add(safe_add(safe_add(h, Sigma1256(e)), Ch(e, f, g)), K[j]), W[j]);
				T2 = safe_add(Sigma0256(a), Maj(a, b, c));
  
				h = g;
				g = f;
				f = e;
				e = safe_add(d, T1);
				d = c;
				c = b;
				b = a;
				a = safe_add(T1, T2);
			}
  
			HASH[0] = safe_add(a, HASH[0]) >>> 0;
			HASH[1] = safe_add(b, HASH[1])>>> 0;
			HASH[2] = safe_add(c, HASH[2])>>> 0;
			HASH[3] = safe_add(d, HASH[3])>>> 0;
			HASH[4] = safe_add(e, HASH[4])>>> 0;
			HASH[5] = safe_add(f, HASH[5])>>> 0;
			HASH[6] = safe_add(g, HASH[6])>>> 0;
			HASH[7] = safe_add(h, HASH[7])>>> 0;
		}
		return HASH;
	}
  
	function str2binb (str) {
		var bin = Array();
		var mask = (1 << chrsz) - 1;
		for(var i = 0; i < str.length * chrsz; i += chrsz) {
			bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (24 - i%32);
			bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (24 - i%32);
		}
		return bin;
	}
  
	function Utf8Encode(string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";
		for (var n = 0; n < string.length; n++) {
			var c = string.charCodeAt(n);
			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
		}
		return utftext;
	}

	function binb2hex (binarray) {
		var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
		var str = "";
		for(var i = 0; i < binarray.length * 4; i++) {
			str += hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8+4)) & 0xF) +
			hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8  )) & 0xF);
		}
		return str;
	}
	if(is_regen)
		return core_sha256(s, length * chrsz);
	else
		return binb2hex(core_sha256(s, length * chrsz));
}

var hexcase = 0;
	function binb2hex (binarray) {
		var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
		var str = "";
		for(var i = 0; i < binarray.length * 4; i++) {
			str += hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8+4)) & 0xF) +
			hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8  )) & 0xF);
		}
		return str;
	}

function hex2littlebinary(str) {
	var result = new Array();
	for(var i = 0; i < str.length; i += 8) {
		var number = 0x00000000;
		for(var j = 0; j < 4; ++j) {
			number = safe_add(number, hex_to_byte(str.substring(i + j*2, i + j*2 + 2)) << (j*8));
		}
		result.push(number);
	}
	return result;
}

function hex2bigbinary(str) {
	var result = new Array();
	for(var i = 0; i < str.length; i += 8) {
		var number = 0x00000000;
		for(var j = 0, k = 3; j < 4; ++j, --k) {
			number = safe_add(number, hex_to_byte(str.substring(i + j*2, i + j*2 + 2)) << (k*8));
		}
		result.push(number);
	}
	return result;
}

function hex_to_byte(hex) {
	return(parseInt(hex, 16));
}

function safe_add (x, y) {
	var lsw = (x & 0xFFFF) + (y & 0xFFFF);
	var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
	return (msw << 16) | (lsw & 0xFFFF);
}
var gen_hash = function(input_str, len) {
	var hex1 = SHA256(hex2bigbinary(input_str), len);
	return SHA256(hex2bigbinary(hex1), 32);
}

var calc_midstate = function(input_str) {
	var hex1 = SHA256(hex2littlebinary(input_str), 64, 1);
	return binb2hex(hex2littlebinary(hex1));
}

var regen_hash = function(input_str) {
	var hex1 = SHA256(hex2littlebinary(input_str), 80);
	return SHA256(hex2bigbinary(hex1), 32, 0, 1);
}

	// public functions
	this.check_version = check_version;
	this.crc16 = crc16;
	this.ab2hex = ab2hex;
	this.hex2ab = hex2ab;
	this.ab2asc = ab2asc;
	this.str2ab = str2ab;
	this.genWork = genWork;
	this.varifyWork = varifyWork;
	this.padLeft = padLeft;
	this.uint2lehex = uint2lehex;
	this.arraySum = arraySum;
	this.getTarget = getTarget;
	this.log = log;
	this.enableLog = enableLog;
	this.disableLog = disableLog;
	this.hexToBytes = hexToBytes;
	this.gen_hash = gen_hash;
	this.calc_midstate = calc_midstate;
	this.regen_hash = regen_hash;
};

var utils = new Utils();
module.exports = utils;