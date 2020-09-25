var utils = require('./utils.js');
var Q10 = require('./q10_driver.js');
var os = require('os');

P_WORK = 0x24;
CANAAN_HEAD1 = 0x43;
CANAAN_HEAD2 = 0x4e;
DEF_IN_QUESPEED = 50;

var Q10_ctl = function() {
	var enabled = false;
	var jobSpeed = DEF_IN_QUESPEED;
	var loopId, job, jqId, poolId, nonce2;

	var onWork = new Q10Event();
	pkgEncode = function(type, opt, idx, cnt, data) {
		if( os.platform() == 'win32' ) {
			var pkg = new ArrayBuffer(41);
			var pkgArray = new Uint8Array(pkg);
			var pkgView = new DataView(pkg);
			
			pkgArray[0] = 0;
			pkgArray[1] = CANAAN_HEAD1;
			pkgArray[2] = CANAAN_HEAD2;
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
			
			pkgArray[0] = CANAAN_HEAD1;
			pkgArray[1] = CANAAN_HEAD2;
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
	header = "Q10 Control";

	q10_control = function(msg) {
		switch (msg.info) {
			case "stop":
				close();
				break;
			case "pause":
				enabled = false;
				break;
			case "clean":
				job = msg.job;
				job = undefined;
				break;
			case "newJob":
				enabled = false;
				job = msg.job;
				jqId = msg.jqId;
				poolId = job.poolId;
				nonce2 = 0;
			case "resume":
				if (enabled)
					break;
				clearTimeout(loopId);
				enabled = true;
				loop();
				break;
			case "speed":
				jobSpeed = 10;
				break;
		}
	}
	var loop = function() {
		if (job === undefined)
			return;
		ntime = parseInt(job.ntime) + Math.round(parseInt(nonce2)/job.mercleRoot_len);
		var raw = utils.genWork(job, nonce2, poolId, jqId, ntime);
		var work = [];
		var cnt = Math.ceil(raw.byteLength / 33);
		for (var idx = 1; idx < cnt + 1; idx++)
			work.push(pkgEncode(
				P_WORK, 0, idx, cnt,
				raw.slice((idx - 1) * 32, idx * 32)
			));
		onWork.fire(work);
		nonce2++;
		if (enabled)
			loopId = setTimeout(loop, jobSpeed);
	};
	this.onWork = onWork;
	this.q10_control = q10_control;
}

var Q10Event = function() {
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

var q10_ctl = new Q10_ctl();
module.exports = q10_ctl;