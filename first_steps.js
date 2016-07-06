//This code is hilariously bad. I apologize.

var unirest = require('unirest');
var secrets = require('./secrets');
var Promise = require('promise');

var test = {
	account: 'EXB123456',
	venue: 'TESTEX',
	stock: 'FOOBAR',
}

var actual = {
	account: 'TLY27813709',
	venue: 'DMOMEX',
	stock: 'KOIG',
}

var useTest = true;

var baseUrl = 'https://api.stockfighter.io/ob/api';


function getQuote(venue, stock, qty) {
	return new Promise(function (fulfill, reject){
		unirest
			.get(baseUrl + /venues/ + venue + '/stocks/' + stock + '/quote')
			.headers(
				{'Accept': 'application/json',
				'Content-Type': 'application/json',
				'X-Starfighter-Authorization': secrets.API_KEY,
				})
			.end(function (response) {
				var quote = response.body;
				if(!quote.ok) {
					//if there was a problem
					return reject(quote.error);
				} else if(quote.ask) {
					return fulfill(quote);
				} else {
					return getQuote(venue, stock, qty);
				}
			});
	});
}

function postOrder(account, venue, stock, qty, price) {
	console.log("Trying to purchase " + qty + " units at " + price + " per.");
	return new Promise(function (fulfill, reject){
		unirest
			.post(baseUrl + /venues/ + base.venue + '/stocks/' + base.stock + '/orders')
			.headers(
				{'Accept': 'application/json',
				'Content-Type': 'application/json',
				'X-Starfighter-Authorization': secrets.API_KEY,
				})
			.send({
			    "account": base.account,
			    "price": price,
			    "qty": qty,
			    "direction": "buy",
			    "orderType": "limit"
			})
			.end(function (response) {
				var order = response.body;
				console.log("posted order with id:" + order.id);
				if(!order.ok) {
					//if there was a problem
					return reject(order.error);
				} 
				
				return fulfill(order);
			});
	});
}

function getStatus(id) {
	console.log("getting status for order: " + id);
	return new Promise(function (fulfill, reject){
		unirest
			.get(baseUrl + /venues/ + base.venue + '/stocks/' + base.stock + '/orders/' + id)
			.headers(
				{'Accept': 'application/json',
				'Content-Type': 'application/json',
				'X-Starfighter-Authorization': secrets.API_KEY,
				})
			.end(function (response) {
				var status = response.body;
				if(!status.ok) {
					//if there was a problem
					return reject(status.error);
				} else if(status.open === false) {
					//if our order was filled
		  			return fulfill(status);
		  		}
	  			console.log(status)
	  			//if the order wasn't filled
	  			return getStatus(id);
			});
	  });
}

var base = useTest ? test : actual;
var baseQty = 100;
getQuote(base.venue, base.stock, baseQty)
	.then(	quote => postOrder(base.account, base.venue, base.stock, baseQty, quote.ask))
	.then(	order => getStatus(order.id))
	.done( result => console.log(result)
			, error => console.log("ERRORKJHFK:" + error))

//getStatus(100).then(response => console.log("sucess: " + response), response => console.log("error: " + response));