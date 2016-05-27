var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var phoneSchema = new Schema({
	device 		: String,
	isSmart 	: Boolean,
	releaseTime	: Date,
	price		: Number,
	apps		: [{name : String}],
	manufacturer: {
		name 	: String,
		country	: String
	}
});

phoneSchema.methods.printBrief = function () {
	console.log(this.device, '￥'+this.price);
};


var Phone = mongoose.model('Phone', phoneSchema);

var raw;
raw = require('./raw.iPhoneSe.json');
var iPhoneSE = new Phone(raw);
iPhoneSE.printBrief();

raw = require('./raw.huawei.Mate8.json');
var huaweiMate8 = new Phone(raw);
huaweiMate8.printBrief();

raw = require('./raw.mi.max.json');
var miMax = new Phone(raw);
miMax.printBrief();

raw = require('./raw.samsung.S6Edge.json');
var s6Edge = new Phone(raw);
s6Edge.printBrief();

var db = mongoose.connection;
// connection的事件列表可查看:http://mongoosejs.com/docs/api.html#connection_Connection
// 或 ./node_modules/mongoose/lib/connection.js#Connection()
db.on('error', console.error.bind(console, 'connection error:'));
db.on('open', ()=>{
	console.log('db open');
	// 先删除所有的数据
	Phone.remove({}, (err)=>{
		if (err) {
			console.log('Phone remove all occur a error:', err);
		} else {
			console.log('Phone remove all success.');
		}
	});
});
db.on('connecting', ()=>{
	console.log('db connecting...');
});
db.on('connected', ()=>{
	console.log('db connected');
});
db.on('disconnecting', ()=>{
	console.log('db disconnecting...');
});
db.on('disconnected', ()=>{
	console.log('db disconnected');
});
db.on('close', ()=>{
	console.log('db close');
});

mongoose.connect('mongodb://localhost:27017/Phone');

