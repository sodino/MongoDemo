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

console.log('---printBrief()---------------------------------------');
var Phone = mongoose.model('Phone', phoneSchema);
var arrPhone = [];
var raw;
raw = require('./raw.iPhoneSe.json');
var iPhoneSE = new Phone(raw);
iPhoneSE.printBrief();
arrPhone.push(iPhoneSE);

raw = require('./raw.huawei.Mate8.json');
var huaweiMate8 = new Phone(raw);
huaweiMate8.printBrief();
arrPhone.push(huaweiMate8);

raw = require('./raw.mi.max.json');
var miMax = new Phone(raw);
miMax.printBrief();
arrPhone.push(miMax);

raw = require('./raw.samsung.S6Edge.json');
var s6Edge = new Phone(raw);
s6Edge.printBrief();
arrPhone.push(s6Edge);

raw = require('./raw.nokia1000.json');
var nokia1000 = new Phone(raw);
nokia1000.printBrief();
arrPhone.push(nokia1000);
console.log('------------------------------------------');
db = mongoose.connection;
// connection的事件列表可查看:http://mongoosejs.com/docs/api.html#connection_Connection
// 或 ./node_modules/mongoose/lib/connection.js#Connection()
db.on('error', console.error.bind(console, 'connection error:'));
db.on('open', ()=>{
	console.log('db open');
	// 先删除所有的数据
	Phone.remove({}, (err)=>{
		console.log('---clean db ---------------------------------------');
		if (err) {
			console.log('Phone remove all occur a error:', err);
		} else {
			console.log('Phone remove all success.');
			savePhoneArr(false);

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

function savePhoneArr(saveByEach) {
	if (saveByEach) {
		savePhoneArr.savedCount = 0;
		var length = arrPhone.length;
		console.log('---saved.forEach()---------------------------------------');
		arrPhone.forEach((element, index, arr)=>{
			element.save((err, element)=>{

				if (err) {
					console.log(err);
				} else {
					console.log('Phone[' + element.device + '] saved.');
				}


				savePhoneArr.savedCount ++;
				if (length === savePhoneArr.savedCount) {
					console.log('All phone devices saved.forEach() saved.');
					findAllPhone();
				}
			});
		});
	} else {
		Phone.insertMany(arrPhone, (err, arrPhone)=>{
			if (err) {
				console.log('insertMany() failed.');
			} else {
				console.log('---insertMany()---------------------------------------');
				console.log('All phone devices saved.insertMany() saved.');
			}
			findAllPhone();
		})
	}
}

function findAllPhone() {
	Phone.find((err, phones) => {
		if (err) {
			console.log('findAllPhone err:', err);
		} else {
			console.log('---findAllPhone---------------------------------------');
			
			phones.forEach((element, index, phones) => {
				console.log(index, element);
			});
		}

		findTheMostExpensiveAndCheapPhone();
	});
}

function findTheMostExpensiveAndCheapPhone() {
	findTheMostExpensiveAndCheapPhone.expensive = false;
	findTheMostExpensiveAndCheapPhone.cheap = false;
	// Query.sort('price')   Query.sort({price : 'asc'}})   Query.sort({price : 1}})
	// 查询结果按price数值升序排列
	// Phone.find({}).sort('price').exec((err, phones)=>{
	// 	console.log(phones);
	// });
	// Phone.find({}).sort({price : 'asc'}).exec((err, phones)=>{
	// 	console.log(phones);
	// });
	// Phone.find({}).sort({price : 1}).exec((err, phones)=>{
	//  	console.log(phones);
	// });

	Phone.find({}).sort('-price').limit(1).exec((err, phone) => {
		console.log('---findTheMostExpensivePhone()---------------------------------');
		if (err) {
			console.log(err);
		} else {
			console.log(phone);
		}

		findTheMostExpensiveAndCheapPhone.expensive = true;
		if (findTheMostExpensiveAndCheapPhone.expensive && findTheMostExpensiveAndCheapPhone.cheap) {
			findAllCountry();
		}
	});

	
	// Query.sort('-price')  Query.sort({price : 'desc'}})   Query.sort({price : -1}})
	// 查询结果按price数值降序排列
	// Phone.find({}).sort('-price').exec((err, phones)=>{
	// 	console.log(phones);
	// });
	// Phone.find({}).sort({price : 'desc'}).exec((err, phones)=>{
	// 	console.log(phones);
	// });
	// Phone.find({}).sort({price : -1}).exec((err, phones)=>{
	//  	console.log(phones);
	// });

	Phone.find({}).sort('price').limit(1).exec((err, phone) => {
		console.log('---findTheMostCheapPhone()---------------------------------');		
		if (err) {
			console.log(err);
		} else {
			console.log(phone);
		}


		findTheMostExpensiveAndCheapPhone.cheap = true;
		if (findTheMostExpensiveAndCheapPhone.expensive && findTheMostExpensiveAndCheapPhone.cheap) {
			findAllCountry();
		}
	});
}

function findAllCountry() {
	Phone.find({}).distinct('manufacturer.country').exec((err, countrys)=>{
		console.log('---findAllCountry()---Remove duplicate------------------------------');		
		if (err) {
			console.log(err);
		} else {
			console.log(countrys);
		}

		findNoSmartPhone();
	});
}

function findNoSmartPhone() {
	Phone.find({isSmart : false}).exec((err, phones) => {
		console.log('---findNoSmartPhone()---------------------------------');
		if (err) {
			console.log(err);
		} else {
			phones.forEach((element, index, phones) => {
				console.log(index, element);
			});
		}


		findThePhoneThatInstalledTheLargestNumberOfApps();
	});
}


function findThePhoneThatInstalledTheLargestNumberOfApps() {
	// http://stackoverflow.com/questions/9040161/mongo-order-by-length-of-array
	Phone.aggregate([{$project :
							{apps_count : 
								{$size : 
									{"$ifNull" : ["$apps",[]]
								}
							},
							device : 1,
							manufacturer : 1,
							apps : 1
						}
					}, 
					{$sort:{"apps_count" : -1}}
					])
				// .limit(1) // 可加可不加.取结果的phones[0]即可了
				.exec((err, phones)=>{
					console.log('---findThePhoneThatInstalledTheLargestNumberOfApps()---------------------------------');
					if (err) {
						console.log(err);
					} else {
						var phone = phones[0];
						console.log(phone);
					}


					addApps(phone);
				});
}

function addApps(phone) {
	// http://tech-blog.maddyzone.com/node/add-update-delete-object-array-schema-mongoosemongodb
	// Phone.findByIdAndUpdate(phone._id,
	// 	{$push : {address : "Shenzhen"}},
	// 	{safe : true, upsert : true},
	// 	(err, result) => {
	// 		console.log('---addApps()---------------------------------');
	// 		if (err) {
	// 			console.log(err);
	// 		} else {
	// 			console.log(result);
	// 		}
	// 	});

	phone.apps.push({name : "58City"});
	Phone.update({_id : phone._id}, 
		phone, 
		{safe : true, upsert : true},
		(err, rawResponse) => {
			console.log('---addApps()---------------------------------');
			if (err) {
				console.log(err);
			} else {
				console.log(rawResponse);

				Phone.findOne({_id : phone._id}, (err, phone) => {
					console.log('---app:58City added.---------------------------------');
					console.log(phone);
				});
			}
		}
	);
}

