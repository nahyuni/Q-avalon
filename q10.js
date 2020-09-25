var path = require('path');
path.join(process.cwd(), '/node_modules');

var os = require('os');
var utils = require('./utils.js');
var Q10 = require('./q10_driver.js');
var q10_ctl = require('./q10_thread.js');
var hid = require("node-hid");
var net = require('net');
var header = "Q10 main";
var enabled = false;
var freqSet, voltSet;
utils.enableLog();
var pools = [], q10s = [];
var jobQueue = [
	{thisId: -1, value: []},
	{thisId: -1, value: []},
	{thisId: -1, value: []},
];

var mercleRoot_len = 0;
var prevhash_len = 0;
mercleRoot = [];

if (process.argv.length < 3) {
	console.log("Usage: node q10.js option(-d:deviceInfo, -w:work)");
	console.log("ex: node q10.js -d" );
	console.log("Usage: node q10.js -w ntime version(8) prevhash(64) mercleRoot1(64) mercleRoot2(64) .....");
	console.log("ex: node q10.js -w 1578298274 a8c1de64 00000000bfb6a9acabaa78d382681f4a52ed91f9e7f3b46df584238fda584ee3;00000000714051a105ee4c362786b8552a5fec4c847457bb000527322eccf43c 40a629a201e918dd70257980bd423f050c65d883fa3aac29df12e1f41d448c81;7a602175e8202dd03afce919ae6ed51575d1b0ad402b1167938ac5d978258c08");
	process.exit(-1);
}

if(process.argv[2] == "-w") {
	var paramSetting =
	{
		div : process.argv[2],
		ntime : process.argv[3],
		version : process.argv[4],
		prevhash : process.argv[5].split(';'),
		mercleRoot : process.argv[6].split(';'),
		freqSet : 100,
		voltSet : 6500
	};
	mercleRoot_len = paramSetting.mercleRoot.length;
	prevhash_len = paramSetting.prevhash.length;
} else {
	var paramSetting =
	{
		div : process.argv[2],
		freqSet : 100,
		voltSet : 6500
	};
}

if(mercleRoot_len != prevhash_len) {
	console.log("mercleRoot_len is not equl prevhash_len" );
	process.exit(-1);	
}

var threadPaused = false;
var workQueue = {
	value: [],
	shift: function() {
		if (workQueue.value.length < 1 && threadPaused) {
			q10_ctl.q10_control({info: "resume"});
			threadPaused = false;
		}
		return this.value.shift();
	},
	push: function(data) {
		if (workQueue.value.length >= 24) {
			q10_ctl.q10_control({info: "pause"});
			threadPaused = true;
		}
		return this.value.push(data);
	},
	init: function() {
		this.value = [];
	},
};

var activePool = Infinity;
var hashrates = [];
var errors = [];
var totalHashrate = Array.apply(null, new Array(721)).map(Number.prototype.valueOf, 0);

var start_time = 0;
var detectHandler = function(info) {
	if(paramSetting.div == '-d')
	{
		utils.log("log", ["Version:  %s", info.version], header, "color: green");
		utils.log("log", ["DNA:      0x%s", info.dna], header, "color: green");
		process.exit(-1);
	}

	if(paramSetting.div == "-w")
	{
		start_time = new Date();
		console.log(" start time : " + new Date());
		q10_ctl.q10_control({info: "clean"});
		workQueue.init();
		q10_ctl.q10_control({info: "newJob", job: job});
		q10s[0].run();
	}
};

var threadSpeed = true;
result2 = [];
result3 = [];

var detectWork= function(work) {
	var view = new DataView(work[1]);
	var is_dupli = false;
	for(i = 0; i < result3.length; i++) {
		if(result3[i].blockno == (view.getUint32(9) % job.mercleRoot_len) + 1) {
			is_dupli = true;
			break;
		}
	} 
	if(!is_dupli) {
		workQueue.push(work);
	}
	if(workQueue.value.length < 1 && result3.length > 0 && threadSpeed) {
		q10_ctl.q10_control({info: "speed"});
		threadSpeed = false;
	}
}

var nonceHandler = function(info) {
	var ntime = parseInt(job.ntime) + Math.round(parseInt(info.nonce2)/job.mercleRoot_len);
	var result = utils.varifyWork(job, info.nonce2, ntime, info.nonce);
	result2.push(result);
	result2.sort(function(a, b) { 
		return a.blockno < b.blockno ? -1 : a.blockno > b.blockno ? 1 : 0;  
	});

	result3 = Object.values(result2.reduce((acc,cur)=>Object.assign(acc,{[cur.blockno]:cur}),{}));
	if(result3.length == mercleRoot_len) {
		utils.log("log", ["result_info : %s", JSON.stringify(result2)], header);
		var end_time = new Date();
		console.log(" take time : " + (end_time.getTime() - start_time.getTime())/ 1000);
		process.exit(-1);
	}
};

var statusHandler = function(stats) {
};

var device_info = {
	deviceId : 0,
	deviceType : 1,
	productId : 16625
};

var device = function(stats) {
	stats.type = "status";
};

var scanDevices = function() {
	var id = 0;
	var voltSet = paramSetting.voltSet;
	var freqSet = paramSetting.freqSet;
	q10s[id] = Q10.q10new(device_info, workQueue, voltSet, freqSet);

	q10s[id].connect();
	q10s[id].onDevListen();

	q10s[id].onDetect.addListener(detectHandler);
	q10s[id].onNonce.addListener(nonceHandler);
	q10s[id].onStatus.addListener(statusHandler);
	hashrates[id] = hashrates[id] ||
		Array.apply(null, new Array(721)).map(Number.prototype.valueOf, 0);
	errors[id] = errors[id] || {error: 0, all: 0};
};

var hashrate = [];
var calcHashrate = function() {
	(function loop() {
		var h, e;
		for (var i in hashrates) {
			h = hashrates[i];
			e = errors[i];
			if (h !== undefined) {
				h.unshift(0);
				hashrate.push({
					current_hs5s: h[1] / 5 * 4294967296,
				});
				h.pop();
			}
		}
		h = totalHashrate;
		h.unshift(0);
		hashrate.push({
			total_hs5s: h[1] / 5 * 4294967296,
		});
		h.pop();
		if (enabled)
			setTimeout(loop, 5000);
	})();
};

/*****************************************************************************************/
enabled = true;

q10_ctl.onWork.addListener(detectWork);

scanDevices();
calcHashrate();

for (var q10 of q10s) {
	if (q10 === undefined)
		continue;
	q10.setVoltage(paramSetting.voltSet);
	q10.setFrequency(paramSetting.freqSet);
}

job = {
	poolId: 0,
	nonce1: 0,
	nonce2Size: 8,
	jobId: 1,
	prevhash: paramSetting.prevhash,
	merkleRoot: paramSetting.mercleRoot,
	version: paramSetting.version,
	nbits: "1d00ffff",
	ntime: paramSetting.ntime,
	cleanJobs: 0,
	target: utils.getTarget(4098),
	mercleRoot_len : mercleRoot_len,
};
