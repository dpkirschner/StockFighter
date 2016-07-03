//This code is hilariously bad. I apologize.

var unirest = require('unirest');
var secrets = require('./secrets');

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

var useTest = false;

var baseUrl = 'https://api.stockfighter.io/ob/api';

function getQuote(qty) {
	var base = useTest ? test : actual
	unirest
		.get(baseUrl + /venues/ + base.venue + '/stocks/' + base.stock + '/quote')
		.headers(
			{'Accept': 'application/json',
			'Content-Type': 'application/json',
			'X-Starfighter-Authorization': secrets.API_KEY,
			})
		.end(function (response) {
			var quote = response.body;
			//if we haven't hit our goal and there is someone selling the stock we want
	  		if(quote.ask) {
	  			console.log("Trying to purchase " + 100 + " units at " + quote.ask + " per.");
	  			postOrder(100, quote.ask);
	  			return;
	  		}
	  		//no pricing information so cycle again until we have some.
	  		getQuote();
		});
}

function postOrder(qty, price) {
	console.log("posting order");
	var base = useTest ? test : actual
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
			getStatus(order.id);
		});
}

function getStatus(id) {
	var base = useTest ? test : actual
	unirest
		.get(baseUrl + /venues/ + base.venue + '/stocks/' + base.stock + '/orders/' + id)
		.headers(
			{'Accept': 'application/json',
			'Content-Type': 'application/json',
			'X-Starfighter-Authorization': secrets.API_KEY,
			})
		.end(function (response) {
	  		var status = response.body;
	  		if(status.open === false) {
	  			console.log("order completed!")
	  			return;
	  		}
	  		//if not all of our order has been filled, keep checking until it is.
	  		getStatus(id);
		});
}

getQuote(100);