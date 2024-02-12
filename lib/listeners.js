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
debugLayer = { 'FINE' : 1 };
	//this.debugLayer = { 'TBK':1, 'ALL':1, 'ADDRES':1, 'CLASS':1, 'GUI' : 1, 'XPT' : 1 };
debug = true;	
console.log("Executing listeners initialization code")
whichPage = "NONE";

	/**
	 * main logging function
	 * @param str  String to be printed
	 * @param level debugLayer triggering the printout. Will be printed only if level is in the currently active debugLayers 
	 */
	
	lLog = function(str, level) {
		if (!isNaN(level))
			str += " USING NUMBERS FOR DEBUG LEVELS IS DEPRECATED - ";
		else if (level.match(/PROF/))
			{
			   str = debug.getPace()  + "\n" + str;
			};

			if (debugLayer == level || debugLayer == "ALL" || 
            (debugLayer instanceof Object && debugLayer[level]) )
			    { console.log(level+"-",str); }
		
	};


const { TIMEOUT } = require("dns");
const { rootCertificates } = require("tls");

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

exports = module.exports = function(io, robot, config) {

    console.log("Export listeners initialization code")
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

    var tryToTouch = async function() {
        if (!calibratingInProgress) return;
        ret = {};
        touched = false;
        pos = await robot.getPosition();
        z = startz = pos[2];
        x = pos[0];
        y = pos[1];
        while (!touched) {
            if (z < config.boundary_z.min) {
                console.log('Reached minimum height: '+config.boundary_z.min+', aborting calibration!');
                robot.setPosition(x,y,startz);
                calibratingInProgress = false;
                ret.status = 0;
                return ret;
            } else {
                // process.stdout.write(" "+z);
                robot.setPosition(x, y, z);
                await timeout(2000);
            }
            z = z - 1;
        } 
        // console.log('reached point 1: ' + robot.getPosition());
        ret.status = 1;
        ret.position = await robot.getPosition();
        robot.setPosition(x,y,startz);
        ret.position[2] += 2;
        ret.screen = [tX, tY];
        return ret;
    };


    var lowerAndCheckForContact = async function(x, y) {
        if (!calibratingInProgress) return;
        ret = {};
        touched = false;
        var z = config.defaultHeight;
        console.log(x + " " + y)
        robot.setPosition(x, y, z);
        await timeout(config.offsetBeforeStartGettingContactZ);
        while (!touched) {
            if (z < config.boundary_z.min) {
                console.log('Reached minimum height: '+config.boundary_z.min+', aborting calibration!');
                robot.resetPosition();
                calibratingInProgress = false;
                ret.status = 0;
                return ret;
            } else {
                // process.stdout.write(" "+z);
                robot.setPosition(x, y, z);
                await timeout(config.timeBetweenZSteps);
            }
            z = z - 1;
        } 
        // console.log('reached point 1: ' + robot.getPosition());
        ret.status = 1;
        ret.position = await robot.getPosition();
        ret.position[2] += 2;
        ret.screen = [tX, tY];
        robot.setPosition(x,y,config.defaultHeight);
        await timeout(config.timeToGoUpAfterTouch);
        return ret;
    };



    var makePos = function(ret)
    {
        p = { position : { "x":0, "y":0, "z":0 }, screen : { "x":0, "y":0}};
        ret.screen.x = x;
        ret.screen.y = y;
        p.position.x = ret.position[0];
        p.position.y = ret.position[1];
        p.position.z = ret.position[2];
        p.screen.x = ret.screen[0];
        p.screen.y = ret.screen[1];
        return p;
    }
    

    //
    // GB Ianni 2022. Given screen x & y, tries to find exact x,y,z coordinates.
    //

    var findExactCalibrationForPoint = async function(x,y)
    {
        if (!calibratingInProgress)
            return;
        console.log("Tuned calibration for:",x,y);
        [ox,oy] = [x,y];
        var approx = 5;
        var MAXATTEMPTS = 20;
        var position = robot.getPositionForScreenCoordinates(x, y);   
        ret = await lowerAndCheckForContact(position.x,position.y);
        [X,Y] = ret.screen;
        var attempts = 0;
        while ( (Math.abs(X-x) > approx ||  Math.abs(Y-y) > approx) 
        //&& attempts++ < MAXATTEMPTS
        )
        {
            ox -= (X - x)/2; oy -= (Y - y)/2; 
            console.log("Trying:",ox,oy);
            position = robot.getPositionForScreenCoordinates(ox, oy); 
            ret = await lowerAndCheckForContact(position.x,position.y);
            [X,Y] = ret.screen;
            console.log("Obtained:",X,Y, "Delta:",Math.sqrt( (X-x)*(X-x)+(Y-y)*(Y-y) ));
        }
        robot.resetPosition();
        if (attempts < MAXATTEMPTS)
        {
            console.log("Found:",ret)
            ret.status = 1;
            return ret;
        }
        else { 
            console.log("FAILED POINT SEARCH");
            ret.status = 0;
            return ret;
        }
    }
    /*
        Fine tuned calibration for Candy Crush Saga Level 1
    */
    async function startTunedCalibration() 
    {
        if (calibratingInProgress) return;
        calibratingInProgress = true;
        gridHeight = 5;
        gridWidth = 5;
        cellSize = 110;
        startx = 270+55;
        starty = 590+55;
        calPoints = [];
        errorsMade = false;
        for (r = 0; r < gridHeight; r++)
        {
            for( c = 0; c < gridWidth; c++)
            {
                x = startx + c*cellSize;
                y = starty + r*cellSize;
                ret = await findExactCalibrationForPoint(x,y);
                if (ret.status == 1)
                {
                    p = makePos(ret);
                    calPoints.push(p);
                }
                else errorsMade = true;
            }
        }
        if (!errorsMade)
        {
            cal = robot.getCalibrationData();
            //console.log(cal);
            cal.pointArray = calPoints;
            robot.setCalibrationData(cal);
            robot.saveCalibration(cal);
        }
                
        calibratingInProgress = false;
    }
 

/*
       G. Ianni 2022. 3-points calibration.
    */
    async function startCalibration()
    {
        startMultipleCalibration();
        /*
        parametricCalibration( [ 
            [-config.calWidth+8,-config.calHeight],
            [-config.calWidth+8,config.calHeight],
            [config.calWidth,0],
            [config.calWidth,config.calHeight],
            [-config.calWidth+4,-config.calHeight] 
          ]
        );*/
    }
 
    async function parametricCalibration(calSamplingPoints) {

        if (calibratingInProgress) return;

        var cal = robot.getCalibrationData();
        cal.pointArray = [];
                    
        averageTries = 1;
        z = config.defaultHeight;

        calibratingInProgress = true;
        await timeout(200);
        touched = false;
        console.log('Starting calibration (Fail safe height: '+config.boundary_z.min+')');
        for (i = 0; i < calSamplingPoints.length; i++)
        {
                p = { position : { "x":0, "y":0, "z":0 }, screen : { "x":0, "y":0}};
                for (j = 0; j < averageTries; j++)
                {
                    touched = false;
                    ret = await lowerAndCheckForContact(calSamplingPoints[i][0], calSamplingPoints[i][1], z);
                    console.log('Calibration average n='+i+' tries='+(j+1) +" "+ JSON.stringify(ret));
                    if (!ret.status) return;
                    if (!calibratingInProgress) return;
                    p.position.x += ret.position[0];
                    p.position.y += ret.position[1];
                    p.position.z += ret.position[2];
                    p.screen.x += ret.screen[0];
                    p.screen.y += ret.screen[1];
                    touched = false;
                }
                p.position.x /= averageTries;
                p.position.y /= averageTries;
                p.position.z /= averageTries;
                p.screen.x /= averageTries;
                p.screen.y /= averageTries;
                cal.pointArray.push(p);
                await timeout(config.timeBetweenCalibrationPoints);
        }
        console.log('Saving calibration data:' + JSON.stringify(cal))
        robot.setCalibrationData(cal);
        calibratingInProgress = false;
        robot.saveCalibration(cal);
        testCalibrationPoints();
        return;
}
 
async function testCalibrationPoints()
{
    data = robot.getCalibrationData();
    tdata = [];
    //testArray = [ {x:400,y:400}, {x:500,y:500}, {x:700,y:700}, {x:800,y:800}, {x:400,y:500}, {x:500,y:600}, {x:700,y:800}, {x:800,y:900} ];
    //for (i = 0; i < data.pointArray.length; i++)
    //{   tdata.push(data.pointArray[i].screen);
    //}
    testArray = [];
    
    const N = 18;  // number of points
    const width = data.device.w;
    const height = data.device.h;
    const centerX = width / 2;
    const centerY = height / 2;
    let radius = 250;  // you can adjust this value based on the desired size of your circle

    for (let i = 0; i < N; i++) {
        let theta = 2 * Math.PI * i / N;
        let px = centerX + radius * Math.cos(theta);
        let py = centerY + radius * Math.sin(theta);
        testArray.push({ "x" : px, "y" : py });
    }

    radius = 400;

    for (let i = 0; i < N; i++) {
        let theta = 2 * Math.PI * i / N;
        let px = centerX + radius * Math.cos(theta);
        let py = centerY + radius * Math.sin(theta);
        testArray.push({ "x" : px, "y" : py });
    }


    // Adding the center of the circle to testArray
    testArray.push({ "x": centerX, "y": centerY });

     for (i = 0; i < testArray.length; i++)
    {   
        tdata.push(testArray[i]);
    }
    for (let i = 0; i < tdata.length; i++) {
        //console.log("Point: "+i+" "+JSON.stringify(tdata[i]));
        for (let j = 0; j < tdata.length; j++) {
            //console.log("\tPoint: "+j+" "+JSON.stringify(tdata[j]));
        }
        await robot.tap(tdata[i].x, tdata[i].y, function() {
            return getCommonResponseObject(null, '"OK"');
          });
        robot.resetPosition();
        await timeout(500);
    }
    

}

    async function startMultipleCalibration() {

        if (calibratingInProgress) return;

        var cal = robot.getCalibrationData();
        var maxj = config.pointOnWidth;
        var maxi = config.pointOnHeight;
        cal.pointArray = [];
        startx = -config.calWidth+6;
        starty = -config.calHeight-2;
        widthx = config.calWidth*2;
        widthy = config.calHeight*2+15;
        x = startx;
        y = starty;
        z = config.defaultHeight;
        calSamplingPoints = [];
        for (i = 0; i < maxi; i++)
        {
            for( j = 0; j < maxj; j++)
            {
                calSamplingPoints.push([x,y,z]);
                x = startx + i * widthx / (maxi-1);
                y = starty + j * widthy / (maxj-1);
                z = config.defaultHeight;
            }
        }
        console.log('Calibration points: '+calSamplingPoints.length);
        console.log(calSamplingPoints);
        parametricCalibration(calSamplingPoints);
}
 

    function stopCalibration() {
        calibratingInProgress = false;
    }

    io.sockets.on('connection', async function(socket) {

        console.log('New connection established');

        update = {};
        update.angles = await robot.getAngles();
        update.position = await robot.getPosition();

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
            startCalibration();
            //startMultipleCalibration();
        });

        socket.on('startMultipleCalibration', function() {
            console.log('startMultipleCalibration()');
            startMultipleCalibration();
        });

        socket.on('findCalPoint', function() {
            console.log('startTunedCalibration()');
            startTunedCalibration();
        });


        socket.on('stopCalibration', function() {
            stopCalibration();
        });

        // Receive touch events from calibration page
        socket.on('calibrationTouch', function(data) {
            touched = true;
            tX = data.tX;
            tY = data.tY;
            cal = robot.getCalibrationData();
            console.log('calibrationTouch: x:' + tX + ' - y:' + tY);
            /*console.log(
                'aX: ' + (Math.abs((robot.wantedX - tX) / cal.device.w) * 100).toFixed(2) + '% ' + 
                'aY: ' + (Math.abs((robot.wantedY - tY) / cal.device.h) * 100).toFixed(2) + '%'
            );*/
            
            whichPage = "CALIBRATION";
        });
        socket.on('addToCalibration', async function(data) 
        {
            whichPage = "CONTROL";
            console.log("ADD TO CALIBRATION:", data);
            calibratingInProgress = true;
            ret= await tryToTouch();
            calibratingInProgress = false;
            console.log("TOUCH RETURNS:", ret);
            if (ret.status != 0)
                robot.appendToCalibration(makePos(ret));            
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

        socket.on('changeSpeedServos', function(data) {
            robot.setSpeed(data);
        });

        socket.on('tap', async function(data) {
            console.log("received tap request");
            await robot.tap(data.x, data.y)
            console.log("finished tap");
        });

        socket.on('resetPosition', function(data) {
            robot.resetPosition();
        });

        socket.on('startDancing', function(data) {
            robot.startDancing();
        });

        socket.on('stopDancing', function(data) {
            robot.stopDancing();
        });
    });

}
