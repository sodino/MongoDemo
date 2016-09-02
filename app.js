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

phoneSchema.statics.printCount = function() {
	// 其它的count()计算方法见以下链接：http://mongoosejs.com/docs/api.html#query_Query-count

	// Model.count([selector], [callback])
	this.count({}, (err, count) => {
		console.log('---printCount()-----------------------------')
		if (err) {
			console.log(err);
		} else {
			console.log('phone count=' + count);
		}
	});
};


var myPhoneSchema = new Schema({
	_device : String,   // 设备名，用于精确查找ref，避免出现过多的空数据
	_phone  : {type : Schema.Types.ObjectId, ref : 'Phone'} // 定义引用
});

myPhoneSchema.statics.addMyPhone = function(phone, callback){
	// 需要_device来条件过滤，否则callback中phones会是一个数组长度为数据库集合数的数组
	// populate操作并不像find等操作是在mongo db内部实现，而是在执行了find()之后对返回的数据再处理
	// 如果没有加_device的限定，则需要对callback中phones再自己编码过滤一遍，会心好累...
	Phone.find({_device : phone.device})  
		.populate({
			path : 'Phone',
			match : {device : phone.device}
		})
		.exec((err, phones) => {
			console.log('---addMyPhone()------------------------------');
			if (err) {
				console.log(err);
			} else {
				if (phones.length > 0) {
					// 经过device的条件过滤，期望目标为只有1个或0个
				} else {

				}
			}
		});
};



console.log('---printBrief()---------------------------------------');
var Phone = mongoose.model('Phone', phoneSchema);
var MyPhone = mongoose.model('MyPhone', myPhoneSchema);

var arrPhone = [];
var raw;
raw = require('./raw.iPhoneSE.json');
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
				}

				findAllPhone();
				Phone.printCount();
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
			Phone.printCount();
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

		findPhoneInstalledRadio();		
	});
}


function findPhoneInstalledRadio() {
	Phone.find({'apps.name' : 'Radio'}).exec((err, phones)=>{
		console.log('---findPhoneInstalledRadio()---------------------');
		if (err) {
			console.log(err);
		} else {
			phones.forEach((element, index, phones) => {
				console.log(index, element);
			})
		}
		findSmartPhoneInstalledRadio();
	});
}

function findSmartPhoneInstalledRadio() {
	Phone.find({isSmart : true, 'apps.name' : 'Radio'}).exec((err, phones)=>{
		console.log('---findSmartPhoneInstalledRadio()---------------------');
		if (err) {
			console.log(err);
		} else {
			phones.forEach((element, index, phones) => {
				console.log(index, element);
			})
		}
		//findChina_or_SouthKorea_and_1000_4000Phone();
		addOSField();
	});
}

function addOSField() {
	// 为Phone增加`OS`字段
	phoneSchema.add({OS : 'String'});

	Phone.update({device : /nokia/i},
		{
			$set :{OS : 'Symbian'}
		},
		{safe : true, multi : true},
		(err, rawResponse) => {
			console.log('---addOSField()---nokia------------------------');
			if (err) {
				console.log(err);
			} else {
				console.log(rawResponse);
			}
		}
	);

	Phone.update({device : /iphone/i},
		{
			$set : {OS : 'Apple OS'}
		},
		{safe : true, multi : true},
		(err, rawResponse) => {
			console.log('---addOSField()---iphone------------------------');
			if (err) {
				console.log(err);
			} else {
				console.log(rawResponse);
			}
		}
	);

	// Phone.update(
	// 	{$and : [
	// 		{device : {$not : /iphone/i}},
	// 		{device : {$not : /nokia/i}}
	// 		]
	// 	},
	// 	{
	// 		$set : {OS : 'Android'}
	// 	},
	// 	{safe : true, multi : true},
	// 	(err, rawResponse) => {
	// 		console.log('---addOSField()---android------------------------');
	// 		if (err) {
	// 			console.log(err);
	// 		} else {
	// 			console.log(rawResponse);
	// 		}
	// 	}
	// );

	// 剩余未添加'OS'字段的都是Android
	Phone.update( { OS: { $exists: false } } ,
		{
			$set : {OS : 'Android'}
		},
		{safe : true, multi : true},
		(err, rawResponse) => {
			console.log('---addOSField()---android------------------------');
			if (err) {
				console.log(err);
			} else {
				console.log(rawResponse);
			}

			findChina_or_SouthKorea_and_1000_4000Phone();
		}
	);

}

function findChina_or_SouthKorea_and_1000_4000Phone() {
	// 查找中国或韩国厂商且价格处于[1000, 4000)范围内的手机

	// 用以下4种方式都可以
	// Phone.find({$or:[
	// 					{'manufacturer.country':'China'},
	// 					{'manufacturer.country':'South Korea'}
	// 				], $and:[
	// 					{'price' : {$gte : 1000}},
	// 					{'price' : {$lt : 4000}}
	// 				]
	// 			}).exec((err, phones) => {
	// 				console.log('---findChina_or_SouthKorea_and_1000_4000Phone()----------------------------');
	// 				if (err) {
	// 					console.log(err);
	// 				} else {
	// 					phones.forEach((element, index, phones) => {
	//					 	console.log(index, element);
	//					});
	// 				}

	// 				findThePhoneWithMostAppsInstalled();
	// 			});


	Phone.find()
		.or([{'manufacturer.country':'China'}, {'manufacturer.country':'South Korea'}])
		.where('price').gte(1000).lt(4000)
		.exec((err, phones) => {
			console.log('---findChina_or_SouthKorea_and_1000_4000Phone()----------------------------');
			if (err) {
				console.log(err);
			} else {
				phones.forEach((element, index, phones) => {
					console.log(index, element);
				});
			}

			randomSelect();
		});

	// Phone.find({'manufacturer.country' : 
	// 				{$in:['China', 'South Korea']}, 
	// 			$and:[
	// 					{'price' : {$gte : 1000}},
	// 					{'price' : {$lt : 4000}}
	// 				]
	// 			}).exec((err, phones) => {
	// 				console.log('---findChina_or_SouthKorea_and_1000_4000Phone()----------------------------');
	// 				if (err) {
	// 					console.log(err);
	// 				} else {
	// 					phones.forEach((element, index, phones) => {
	// 						console.log(index, element);
	// 					});
	// 				}

	// 				randomSelect();
	// 			});

	// Phone.find()
	// 	.where('manufacturer.country').in(['China', 'South Korea'])
	// 	.where('price').gte(1000).lt(4000)
	// 	.exec((err, phones) => {
	// 		console.log('---findChina_or_SouthKorea_and_1000_4000Phone()----------------------------');
	// 		if (err) {
	// 			console.log(err);
	// 		} else {
	// 			phones.forEach((element, index, phones) => {
	// 				console.log(index, element);
	// 			});
	// 		}
	//		randomSelect();
	// 		
	// 	});


}



// $sample 随机选择/取样
function randomSelect() {
	Phone.aggregate([
			// $match：在符合条件的结果中取$sample,根据实际情况可以注释掉，不使用
			{
				$match : { isSmart : true} // 只在智能机中取样
			}, 
			{ 
				$sample : {size : 1} // 随机选一个
			}
		]).exec((err, arr) => {
			console.log('---randomSelect()--------------------------');
			if (err) {
				console.log(err);
			} else {
				console.log(arr);
			}
			findThePhoneWithMostAppsInstalled();
		});
}

function findThePhoneWithMostAppsInstalled() {
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
					console.log('---findThePhoneWithMostAppsInstalled()---------------------------------');
					if (err) {
						console.log(err);
					} else {
						var phone = phones[0];
						console.log(phone);
					}


					updateDeviceName(phone);
				});
}




function updateDeviceName(phone) {
	// Phone.update({_id : phone._id},
	// 	{device : "Huawei Mate 8000"},
	// 	{safe : true},
	// 	(err, rawResponse) => {
	// 		console.log('---updateDeviceName()---------------------------------');
	// 		if (err) {
	// 			console.log(err);
	// 		} else {
	// 			console.log(rawResponse);

	// 			Phone.findOne({_id : phone._id}, (err, phone) => {
	// 				console.log('---device update to "Huawei Mate 8000"---------------------------------');
	// 				if (err) {
	// 					console.log(err);
	// 				} else {
	// 					console.log(phone);
	// 				}

	// 				addApps(phone);
	// 			});
	// 		}
	// 	}
	// );


	Phone.update({_id : phone._id},
		{
			$set :{device : "Huawei Mate 8000"}
		},
		{safe : true},
		(err, rawResponse) => {
			console.log('---updateDeviceName()---------------------------------');
			if (err) {
				console.log(err);
			} else {
				console.log(rawResponse);

				Phone.findOne({_id : phone._id}, (err, phone) => {
					console.log('---device update to "Huawei Mate 8000"---------------------------------');
					if (err) {
						console.log(err);
					} else {
						console.log(phone);
					}

					addApps(phone);
				});
			}
		}
	);
}

function addApps(phone) {
	// 保存phone的全部信息
	// phone.apps.push({name : "58City"});
	// Phone.update({_id : phone._id}, 
	// 	phone, 
	// 	{safe : true, upsert : true},
	// 	(err, rawResponse) => {
	// 		console.log('---addApps()---------------------------------');
	// 		if (err) {
	// 			console.log(err);
	// 		} else {
	// 			console.log(rawResponse);

	// 			Phone.findOne({_id : phone._id}, (err, phone) => {
	// 				console.log('---app:58City added.---------------------------------');
	// 				if (err) {
	// 					console.log(err);
	// 				} else {
	// 					console.log(phone);
	// 				}

	// 				removePhone(phone);
	// 			});
	// 		}
	// 	}
	// );


	// 只修改apps 这个数组
	Phone.update({_id : phone._id}, 
		{$push : {apps : {name : '58City'}}},
		{safe : true, upsert : true},
		(err, rawResponse)=>{
			console.log('---addApps()---------------------------------');
			if (err) {
				console.log(err);
			} else {
				console.log(rawResponse);

				Phone.findOne({_id : phone._id}, (err, phone) => {
					console.log('---app:58City added.---------------------------------');
					if (err) {
						console.log(err);
					} else {
						console.log(phone);
					}

					removePhone(phone);
				});
			}
		}
	);
}

function removePhone(phone) {
	Phone.remove({_id: phone._id}, (err) => {
		console.log('---removePhone()---', phone.device, '------------------------');
		if (err) {
			console.log(err);
		} else {
			Phone.find((err, phones) => {
				if (err) {
					console.log('findAllPhone err:', err);
				} else {
					phones.forEach((element, index, phones) => {
						console.log(index, element);
					});
				}

				console.log('---mongoose close db-----------------------------------');
				// 关闭
				// mongoose.connection.close();
				// db.close();

				mongoose.disconnect();
			});
		}
	});
}
