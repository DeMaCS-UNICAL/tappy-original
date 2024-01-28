#! /usr/local/bin/node

// Load all Libraries and Config

var
    calibrationFile,
    mode = 'brainybot1',
    calibrationLib = require("./lib/calibration"),
    Robot = require("./lib/robot").Robot,
    kinematics = require("./lib/kinematics"),
    motion = require("./lib/motion");

for(i=2; i<process.argv.length; i++){
    val=process.argv[i];
    console.log(val);
    if(val.startsWith('--hardware'))
    {
        mode= val.split('=')[1];
    }
    else if(val.startsWith('--config'))
    {
        config= require(val.split('=')[1]);
        
    }
    else if(val.startsWith('--calib'))
    {
        calibrationFile= val.split('=')[1];
    }
    else
    {
        console.error("Unsupported option: "+val);
    }
}
if(mode=="headless")
{
    if(typeof config==='undefined')
    {
        config = require("./config_bot1");
    }
}
else if(mode=="brainybot1")
{
    if(typeof config==='undefined')
    {
        config = require("./config_bot1");
    }
    if(typeof calibrationFile==='undefined')
    {
        calibrationFile = "calibration_bot1.json";
    }
}
else if(mode=="brainybot2")
{
    if(typeof config==='undefined')
    {
        config = require("./config_bot2");
    }
    if(typeof calibrationFile==='undefined')
    {
        calibrationFile = "calibration_bot2.json";
    }
}
const Hapi = require('hapi');
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
var robot;
if(mode=="headless")
{
    global.headless=true;
    robot = new Robot(); // Initialize Robot instance 
    var rest = require('./lib/rest')(server, robot); // load REST API
    var listeners = require('./lib/listeners')(io, robot, config); // Lets Start socket Listeners  
}
else 
{
    
    if(mode=="brainybot1")
    {
        var five = require("johnny-five");
        var board = new five.Board({ debug: true, port: config.serialport || null });
        board.on("ready", function() {
            // Initialize servos
            var s1 = new five.Servo({ pin: config.s1.pin });
            var s2 = new five.Servo({ pin: config.s2.pin });
            var s3 = new five.Servo({ pin: config.s3.pin });
        
            // Load calibration data
            var calibrationData = calibrationLib.getDataFromFilePath(calibrationFile);
        
            // Initialize kinematics
            var k = new kinematics.Kinematics({
                e: config.e,
                f: config.f,
                re: config.re,
                rf: config.rf
            });
            
            robot = new Robot(s1, s2, s3, calibrationData, k, config); // Initialize Robot instance
            // var repl = require('./lib/repl')(board, robot); // Testing through command line
            
            var rest = require('./lib/rest')(server, robot); // load REST API
            var listeners = require('./lib/listeners')(io, robot, config); // Lets Start socket Listeners
        });
        robot = new Robot(s1, s2, s3, calibrationFile, k, config); // Initialize Robot instance
            // var repl = require('./lib/repl')(board, robot); // Testing through command line
        
        var rest = require('./lib/rest')(server, robot); // load REST API
        var listeners = require('./lib/listeners')(io, robot, config);
    }
    else if(mode=="brainybot2")
    {
        var Board = require("./lib/bb2linker/board");
        var Servo = require("./lib/bb2linker/servo");
        var board = new Board({ port: config.serialport || null , baudrate: config.baudrate});
        board.on("ready", function() {
            // Initialize servos
            var s1 = new Servo(board, { id: config.s1.pin });
            var s2 = new Servo(board, { id: config.s2.pin });
            var s3 = new Servo(board, { id: config.s3.pin });
        
            // Load calibration data
            var calibrationData = calibrationLib.getDataFromFilePath(calibrationFile);
        
            // Initialize kinematics
            var k = new kinematics.Kinematics({
                e: config.e,
                f: config.f,
                re: config.re,
                rf: config.rf
            });
            
            robot = new Robot(s1, s2, s3, calibrationData, k, config); // Initialize Robot instance
            // var repl = require('./lib/repl')(board, robot); // Testing through command line
            
            var rest = require('./lib/rest')(server, robot); // load REST API
            var listeners = require('./lib/listeners')(io, robot, config); // Lets Start socket Listeners
        });
    }
}
global.ip = "127.0.0.1";
