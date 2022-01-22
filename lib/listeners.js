/*
Robot methods available when board is ready:
getAngles() - returns current angles
setAngles(t1,t2,t3) - Sets angles
getPosition() - returns current position
resetPosition() - sets position to restpoint
getPositionForAngles(t1,t2,t3) - returns calculated position for given angles
getAnglesForPosition(x,y,z) - return calculated angles for given position
getPositionForscreen(x,y) - calculates position to reach given screen coordinates
getContactZ() - returns minimum Z index that reaches screen
tap(screenX, screenY, cb) - taps screen at given coordinates
swipe(startX, startY, endX, endY, cb) - swipes
sendKeys(keys, cb) - types keyboard keys
startDancing() - lets dance
stopDancing() - no dance
getCalibrationData() - returns calibration data
setCalibrationData(newData) - updates calibration data
*/

const { TIMEOUT } = require("dns");

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

exports = module.exports = function(io, robot, config, servo1, servo2, servo3) {

    fs = require("fs");

    var calibratingInProgress = false;
    var touched = false;
    var tX, tY; // last touched screen values

    function getInfo() {
        // nosūta info par serveri un konfigurāciju
        data = {};
        data.ip = ip;
        data.config = config;
        data.calibration = robot.getCalibrationData();
        // data.contactz = robot.getContactZ();
        return data;
    }

    var lowerAndCheckForContact = async function(x, y) {
        if (!calibratingInProgress) return;
        ret = {};
        touched = false;
        z = config.defaultHeight;
        while (!touched) {
            if (z < config.boundary_z.min) {
                console.log('Reached minimum height: '+config.boundary_z.min+', aborting calibration!');
                robot.resetPosition();
                ret.status = 0;
                return ret;
            } else {
                // process.stdout.write(" "+z);
                robot.setPosition(x, y, z);
                await timeout(25);
            }
            z = z - 1;
        } 
        // console.log('reached point 1: ' + robot.getPosition());
        ret.status = 1;
        ret.position = robot.getPosition();
        ret.position[2] += 2;
        ret.screen = [tX, tY];
        return ret;
    };



    var oldLowerAndCheckForContact = function(x, y, currentZ, cb) {
        if (!calibratingInProgress) return;
        ret = {};
        if (!touched) {
            z = z - 1;
            if (z < config.boundary_z.min) {
                console.log('Reached minimum height: '+config.boundary_z.min+', aborting calibration!');
                robot.resetPosition();
                ret.status = 0;
                cb(ret);
            } else {
                // process.stdout.write(" "+z);
                robot.setPosition(x, y, z);
                setTimeout(
                    function() {
                        return lowerAndCheckForContact(x, y, z, cb);
                    }, 25);
            }
        } else {
            // console.log('reached point 1: ' + robot.getPosition());
            ret.status = 1;
            ret.position = robot.getPosition();
            ret.position[2] += 2;
            ret.screen = [tX, tY];
            cb(ret);
        }
    };
    
    
    var scheduleSequence = function(seqArray)
    {
        eval(seqArray[0]);

    }
    
    //
    // GB Ianni 2022. Given x & y, tries to find exact x,y,z coordinates.
    //

    var findExactCalibrationForPoint = async function(x,y)
    {
        var approx = 5;
        var MAXATTEMPTS = 10;
        var position = robot.getPositionForScreenCoordinates(x, y);   
        var tracking = true;
        await lowerAndCheckForContact(position.x,position.y);
        [X,Y] = ret.screen;
        var attempts = 0;
        while (abs(X-x) < approx &&  abs(Y-y) < approx && attempts++ < MAXATTEMPTS)
        {
            x -= X - x; y -= Y - y; 
            ret = await lowerAndCheckForContact(position.x,position.y);
            [X,Y] = ret.screen;
        }
        if (attempts < MAXATTEMPTS)
            console.log("Found ",ret)
        else    
            console.log("FAILED POINT SEARCH");
    }

    /*
        GB Ianni Jan 2022: much nicer async version with no callback nightmare!
    */

    async function startMultipleCalibration() {

        if (calibratingInProgress) return;

        var cal = robot.getCalibrationData();
        var maxj = 8;
        var maxi = 4;
        cal.pointArray = [];
        startx = -config.calWidth+8;
        widthx = config.calWidth*2;
        widthy = config.calHeight*2;
        starty = -config.calHeight;
        x = startx;
        y = starty;
        z = config.defaultHeight;

        calibratingInProgress = true;
        touched = false;
        console.log('Starting calibration (Fail safe height: '+config.boundary_z.min+')');
        for (i = 0; i < maxi; i++)
        {
            for( j = 0; j < maxj; j++)
            {
                ret = await lowerAndCheckForContact(x, y, z);
                console.log('Calibrated point i='+i+' j='+j +" "+ JSON.stringify(ret));
                robot.resetPosition();
                if (!ret.status) return;
                p = { position : { "x":0, "y":0, "z":0 }, screen : { "x":0, "y":0}};
                p.position.x = ret.position[0];
                p.position.y = ret.position[1];
                p.position.z = ret.position[2];
                p.screen.x = ret.screen[0];
                p.screen.y = ret.screen[1];
                cal.pointArray.push(p);
                x = startx + i * widthx / (maxi-1);
                y = starty + j * widthy / (maxj-1);
                z = config.defaultHeight;
                touched = false;
                await timeout(500);
            }
        }
        console.log('Saving calibration data:' + JSON.stringify(cal))
        robot.setCalibrationData(cal);
        calibratingInProgress = false;
        saveCalibration(cal);
        return;
}
function saveCalibration(cal)
{
    io.sockets.emit('info', getInfo());

    fs.writeFile('calibration.json', JSON.stringify(cal), function(err) {
        if (err) {
            console.log('Calibration data could not be saved: ' + err);
        } else {
            console.log('Calibration data saved to "calibration.json"');
        }
    });

}                    
  


    function stopCalibration() {
        calibratingInProgress = false;
    }

    io.sockets.on('connection', function(socket) {

        console.log('New connection established');

        // nosūta klientam robota pozīciju
        update = {};
        update.angles = robot.getAngles();
        update.position = robot.getPosition();

        socket.emit('update', update);
        socket.emit('info', getInfo());

        socket.on('getInfo', function() {
            console.log('info requested. sending...')
            socket.emit('info', getInfo());
        });

        // When user navigates to /cal if isTouchDevice, sends screen resoluton, user agent.
        socket.on('calibrationDeviceConnected', function(data) {
            console.log('calibrationDeviceConnected' + data);
            socket.broadcast.emit('calibrationDeviceConnected', data);
        });

        socket.on('startCalibration', function() {
            console.log('startCalibration()');
            startCalibration();
        });

        socket.on('startMultipleCalibration', function() {
            console.log('startMultipleCalibration()');
            startMultipleCalibration();
        });


        socket.on('stopCalibration', function() {
            console.log('stopCalibration()');
            stopCalibration();
        });

        // Receive touch events from calibration page
        socket.on('calibrationTouch', function(data) {
            touched = true;
            tX = data.tX;
            tY = data.tY;
            console.log('calibrationTouch: ' + tX + ';' + tY);
        });

        // Receive device info
        socket.on('deviceInfo', function(data) {
            var cal = robot.getCalibrationData();
            cal.device = data;
            robot.setCalibrationData(cal);
            console.log('deviceInfo received: '+ JSON.stringify(data));
            // console.log('Saving calibration data:' + JSON.stringify(cal))
        });

        socket.on('moveServos', function(data) {
            robot.setAngles(data[0], data[1], data[2]);
        });

        socket.on('moveLinear', function(data) {
            robot.setPosition(data.x, data.y, data.z);
        });

        socket.on('moveScreen', function(data) {
            var position = robot.getPositionForScreenCoordinates(data.x, data.y);
            console.log('screen[' + [data.x, data.y, data.z] + '] => position[' + [position.x, position.y, data.z] + ']');
            robot.setPosition(position.x, position.y, data.z);
        });

        socket.on('tap', async function(data) {
            await robot.tap(data.x, data.y)
            console.log("finished tap");
        });


        socket.on('resetPosition', function(data) {
            robot.resetPosition();
        });
    });

}
