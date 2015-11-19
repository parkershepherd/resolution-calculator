// jshint ignore: start
"use strict";

let colors = require('colors');
let ask = require('./ask');
let numberList = require('./models/number-list');
let async = require('asyncawait/async');
let await = require('asyncawait/await');
let _ = require('lodash');


let fovCutoffs = {
	min: 27,
	idealMin: 35, idealMessage: 'THX recommendation (35+)',
	overkillMin: 60, overkillMessage: 'IMAX minimum (60+)',
}


let ppdCutoffs = {
	min: 75,
	idealMin: 100, idealMessage: 'iPhone 6+ at 15"',
	overkillMin: 160, overkillMessage: 'Human eye theoretical limit (120-170)',
}


let getInputs = async (() => {
	let sizes = await (ask('What screen sizes are you considering? (inches) (55, 60, 70)', 'Screen Size', numberList));
	let resolutions = await (ask('What resolutions are you considering? (pixels) (720, 1080, 2160)', 'Resolution', numberList));
	let distances = await (ask('How close might you sit from your TV? (feet) (8, 10, 12)', 'Distance', numberList));
	if (sizes.length === 0 || resolutions.length === 0 || distances.length === 0) {
		console.log('All fields are required'.red);
		process.exit(1);
	}
	return {sizes, resolutions, distances};
	// return {sizes:[60, 70, 80], resolutions:[1080, 2160], distances:[8, 10]}
});


let getAllCombinations = (sizes, resolutions, distances) => {
	let configurations = [];
	for (let size of sizes) {
		for (let resolution of resolutions) {
			for (let distance of distances) {
				configurations.push({ size, resolution, distance, name: `${size}" ${resolution}p @${distance}'`});
			}
		}
	}
	return configurations;
}


let calculateStats = configurations => {
	configurations.forEach(configuration => {
		let horizontalMultiplier = configuration.size/Math.sqrt(16*16 + 9*9);
		let verticalToHorizontal = 16/9;
		let width = horizontalMultiplier * 16;
		let horizontalResolution = verticalToHorizontal * configuration.resolution;
		let fov = Math.atan( (width/2) / (configuration.distance*12) )*2 * 180/Math.PI;
		let angularResolution = 2*(configuration.distance*12)*(horizontalResolution/width) * Math.tan(0.5 * Math.PI/180);
		_.assign(configuration, {
			fov,
			angRes: angularResolution,
		})
	});
}

let toFixed = (number, digits) => 
	String(Math.round(number * Math.pow(10, digits)) / Math.pow(10, digits))


let padString = (message, wantedLength) => {
	if (message.length < wantedLength) {
		let difference = wantedLength-message.length;
		for (let i=0; i<difference; i++) {
			message += ' ';
		}
	}
	return message;
}


let calculateCategories = configurations => {
	for (let tv of configurations) {
		let fovColor = tv.fov < fovCutoffs.min ? 'red' :
									 tv.fov < fovCutoffs.idealMin ? 'yellow' : // Just under THX recommendation
									 tv.fov < fovCutoffs.overkillMin ? 'green' :
									 'magenta';

		let angResColor = tv.angRes < ppdCutoffs.min ? 'red' :
											tv.angRes < ppdCutoffs.idealMin ? 'yellow' : // Iphone 4 or better
											tv.angRes < ppdCutoffs.overkillMin ? 'green': // Iphone 6+ or better
											'magenta';

		let scores = ['red', 'yellow', 'green', 'magenta'];
		let score = _(scores).indexOf(fovColor) + _(scores).indexOf(angResColor);
		_.assign(tv, { fovColor, angResColor, score});
	}
}


let printResults = configurations => {
	calculateCategories(configurations);
	let maxNameSize = 0;
	let maxFovSize = 0;
	let maxPpdSize = 0;
	_(configurations).forEach(tv => {
		maxNameSize = Math.max(maxNameSize, tv.name.length);
		maxFovSize = Math.max(maxFovSize, toFixed(tv.fov, 2).length);
		maxPpdSize = Math.max(maxPpdSize, toFixed(tv.angRes, 2).length);
	}).value();



	console.log();
	let nameCol = padString('TV Setup', maxNameSize).green;
	// console.log('nameCol', 'TV Setup', 'TV Setup'.length, nameCol, nameCol.length, maxNameSize)
	let fovCol = padString('FOV', maxFovSize).green;
	let ppdCol = padString('PPD', maxPpdSize).green;
	let dash = `-`.grey;
	console.log(`${nameCol}   ${fovCol}    ${ppdCol}`);
	_(configurations)
	.sortBy('score')
	.reverse()
	.forEach(tv => {
		let name = padString(tv.name, maxNameSize).cyan;
		let fov = `${padString(toFixed(tv.fov, 2), maxFovSize)}°`[tv.fovColor];
		let ppd = `${padString(toFixed(tv.angRes, 2), maxPpdSize)} pix/°`[tv.angResColor];
		console.log(`${name} ${dash} ${fov} ${dash} ${ppd}`);
	}).value();
};


let printInputSummary = (sizes, resolutions, distances) => {
	console.log();
	console.log('Calculating stats for:'.cyan);
	console.log(`  Sizes: ${sizes.join()}`.grey);
	console.log(`  Resolutions: ${resolutions.join()}`.grey);
	console.log(`  Distances: ${distances.join()}`.grey);
}


let explainMeasurements = () => {
	console.log();
	console.log('The stats that actually matter when buying a TV'.cyan);
	console.log('FOV (°): '.green + 'How big the screen feels.');
	console.log(' → THX recommends 35°+'.grey);
	console.log(' → IMAX is 60°+ depending on seating'.grey);
	console.log(' → Keep in mind you can sit closer for games, etc'.grey);
	console.log('PPD (pix/°): '.green + 'How sharp the image is.');
	console.log(' → 1080p 24" monitor at 3\' is 60 pix/°'.grey);
	console.log(' → iPhone 6+ at 15" is 104 pix/°'.grey);
	console.log(' → Theoretical human eye limit is 120 - 171 pix/°'.grey);
	console.log('Colors:'.green);
	console.log(' → '.grey + 'bad, '.red + 'okay, '.yellow + 'good, '.green + 'overkill'.magenta);
	console.log('FOV cutoffs'.green);
	console.log(` → ${fovCutoffs.idealMessage} `.grey + `(${fovCutoffs.idealMin}) or better`.green);
	console.log(` → ${fovCutoffs.overkillMessage} `.grey + `(${fovCutoffs.overkillMin}) or better`.magenta);
	console.log('PPD cutoffs'.green);
	console.log(` → ${ppdCutoffs.idealMessage} `.grey + `(${ppdCutoffs.idealMin}) or better`.green);
	console.log(` → ${ppdCutoffs.overkillMessage} `.grey + `(${ppdCutoffs.overkillMin}) or better`.magenta);
}


async (function() {
	console.log(`A few questions before we can calculate the perfect TV for you`);
	let inputs = await (getInputs());
	printInputSummary(inputs.sizes, inputs.resolutions, inputs.distances);
	let configurations = getAllCombinations(inputs.sizes, inputs.resolutions, inputs.distances);
	calculateStats(configurations);
	explainMeasurements();
	printResults(configurations);
})();