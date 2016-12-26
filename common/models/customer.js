'use strict';

module.exports = function(Customer) {
	var joiningFees = 100,
		parentPayback = 0.3 * joiningFees,
		ambassadorPayback = 0.1 * joiningFees;

	Customer.observe('before save', function updateTimestamp(ctx, next) {
	  if (ctx.instance) {
	    ctx.instance.lastUpdated = new Date();
	  } else {
	    ctx.data.lastUpdated = new Date();
	  }
	  next();
	});

	var re =  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    Customer.validatesFormatOf('email', {with: re, message: 'Must provide a valid email'});    
    
    function validateUniqueEmail(err, done) {
    	Customer.findOne({
    		where: {
    			email: this.email
    		}
    	}, function(ere, obj) {
            if (obj) err();
            done();
        });        
    }
	Customer.validateAsync('email', validateUniqueEmail, {message: 'Email already registered'});

	function validateReferralExists(err, done) {
		var referralId = this.referralId;
		if(referralId) {
			Customer.findOne({
	    		where: {
	    			customerId: referralId
	    		}
	    	}, function(error, obj) {
	            if (!obj) err();
	            done();
	        });
		} else {
	    	done();
		}        
    }

    Customer.validateAsync('referralId', validateReferralExists, {message: 'Parent Customer Id is invalid'});
	

	function getCustomerById(customerId) {
		return new Promise(function(resolve, reject) {
			Customer.findById(customerId, function(err, obj) {
	            if(err) {
	            	reject(err)
	            } else {
	            	resolve(obj)
	            }
	        });
		});
	}
	function addAmbassadorPayback(customerId, ambassadors) {
		return new Promise(function(resolve, reject) {
			ambassadors = ambassadors || [];

			getCustomerById(customerId)
				.then(function (obj) {
					if(obj.isAmbassador) {
						ambassadors.push(obj.customerId);
					}
					if(obj.referralId) {
						addAmbassadorPayback(obj.referralId, ambassadors)
							.then(function() {
								resolve();
							}, function(error) {
								reject(error);
							})
					} else if(ambassadors.length) {
						Customer.updateAll({ "customerId" : {"inq": ambassadors}}, {'$inc': { "payback": ambassadorPayback}}, function(err, customers) {
							if(err) {
								reject(err)
							} else {
								resolve();
							}
						});
					} else {
						resolve();
					}
				}, function(error) {
					reject(error);
				})
		});
	}
	function addPayback(referralId) {
		return new Promise(function(resolve, reject) {
			Customer.updateAll({"customerId": referralId}, {'$inc': {payback: parentPayback}}, function(err, obj) {
        		if(err) {
        			reject(err)
        		} else {
        			Customer.findById(referralId, function(err, obj) {
	        			if(obj.referralId) {
			            	addAmbassadorPayback(obj.referralId)
			            		.then(function() {
			            			resolve();
			            		}, function(err) {
			            			reject(err);
			            		});
		            	} else {
		            		resolve();
		            	}
        			});
        		}
			});
		});
	}
	function getAllAmassadorChildren(customerId, result) {
		return new Promise(function(resolve, reject) {
			result = result || [];
			Customer.find({where:{referralId:  customerId}}, function(err, children) {
				if(err) {
					reject(err);
				} else {
					Array.prototype.push.apply(result, children);
					if(children.length) {
						var promises = [];
						children.forEach(function(c) {
							promises.push(getAllAmassadorChildren(c.customerId, result));
						});
						Promise.all(promises)
							.then(function() {
								resolve(result);
							}, function(err) {
								reject(err);
							})
					} else {
						resolve(result);
					}
				}
			});
		});
	}
	function getAllAmassadorChildrenAtNthLevel(customerId, level, currentLevel, result) {
		return new Promise(function(resolve, reject) {
			currentLevel++;
			result = result || [];
			Customer.find({"where":{"referralId":  customerId}}, function(err, children) {
				if(err) {
					reject(err);
				} else {
					if(level === currentLevel) {
						Array.prototype.push.apply(result, children);
						resolve(result);
					} if(children.length) {
						var promises = [];
						children.forEach(function(c) {
							promises.push(getAllAmassadorChildrenAtNthLevel(c.customerId, level, currentLevel, result));
						});
						Promise.all(promises)
							.then(function() {
								resolve(result);
							}, function(err) {
								reject(err);
							})
					} else {
						resolve(result);
					}
				}
			});
		});
	}
		Customer.addCustomer = function(newCustomer, cb) {
		var currentDate = new Date();
	  	Customer.create({
	  		email: newCustomer.email, 
	  		joiningDate: currentDate
	  	}, function(err, obj) {
	  		if(err) {
	  			cb(null, {error: err});
	  		} else {
		  		cb(null, {message:"Customer added successfully",customer: obj});
	  		}
	  	});
	};
	Customer.getCustomerById = function(customerData, cb) {
		getCustomerById(customerData.customerId)
			.then(function (obj) {
            	cb(null, obj);
			}, function(error) {
				cb(null, {error: error});
			});
	};
	Customer.addReferral = function(newCustomer, cb) {
		var currentDate = new Date();
	  	Customer.create({
	  		email: newCustomer.email,
	  		referralId: newCustomer.referralId, 
	  		joiningDate: currentDate
	  	}, function(err, obj) {
	  		if(err) {
	  			cb(null, {error: err});
	  		} else {
	  			addPayback(obj.referralId)
	  				.then(function() {
	  					cb(null, {message:"Customer added successfully",customer: obj});
	  				}, function(error) {
	  					Customer.destroyById(obj.customerId);
	  					cb(null, error);
	  				})

	  		}
	  	});
	};
	Customer.fetchAllChildren = function(customerData, cb) {
		Customer.find({"where":{"referralId": customerData.customerId}}, function(err, children) {
			if(err) {
				cb(null, {error: err});
			} else {
				cb(null, children);				
			}
		});
	};
	Customer.addAmbassador = function(newAmbassador, cb) {
		var currentDate = new Date();
	  	Customer.create({
	  		email: newAmbassador.email, 
	  		joiningDate: currentDate,
	  		isAmbassador: true
	  	}, function(err, obj) {
	  		if(err) {
	  			cb(null, {error: err});
	  		} else {
		  		cb(null, {message:"Customer added successfully",customer: obj});
	  		}
	  	});
	};
	Customer.convertCustomerToAmbassador = function(customerData, cb) {
		Customer.updateAll({
			"customerId": customerData.customerId
		}, {"isAmbassador": true}, function(err, obj) {
			if(err) {
				cb(null, {error: error});
			} else {
				getCustomerById(customerData.customerId)
					.then(function(ambassador) {
						cb(null, {customer: ambassador, "message": "Successfully converted customer to ambassador"});						
					}, function(err) {
						cb(null, err);
					});

			}
		});	
	};
	Customer.fetchAllAmbassadorChildren = function(customerData, cb) {
		var customerId = customerData.customerId;
		getCustomerById(customerId)
			.then(function(obj) {
				if(obj.isAmbassador) {
					getAllAmassadorChildren(customerId)
						.then(function(result) {
							cb(null, result);
						}, function(err) {
							cb(null, {error: err});
						})				
				} else {
					cb(null, {error: "Customer is not a ambassador"});	
				}
			}, function(err) {
				cb(null, {error: err});
			});
	};
	Customer.fetchAllAmbassadorChildrenAtNthLevel = function(customerData, cb) {
		var customerId = customerData.customerId,
			level = customerData.level;
		getCustomerById(customerId)
			.then(function(obj) {
				if(obj.isAmbassador) {
					getAllAmassadorChildrenAtNthLevel(customerId, level, 0)
						.then(function(result) {
							cb(null, result);
						}, function(err) {
							cb(null, {error: err});
						})				
				} else {
					cb(null, {error: "Customer is not a ambassador"});	
				}
			}, function(err) {
				cb(null, {error: err});
			});
	};
	Customer.fetchAllCustomerWithReferralCount = function(sortData, cb) {
		var order = sortData ? sortData.order || "desc" : "desc";
		Customer.find(function(err, customers) {
			if(err) {
				cb(null, {error: err});
			} else {
				var map = {};
				customers.forEach(function(c) {
					var referralId = c.referralId;
					if(referralId && map[referralId]) {
						map[referralId] += 1;
					} else if(referralId) {
						map[referralId] = 1; 
					}
				});
				customers.forEach(function(c) {
					c.referralCount = map[c.customerId] || 0; 
				});
				customers.sort(function(a , b) {
					if(order === "asc") {
						return a.referralCount - b.referralCount;
					} else {
						return b.referralCount - a.referralCount;
					}
				})
				cb(null, customers);
					
			}
		});
	};
	Customer.remoteMethod('addCustomer', {
	      accepts: {
	      	arg:'newCustomer',
	      	type: {email:"string"}, 
	      	http: { source: 'body' }
	      },
	      returns: {
	      	type: {
	      		customer:Customer,
	      		message:"string"
	      	}, 
	      	root: true
	      }
	});
	Customer.remoteMethod('getCustomerById', {
		accepts: {
			arg:'customerData',
			type: {"customerId":"string"}, 
			http: { source: 'body' }
		},
		returns: {
			type: Customer, 
			root: true
		}
	});
	Customer.remoteMethod('addReferral', {
	      accepts: {
	      	arg:'newCustomer',
	      	type: {email:"string",referralId:"string"}, 
	      	http: { source: 'body' }
	      },
	      returns: {
	      	type: {
	      		customer: Customer,
	      		message: "string"
	      	}, 
	      	root: true
	      }
	});
	Customer.remoteMethod('fetchAllChildren', {
		accepts: {
			arg:'customerData',
			type: {"customerId":"string"}, 
			http: { source: 'body' }
		},
		returns: {
			type: [Customer], 
			root: true
		}
	});
	Customer.remoteMethod('fetchAllCustomerWithReferralCount', {
		accepts: {
			arg:'sortData',
			type: {"order":"string"}, 
			http: { source: 'body' }
		},
		returns: {
			type: [Customer], 
			root: true
		}
	});	
	Customer.remoteMethod('addAmbassador', {
	      accepts: {
	      	arg:'newAmbassador',
	      	type: {email:"string"}, 
	      	http: { source: 'body' }
	      },
	      returns: {
	      	type: {
	      		customer:Customer,
	      		message:"string"
	      	}, 
	      	root: true
	      }
	});
	Customer.remoteMethod('convertCustomerToAmbassador', {
		accepts: {
			arg:'customerData',
			type: {"customerId":"string"}, 
			http: { source: 'body' }
		},
		returns: {
			type: {
				customer:Customer,
				message:"string"
			},
      		root: true
		}
	});
	Customer.remoteMethod('fetchAllAmbassadorChildren', {
		accepts: {
			arg:'customerData',
			type: {"customerId":"string"}, 
			http: {source: 'body'}
		},
		returns: {
			type: [Customer], 
			root: true
		}
	});
	Customer.remoteMethod('fetchAllAmbassadorChildrenAtNthLevel', {
		accepts: {
			arg:'customerData',
			type: {"customerId":"string","level": "number"}, 
			http: {source: 'body'}
		},
		returns: {
			type: [Customer], 
			root: true
		}
	});

	["create","upsert","upsertWithWhere","delete","replace", "patch", "exists", "findById", "find", "findOne", "deleteById", "count", "replaceById", "patchAttributes", "createChangeStream", "updateAll", "replaceOrCreate", "replaceById","patchById"].forEach(function(method) {
		Customer.disableRemoteMethod(method,true);		
	});
};
