// from: https://github.com/devalexqt/topparser

var topparser = require("topparser");

//start topparser
topparser.start();

//then data is available
topparser.on("data", (data) => {
	console.log(JSON.stringify(data, 0, 2));
});

//if some error happens
topparser.on("error", (error) => {
	console.log(error);
});

//if topparser exit
topparser.on("close", (code) => {
	console.log(code);
});

//kill topparser after 10 seconds, for example
// setTimeout(() => {
// 	topparser.stop();
// }, 10000);
