var os = require('os');
var utils = require('./utils.js');
var hid = require("node-hid");

var Q10 = function(device, workQueue, voltSet, freqSet) {
	var dev_con; 
	var deviceType;
	var header;
	switch (device.productId) {
	case Q10.Q10_ID:
		deviceType = "Q10";
		header = "Q10" + device.deviceId;
		break;
	}
	header = "Q10";
	var version = null;
	var asicCount = 1;
	var dna = null;

	var phase = null;
	var pass = false;
	var enable = false;

	voltSet = voltSet || 6500;
	freqSet = freqSet || [100, 100, 100];

	var SET_VOLT_PKG = Q10.pkgEncode(Q10.P_SET_VOLT, 0, 1, 1, Q10.voltEncode(voltSet));
	var SET_FREQ_PKG0 = Q10.pkgEncode(Q10.P_SET_FREQ, 0, 1, 1, Q10.freqEncode([100, 100, 100]));
	var SET_FREQ_PKG = Q10.pkgEncode(Q10.P_SET_FREQ, 0, 1, 1,	Q10.freqEncode(freqSet));

	var onDetect = new MinerEvent();
	var onNonce = new MinerEvent();
	var onStatus = new MinerEvent();

	var send = function(pkg) {
		dev_con.write(utils.hexToBytes(utils.ab2hex(pkg)));
	};

	var myListener = function(pkg) {
		utils.log("log", ["Recv:     0x%s", utils.ab2hex(pkg)], header);
		decode(pkg);
	};

	var stat = {};
	var initNonceL = [];
	var decode = function(pkg) {
		arraybuf_pkg = new Uint8Array(pkg).buffer;
		var view = new DataView(arraybuf_pkg);

		var head1 = view.getUint8(0);
		var head2 = view.getUint8(1);
		if (head1 !== Q10.CANAAN_HEAD1 ||
			head2 !== Q10.CANAAN_HEAD2) {
				utils.log("warn", ["Wrong Package Header."], header);
				return false;
		}
		var type = view.getUint8(2);

		var data = arraybuf_pkg.slice(6, 38);
		utils.log("warn", ["data"], utils.ab2hex(data));
		var crc = view.getUint16(38, false);
		if (crc !== utils.crc16(data)) {
			utils.log("warn", ["Wrong Package CRC."], header);
			return false;
		}

		var dataView = new DataView(data);
		switch (type) {
		case Q10.P_ACKDETECT:
			info = {
				dna: utils.ab2hex(data.slice(0, 16)),
				version: utils.ab2hex(data.slice(16, 31)),
			};
			dna = info.dna;
			pass = true;
			onDetect.fire(info);
			break;

		case Q10.P_NONCE:
			for (var i = 0; i < 2; i++) {
				if (dataView.getUint8(i * 16 + 6) === 0xff)
					continue;
				info = {
					deviceId: device.deviceId,
					org_nonce: dataView.getUint32(i * 16 + 8),
					nonce: dataView.getUint32(i * 16 + 8) - 0x4000,
					nonce2: dataView.getUint32(i * 16 + 2),
					blockno: (dataView.getUint32(i * 16 + 2) % job.mercleRoot_len) + 1 ,
					jqId: dataView.getUint8(i * 16 + 1),
					poolId: dataView.getUint8(i * 16 + 0),
					ntime: dataView.getUint8(i * 16 + 7),
				};
				utils.log("log", ["info:", info],	header);
				onNonce.fire(info);
			}
			break;
		case Q10.P_STATUS:
			info = {
						spiSpeed: dataView.getUint32(0),
						led: utils.padLeft((dataView.getUint32(4) >>> 0).toString(16)),
						voltage: Q10.voltDecode(dataView.getUint32(12)),
						voltageSource: Q10.voltSourceDecode(dataView.getUint32(16)),
						temperatureCu: Q10.temperatureDecode(dataView.getUint32(20)),
						temperatureFan: Q10.temperatureDecode(dataView.getUint32(24)),
						power: dataView.getUint32(28),
			};
			if (phase === "poll")
				phase = (info.power === 1) ? "push" : "init";
			if(info.power == 0)
			{
				console.log("info.power" + info.power);
				process.exit();
			}
			var args =["Status:   "];
			for (key in info) {
				stat[key] = info[key];
				args[0] += key + " %s, ";
				args.push(info[key]);
			}
			info.deviceId = device.deviceId;
			onStatus.fire(info);
			break;
		}
	};

	var pollPhase = function() {
		(function loop() {
			if (!enable)
				return;
			switch(phase) {
			case "poll":
				send(Q10.POLL_PKG);
				setTimeout(loop, 10);
				break;
			case "push":
				pushPhase();
				break;
			case "init":
				initPhase();
				break;
			}
		})();
	};

	var pushPhase = function() {
		freqSet = 100;
		(function loop() {
			if (!enable)
				return;
			var work = workQueue.shift();
			if (work !== undefined) {
				var view = new DataView(work[1]);

				for(i = 0; i < initNonceL.length; i++)
				{
					if(initNonceL[i].blockno == (view.getUint32(9) % job.merkleRootLen) + 1)
					{
						work = workQueue.shift();
						if (work == undefined) 
						{
							setTimeout(loop, 10);
							return;
						}
						var view = new DataView(work[1]);
						i = 0;
					}
				}
				send(work[0]);
				send(Q10.roll(work[1], asicCount - 1));
				phase = "poll";
				setTimeout(
				  pollPhase,
				  Math.round(25 * 703 / freqSet)
				);
			} else
				setTimeout(loop, 10);
		})();
	};

	var initPhase = function() {
		if (!enable)
			return;
		send(SET_VOLT_PKG);
		setTimeout(function() {
			if (!enable)
				return;
			send(SET_FREQ_PKG0);
			send(SET_FREQ_PKG);
			phase = "push";
			pushPhase();
		}, 1000);
	};

	var setVoltage = function(volt) {
		if (volt === voltSet)
			return;
		voltSet = volt;
		SET_VOLT_PKG = Q10.pkgEncode(Q10.P_SET_VOLT, 0, 1, 1, Q10.freqEncode(volt));
		if (phase !== null)
			send(SET_VOLT_PKG);
	};

	var setFrequency = function(freqs) {
		freqSet = freqs;
		SET_FREQ_PKG = Q10.pkgEncode(Q10.P_SET_FREQ, 0, 1, 1,	Q10.freqEncode(freqs));
		if (phase !== null)
			send(Q10.SET_FREQ_PKG);
	};

	var run = function() {
		if (!pass || enable)
			return false;
		enable = true;
		phase = "init";
		initPhase();
	};

	var detect = function() {
		send(Q10.DETECT_PKG);
	};

	var connect = function() {
		dev_con = new hid.HID(Q10.VENDOR_ID, Q10.Q10_ID);
		detect();
	};

	var listen = function() {
		dev_con.on("data", myListener);
	};

	var disconnect = function() {
		dev_con.on('end', function(){
		});
	};

	var halt = function() {
		enable = false;
		phase = null;
	};

	// getters
	Object.defineProperties(this, {
		deviceId: {get: function() {return device.deviceId;}},
		deviceType: {get: function() {return deviceType;}},
		dna: {get: function() {return dna;}},
	});

	// events
	this.onDetect = onDetect;
	this.onNonce = onNonce;
	this.onStatus = onStatus;
	this.onDevListen = listen;

	// public functions
	this.setVoltage = setVoltage;
	this.setFrequency = setFrequency;
	this.run = run;
	this.halt = halt;
	this.connect = connect;
	this.disconnct = disconnect;
}

Q10.pkgEncode = function(type, opt, idx, cnt, data) {
	if( os.platform() == 'win32' )
	{
		var pkg = new ArrayBuffer(41);
		var pkgArray = new Uint8Array(pkg);
		var pkgView = new DataView(pkg);
		
		pkgArray[0] = 0;
		pkgArray[1] = Q10.CANAAN_HEAD1;
		pkgArray[2] = Q10.CANAAN_HEAD2;
		pkgArray[3] = type;
		pkgArray[4] = opt;
		pkgArray[5] = idx;
		pkgArray[6] = cnt;

		pkgArray.set(new Uint8Array(data), 7);

		var crc = utils.crc16(pkg.slice(7, 39));
		pkgView.setUint16(39, crc, false);
	} else {
		var pkg = new ArrayBuffer(40);
		var pkgArray = new Uint8Array(pkg);
		var pkgView = new DataView(pkg);
		
		pkgArray[0] = Q10.CANAAN_HEAD1;
		pkgArray[1] = Q10.CANAAN_HEAD2;
		pkgArray[2] = type;
		pkgArray[3] = opt;
		pkgArray[4] = idx;
		pkgArray[5] = cnt;

		pkgArray.set(new Uint8Array(data), 6);
		var crc = utils.crc16(pkg.slice(6, 38));
		pkgView.setUint16(38, crc, false);
	}
	return pkg;
};

Q10.VENDOR_ID = 0;
Q10.Q10_ID = 0;

Q10.P_DETECT = 0x10;
Q10.P_SET_VOLT = 0x22;
Q10.P_SET_FREQ = 0x23;
Q10.P_WORK = 0x24;
Q10.P_POLL = 0x30;
Q10.P_REQUIRE = 0x31;
Q10.P_TEST = 0x32;
Q10.P_ACKDETECT = 0x40;
Q10.P_STATUS = 0x41;
Q10.P_NONCE = 0x42;
Q10.P_TEST_RET = 0x43;

Q10.CANAAN_HEAD1 = 0x43;
Q10.CANAAN_HEAD2 = 0x4e;

Q10.FREQ_TABLE = [];
Q10.FREQ_TABLE[150] = 0x22488447;
Q10.FREQ_TABLE[163] = 0x326c8447;
Q10.FREQ_TABLE[175] = 0x1a268447;
Q10.FREQ_TABLE[188] = 0x1c270447;
Q10.FREQ_TABLE[200] = 0x1e278447;
Q10.FREQ_TABLE[213] = 0x20280447;
Q10.FREQ_TABLE[225] = 0x22288447;
Q10.FREQ_TABLE[238] = 0x24290447;
Q10.FREQ_TABLE[250] = 0x26298447;
Q10.FREQ_TABLE[263] = 0x282a0447;
Q10.FREQ_TABLE[275] = 0x2a2a8447;
Q10.FREQ_TABLE[288] = 0x2c2b0447;
Q10.FREQ_TABLE[300] = 0x2e2b8447;
Q10.FREQ_TABLE[313] = 0x302c0447;
Q10.FREQ_TABLE[325] = 0x322c8447;
Q10.FREQ_TABLE[338] = 0x342d0447;
Q10.FREQ_TABLE[350] = 0x1a068447;
Q10.FREQ_TABLE[363] = 0x382e0447;
Q10.FREQ_TABLE[375] = 0x1c070447;
Q10.FREQ_TABLE[388] = 0x3c2f0447;
Q10.FREQ_TABLE[400] = 0x1e078447;

Q10.roll = function(halfWork, roll) {
	var view = new DataView(halfWork);
	if( os.platform() == 'win32' ) {
		view.setUint8(15, roll);
		view.setUint16(39, utils.crc16(halfWork.slice(7, 39)), false);
	} else {
		view.setUint8(14, roll);
		view.setUint16(38, utils.crc16(halfWork.slice(6, 38)), false);
	}
	return halfWork;
};

Q10.voltEncode = function(volt) {
	if (volt === 0)
		return utils.hex2ab("00ff");
	var buffer = new ArrayBuffer(2);
	var view = new DataView(buffer);
	view.setUint16(0, (((0x59 - (volt - 5000) / 125) & 0xff) << 1 | 1), false);
	return buffer;
};

Q10.voltDecode = function(raw) {
	if (raw === 0xff)
		return 0;
	return (0x59 - (raw >>> 1)) * 125 + 5000;
};

Q10.freqEncode = function(freqs) {
	var buffer = new ArrayBuffer(12);
	var view = new DataView(buffer);
	for (var i = 0; i < 3; i++)
		view.setUint32(i * 4, Q10.FREQ_TABLE[
			Math.round(Math.floor(freqs[i] / 12.5) * 12.5)
		]);
	return buffer;
};

Q10.voltSourceDecode = function(raw) {
	return (raw * 3.3 / 1023 * 11).toFixed(1);
};

Q10.temperatureDecode = function(raw) {
	return (1 / (1 / (25 + 273.15) -
		Math.log((1023 / raw) - 1) /
		3450) - 273.15).toFixed(1);
};

Q10.DETECT_PKG = Q10.pkgEncode(Q10.P_DETECT, 0, 1, 1, 0);
Q10.POLL_PKG = Q10.pkgEncode(Q10.P_POLL, 0, 1, 1, 0);

var MinerEvent = function() {
	var registered = [];

	this.addListener = function(callback) {
		return registered.push(callback) - 1;
	};

	this.removeListener = function(id) {
		delete(registered[id]);
	};

	this.fire = function(msg) {
		for (var callback of registered)
			if (callback !== undefined)
				callback(msg);
	};
};
var q10new = function(device, workQueue, voltSet, freqSet) {
	return new Q10(device, workQueue, voltSet, freqSet);
}

module.exports.q10new = q10new;
