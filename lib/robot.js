require("sylvester");
var keyboards = require("./keyboards");
var method = Robot.prototype;
var motion = require("./motion");
var calibration = require("./calibration");

var steps = 15;
var delay = 400 / steps;
var child_exec;
function Robot(servo1, servo2, servo3, calibrationFile, k, config) {
    if (arguments.length == 0){
        HeadlessRobot();
        return;
    }
    this._servo1 = servo1;
    this._servo2 = servo2;
    this._servo3 = servo3;
    this._config = config;
    this._calibrationFile = calibrationFile;
    this._calibration = calibration.getDataFromFilePath(this._calibrationFile);
    this._dancer_interval = null;
    kinematics = k;
    this.resetPosition(); // Go to home position at initialization, otherwise robot will phyisically crash
}
function HeadlessRobot(){
    child_exec = require('child_process').exec;
}
function sqdist(p,x,y)
{
    //console.log("P"+p);
    return (p.screen.x-x)*(p.screen.x-x) + (p.screen.y-y)*(p.screen.y-y)
}

function better(v,d)
{
    for (var i=0; i < v.length; i++)
    {
        e = v[i];
        if (d <= sqdist(e,x,y)) 
            return true;
    }
    return false;
}
function almostAligned(rank)
{
    diffx1 = Math.abs(rank[0].position.x - rank[1].position.x);
    diffx2 = Math.abs(rank[1].position.x - rank[2].position.x);
    diffy1 = Math.abs(rank[0].position.y - rank[1].position.y);
    diffy2 = Math.abs(rank[1].position.y - rank[2].position.y);
    THRESHOLD = 0.5;
    return diffx1 < THRESHOLD && diffx2 < THRESHOLD || diffy1 < THRESHOLD && diffy2 < THRESHOLD;
}


function aligned(rank)
{
    return ( (rank[0].screen.x == rank[1].screen.x && rank[0].screen.x == rank[2].screen.x) ||
              (rank[0].screen.y == rank[1].screen.y && rank[0].screen.y == rank[2].screen.y) )
}
/*
    Given screen coordinates x and y, returns the three closest calibrated points to x and y.
    TODO: avoid that the three points are aligned (otherwise the interpolation matrix will not be invertible)
*/


function getBestCalibrationPoints(calibration,x,y)
{
    console.log("CALIB: "+calibration);
    if (calibration.pointArray.length < 3)
    {
        throw "At least three calibration points required. Calibration points found:"+calibration.pointArray.length;
    }
    //console.log("CA:",calibration.pointArray);
    calibration.pointArray.sort(function(a,b)
    {

        if (sqdist(a,x,y) > sqdist(b,x,y))
               return 1;
        if (sqdist(a,x,y) < sqdist(b,x,y))
               return -1;
        return 0; 
    });
    rank = [];
    for (j = 0; j < calibration.pointArray.length && rank.length < 3; j++)
    {
        p = calibration.pointArray[j];
        if (rank.length < 2)
            rank.push(p); 
        else
        {
            rank.push(p);
            //
            // Undoes third insertion if the three points are aligned.
            //
            //if(aligned(rank)){
            //
            // GB 2023-09-02: to avoid big precision problems avoid that the three points are nearly aligned
            //
            if (almostAligned(rank)) {
                console.log("skipping rank ",p);
                rank.pop();
            }
        } 
    }
    //console.log("INPUT:",x,y," RANK",rank);
    return rank;
}
/*
    NEW: gets closest 3 calibrated points and bilinearly interpolates among them.
    Returns translation matrix built with these thre chosen points
*/
var generateTranslationMatrix = function(calibration,x,y)
{
    console.log("A CALIB: "+calibration);
    rank = getBestCalibrationPoints(calibration,x,y);
    planeMatrix = $M([[rank[0].screen.x,rank[0].screen.y,1],
                      [rank[1].screen.x,rank[1].screen.y,1],
                      [rank[2].screen.x,rank[2].screen.y,1]]);
    //console.log("RANK",rank);
    return { matrix : planeMatrix, xvector : $M([rank[0].position.x,rank[1].position.x,rank[2].position.x]), 
                                   yvector : $M([rank[0].position.y,rank[1].position.y,rank[2].position.y]),
                                   zvector : $M([rank[0].position.z,rank[1].position.z,rank[2].position.z]),
                                   offset : $M([rank[0].position.x - rank[0].screen.x, rank[0].position.y - rank[0].screen.y]),
                                   closestPoint : rank[0] } ;
}


var oldGenerateTranslationMatrix = function(calibration,x,y) {

    if ("pointArray" in calibration && typeof x !== 'undefined' && typeof y !== 'undefined')
    {
        var minDist = -1;
        rank = [];
        //console.log("CA:",calibration.pointArray);
        for (j = 0; j < calibration.pointArray.length; j++)
        {
            //console.log("POINT:",calibration.pointArray[j]);
            p = calibration.pointArray[j];
            if (better(rank,x,y) || rank.length < 3)
            {
                
                if (rank.length > 0)
                {
                    for(i = 0; i < rank.length; i++)
                    {
                        if (sqdist(p,x,y) <= sqdist(rank[i],x,y) )
                        {   
                            rank.splice(i, 0, p);
                            //console.log("Adding ",p);
                            break;
                        }
                    }
                }
                else rank.push(p);
                if (rank.length > 3) 
                {
                    rank.pop();
                }
            }
        }
        //console.log("RANK",rank);
        p1 = rank[0];
        p2 = rank[1];
        p3 = rank[2];
    }
    else
    {
        p1 = calibration.p1;
        p2 = calibration.p2;
        p3 = calibration.p3;
    }
    
    var r1x = p1.position.x;
    var r1y = p1.position.y;
    var r2x = p2.position.x;
    var r2y = p2.position.y;
    var r3x = p3.position.x;
    var r3y = p3.position.y;
    

    var r1x = p1.position.x;
    var r1y = p1.position.y;
    var r2x = p2.position.x;
    var r2y = p2.position.y;
    var r3x = p3.position.x;
    var r3y = p3.position.y;

    var d1x = p1.screen.x;
    var d1y = p1.screen.y;
    var d2x = p2.screen.x;
    var d2y = p2.screen.y;
    var d3x = p3.screen.x;
    var d3y = p3.screen.y;

    var deviceXVector = $M([
        [(d3x - d1x) / (r3x - r1x)],
        [(d3y - d1y) / (r3x - r1x)]
    ]);
    var deviceYVector = $M([
        [(d2x - d1x) / (r2y - r1y)],
        [(d2y - d1y) / (r2y - r1y)]
    ]);
    var offset = $M([d1x - r1x, d1y - r1y]);
    var r2dMatrix = $M([
        [deviceXVector.elements[0], deviceYVector.elements[0]],
        [deviceXVector.elements[1], deviceYVector.elements[1]]
    ]);
    return { offset: offset, matrix: r2dMatrix };
};

var sin = function(degree) {
    return Math.sin(Math.PI * (degree / 180));
};

var cos = function(degree) {
    return Math.cos(Math.PI * (degree / 180));
};

var mapNumber = function(num, in_min, in_max, out_min, out_max) {
    return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

var rotate = function(x, y) {
    var theta = -60;
    var x1 = x * cos(theta) - y * sin(theta);
    var y1 = y * cos(theta) + x * sin(theta);
    return [x1, y1]
};

var reflect = function(x, y) {
    var theta = 0;
    var x1 = x;
    var y1 = x * sin(2 * theta) - y * cos(2 * theta);
    return [x1, y1]
};


method.getAngles = function() {
    console.log(testing);
    console.log(this._ciccio);
    return [this._servo1.last.degrees, this._servo2.last.degrees, this._servo3.last.degrees];
};

method.setAngles = function(t1, t2, t3) {

    // validate input values
    t1 = isNaN(t1) ? this._config.s1.min : t1;
    t2 = isNaN(t2) ? this._config.s2.min : t2;
    t3 = isNaN(t3) ? this._config.s3.min : t3;

    // apply boundaries to prevent breakin robot
    if (this._config.boundary_enabled) {
      newpos = this.getPositionForAngles(t1,t2,t3);
      if (newpos[0] < this._config.boundary_x.min) newpos[0] = this._config.boundary_x.min;
      if (newpos[0] > this._config.boundary_x.max) newpos[0] = this._config.boundary_x.max;
      if (newpos[1] < this._config.boundary_y.min) newpos[1] = this._config.boundary_y.min;
      if (newpos[1] > this._config.boundary_y.max) newpos[1] = this._config.boundary_y.max;
      if (newpos[2] < this._config.boundary_z.min) newpos[2] = this._config.boundary_z.min;
      if (newpos[2] > this._config.boundary_z.max) newpos[2] = this._config.boundary_z.max;
      var boundaries = this.getAnglesForPosition(newpos[0],newpos[1],newpos[2]);
      t1 = boundaries[0];
      t2 = boundaries[1];
      t3 = boundaries[2];
    }

    this._servo1.to(t1);
    this._servo2.to(t2);
    this._servo3.to(t3);

    update = {};
    update.angles = [t1, t2, t3];
    // update.position = [newpos[0],newpos[1],newpos[2]];
    update.position = this.getPosition();
    io.sockets.emit('update', update); // send updated info to web clients
};

method.getPosition = function() {
    var angles = this.getAngles();
    return this.getPositionForAngles(angles[0], angles[1], angles[2]);
};

method.setPosition = function(x, y, z) {
    var reflected = reflect(x, y);
    var rotated = rotate(reflected[0], reflected[1]);
    var angles = kinematics.inverse(rotated[0], rotated[1], z);
    var t1 = mapNumber(angles[1], 0, 90, this._config.s1.min, this._config.s1.max);
    var t2 = mapNumber(angles[2], 0, 90, this._config.s2.min, this._config.s2.max);
    var t3 = mapNumber(angles[3], 0, 90, this._config.s3.min, this._config.s3.max);
    this.setAngles(t1, t2, t3);
};

method.resetPosition = function() {
    console.log("HEIGHT!" +this._config.defaultHeight);
    this.setPosition(0, 0, this._config.defaultHeight);
};

method.getPositionForAngles = function(a1, a2, a3) {
    var t1 = mapNumber(a1, this._config.s1.min, this._config.s1.max, 0, 90);
    var t2 = mapNumber(a2, this._config.s2.min, this._config.s2.max, 0, 90);
    var t3 = mapNumber(a3, this._config.s3.min, this._config.s3.max, 0, 90);
    var position = kinematics.forward(t1, t2, t3);
    var reflected = reflect(position[1], position[2]);
    var rotated = rotate(reflected[0], reflected[1]);
    x = rotated[0] //parseInt(rotated[0].toFixed());
    y = rotated[1] // parseInt(rotated[1].toFixed());
    z = position[3] // parseInt(position[3].toFixed());
    return [x, y, z];
};

method.getAnglesForPosition = function(x, y, z) {

  var reflected = reflect(x, y);
  var rotated = rotate(reflected[0], reflected[1]);
  var angles = kinematics.inverse(rotated[0], rotated[1], z);
  var t1 = mapNumber(angles[1], 0, 90, this._config.s1.min, this._config.s1.max);
  var t2 = mapNumber(angles[2], 0, 90, this._config.s2.min, this._config.s2.max);
  var t3 = mapNumber(angles[3], 0, 90, this._config.s3.min, this._config.s3.max);

  return [t1,t2,t3];
  //  var angles = kinematics.inverse(x, y, z);
  //  return [angles[1], angles[2], angles[3]];
};

method.oldGetPositionForScreenCoordinates = function(x, y) {
    var calData = oldGenerateTranslationMatrix(this._calibration,x,y);
    var matrix = calData.matrix;
    var offset = calData.offset;
    console.log("M:",matrix,"O:",offset);
    var vector = $M([
        [x - offset.elements[0]],
        [y - offset.elements[1]]
    ]);
    var converted = matrix.inverse().multiply(vector);
    var newX = converted.elements[0];
    var newY = converted.elements[1];

    newX = parseInt(newX).toFixed();
    newY = parseInt(newY).toFixed();

    return { x: newX, y: newY };
};

method.getPositionForScreenCoordinates = function(x, y) {
    var calData = generateTranslationMatrix(this._calibration,x,y);
    //console.log("TM", calData);
    var matrix = calData.matrix;
    var xvector = calData.xvector;
    var yvector = calData.yvector;
    var zvector = calData.zvector;
    var offset = calData.offset;
    if (this._config.interpolatedMode)
    {
        console.log("CHOSEN CALIBRATION MATRIX:");
        console.dir(calData, { depth: null });
        var planeCoefficientsX = matrix.inverse().multiply(xvector);
        var planeCoefficientsY = matrix.inverse().multiply(yvector);
        var planeCoefficientsZ = matrix.inverse().multiply(zvector);
        var newX = $V([x,y,1]).dot(planeCoefficientsX);
        var newY = $V([x,y,1]).dot(planeCoefficientsY);
        var newZ = $V([x,y,1]).dot(planeCoefficientsZ);
    }
    else
    {
        newX = calData.closestPoint.position.x;
        newY = calData.closestPoint.position.y;
        newZ = calData.closestPoint.position.z;
    }
    // console.log("NX", newX);
    // console.log("NY", newY);
    // console.log("NZ", newZ);


    //newX = parseInt(newX).toFixed();
    //newY = parseInt(newY).toFixed();
    //newX = Math.round(newX);
    //newY = Math.round(newY);
    //newZ = Math.round(newZ);
    
    return { x: newX, y: newY, z : newZ };
};


method.getContactZ = function() {
    throw "getContactZ is DEPRECATED!";
    return Math.min(
        //   return 1.01 * Math.min(
        this._calibration.p1.position.z,
        this._calibration.p2.position.z,
        this._calibration.p3.position.z
    );
};

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
method.tap = async function(screenX,screenY){
    if(!global.headless){
        return this.physical_tap(screenX,screenY);
    }else{
        return this.headless_tap(screenX,screenY);
    }
}
method.swipe = async function(startX, startY, endX, endY){
    if(!global.headless){
        return this.physical_swipe(startX, startY, endX, endY);
    }else{
        return this.headless_swipe(startX, startY, endX, endY);
    }
}
method.physical_tap = async function(screenX, screenY) {
    this.wantedX = screenX;
    this.wantedY = screenY;
    console.log("wantedTouch: "+screenX+";"+screenY);
    var position = this.getPositionForScreenCoordinates(screenX, screenY);
    var touchZ = position.z;
    this.setPosition(position.x, position.y, touchZ * 0.97);
    await timeout(500);
    this.setPosition(position.x, position.y, touchZ);
    await timeout(500);
	//console.log("Moving at position "+position.x+" "+position.y+" "+position.z);
    this.setPosition(position.x, position.y, this._config.defaultHeight); // get up
    await timeout(500);
    return true;
};
method.headless_tap = async function(screenX, screenY) {
    console.log("wantedTouch: "+screenX+";"+screenY);
    var to_exec = 'adb shell input tap '+ screenX+" "+ screenY;
    console.log("Trying to exec: "+to_exec);
    child_exec(to_exec,
        function (error, stdout, stderr) {
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
                 console.log('exec error: ' + error);
            }
        });
    await timeout(700)
    return true;
}
method.physical_swipe = async function(startX, startY, endX, endY) {
    var startPosition = this.getPositionForScreenCoordinates(startX, startY);
    var endPosition = this.getPositionForScreenCoordinates(endX, endY);
    console.log("SWIPING:",startPosition,endPosition);
    this.setPosition(startPosition.x, startPosition.y, startPosition.z+5);
    await timeout(500);
    this.wantedX = startX;
    this.wantedY = startY;
    console.log("wantedSwipeStart: "+startX+";"+startY);
    z = Math.min(startPosition.z,endPosition.z);
    this.setPosition(startPosition.x, startPosition.y, startPosition.z);
    //await timeout(500);
    //this.setPosition(startPosition.x, startPosition.y, z);
    await timeout(800);
    this.wantedX = endX;
    this.wantedY = endY;
    console.log("wantedSwipeEnd: "+endX+";"+endY);
    this.setPosition(endPosition.x, endPosition.y, endPosition.z);
    await timeout(500);  
    this.resetPosition();
    console.log("Finished swipe")
    return true;
};
method.headless_swipe = async function(startX, startY, endX, endY) {
    console.log("wantedSwipeStart: "+startX+";"+startY);
    console.log("wantedSwipeEnd: "+endX+";"+endY);
    var to_exec = 'adb shell input swipe '+ startX+" "+ startY+" "+ endX+" "+ endY;
    console.log("Trying to exec: "+to_exec);
    child_exec(to_exec,
        function (error, stdout, stderr) {
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
                 console.log('exec error: ' + error);
            }
        });
    await timeout(1000)
    console.log("Finished swipe")
    return true;
};
method.sendKeys = function(keys, cb) {
    var keyboard = keyboards.getKeyboard("iPhone 6" /*this._calibration.name*/ );
    var keystrokeSequence = [];
    for (var keyIndex = 0; keyIndex < keys.length; keyIndex++) {
        keystrokeSequence = keystrokeSequence.concat(keyboard.getKeySequence(keys[keyIndex]));
    }
    var tapKey = function(keystrokes, cb) {
        if (keystrokes.length == 0) {
            return cb();
        } else {
            var currentKeyPosition = keystrokes.shift();
            // y tho
            // currentKeyPosition.x = currentKeyPosition.x * 1.18;
            // currentKeyPosition.y = currentKeyPosition.y * 1.27;
            console.log("tapping:" + JSON.stringify(currentKeyPosition));
            this.tap(currentKeyPosition.x, currentKeyPosition.y, function() {
                return tapKey(keystrokes, cb);
            });
        }
    }.bind(this);
    return tapKey(keystrokeSequence, cb);
};

method.startDancing = function() {
    var _dance = function() {
        var minAngle = 10;
        var maxAngle = 20;
        var range = maxAngle - minAngle;
        var t1 = parseInt((Math.random() * range) + minAngle, 10);
        var t2 = parseInt((Math.random() * range) + minAngle, 10);
        var t3 = parseInt((Math.random() * range) + minAngle, 10);
        this.setAngles(t1, t2, t3);
    }.bind(this);

    if (!this._dancer_interval) {
        this._dancer_interval = setInterval(_dance, 250);
    }
};

method.stopDancing = function() {
    if (this._dancer_interval) {
        clearInterval(this._dancer_interval);
        this._dancer_interval = null;
    }
};

method.getCalibrationData = function() {
    return this._calibration;
};

method.setCalibrationData = function(newData) {
    this._calibration = newData;

    data = {};
    data.calibration = newData;
    io.sockets.emit('info', data); // update all web clients
};

method.go = function(x, y, z, easeType) {
    var pointB = [x, y, z];

    if (easeType == "none") {
        this.setPosition(pointB[0], pointB[1], pointB[2]);
        return; //Ensures that it doesn't move twice
    } else if (!easeType)
        easeType = 'linear'; //If no easeType is specified, go with default

    //motion.move(current, pointB, steps, easeType, delay);
    current = this.getPosition();
    var points = motion.getPoints(current, pointB, steps, easeType);

    var _this = this;
    for (var i = 0; i < points.length; i++) {
        setTimeout(function(point) { _this.setPosition(point[0], point[1], point[2]) }, i * delay, points[i]);
    }
}

method.saveCalibration = function(cal)
{
    if (typeof(getInfo) === "function") {
        io.sockets.emit('info', getInfo());
    }

    fs.writeFile(this._calibrationFile, JSON.stringify(cal), function(err) {
        if (err) {
            console.log('Calibration data could not be saved: ' + err);
        } else {
            console.log('Calibration data saved to '+this._calibrationFile);
        }
    });

}
method.appendToCalibration = function(calPoint)
{    
    cal = this.getCalibrationData();
    console.log(cal);
    if (cal.pointArray.length > 0)
    {
        cal.pointArray.push(calPoint);
        this.setCalibrationData(cal);
        this.saveCalibration(cal);
    }
}

method.loadCalibration = function()
{
    this.setCalibrationData(calibration.getDataFromFilePath(this._calibrationFile));

}      

module.exports = {};
module.exports.Robot = Robot;
