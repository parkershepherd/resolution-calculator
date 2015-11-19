// jshint ignore: start
"use strict";

let prompt = require('prompt');
let colors = require('colors');
module.exports = (message, name, model) =>
	new Promise((resolve, reject) => {
		prompt.start();
		console.log();
		console.log(message.cyan, '(Ctrl+C when done)'.grey);
		prompt.get(model(name), (err, results) => {
			if (err) reject(err);
			resolve(results[name]);
		});
	});