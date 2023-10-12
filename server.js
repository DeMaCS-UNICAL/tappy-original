#! /usr/local/bin/node

// Load all Libraries and Config
var
    config = require("./config"),
    mode = 'brainybot1',
    five = require("johnny-five"),
    calibration = require("./lib/calibration"),
    Robot = require("./lib/robot").Robot,
    kinematics = require("./lib/kinematics"),
    motion = require("./lib/motion");

for(i=2; i<process.argv.length; i++){
    val=process.argv[i];
    console.log(val);
    if(val.startsWith('--hardware'))
    {
        mode= val.split('=')[1];
        break;
    }
    else
    {
        console.error("Unsupported option: "+val);
    }
}
const Hapi = require('hapi');

// Initialize HTTP Server
const server = Hapi.server({
	    port: config.port,
});

const init = async () => {
    await server.register(require('inert'));

	    server.route({
		            method: 'GET',
		            path: '/{param*}',
		            handler: {
				                directory: {
							                path: 'web',
							                index: true,
							                listing: true,
							                defaultExtension: 'html'
							            }
				            },
		            config: {
				                cache: {
							                expiresIn: 1 // prevent HTML caching
							            }
				            }
		        });


	    await server.start();
	    console.log(`Server running at: ${server.info.uri}`);
};
init();
// Initialize Socket.IO and make globally available
global.io = require('socket.io')(server.listener);
let serverImpl;

if(mode=="headless"){
    global.headless=true;
    var robot = new Robot(); // Initialize Robot instance
        // var repl = require('./lib/repl')(board, robot); // Testing through command line
    var rest = require('./lib/rest')(server, robot); // load REST API
    var listeners = require('./lib/listeners')(io, robot, config); // Lets Start socket Listeners
    global.ip = "127.0.0.1";
}
else if(mode=="brainybot1"){
    var board = new five.Board({ debug: true, port: config.serialport || null });
    board.on("ready", function() {
    
        // Initialize servos
        var s1 = new five.Servo({ pin: config.s1.pin });
        var s2 = new five.Servo({ pin: config.s2.pin });
        var s3 = new five.Servo({ pin: config.s3.pin });
    
        // Load calibration data
        var calibrationData = calibration.getDataFromFilePath('calibration.json');
    
        // Initialize kinematics
        var k = new kinematics.Kinematics({
            e: config.e,
            f: config.f,
            re: config.re,
            rf: config.rf
        });
    
        var robot = new Robot(s1, s2, s3, calibrationData, k, config); // Initialize Robot instance
        // var repl = require('./lib/repl')(board, robot); // Testing through command line
        var rest = require('./lib/rest')(server, robot); // load REST API
        var listeners = require('./lib/listeners')(io, robot, config); // Lets Start socket Listeners
        //server.start(); // And Finally Start HTTP server
    
            global.ip = "127.0.0.1";
            console.log('Board ready');
    
    });
}
else if(mode=="brainybot2"){

}