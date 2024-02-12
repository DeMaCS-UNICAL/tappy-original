var config_robo = {}

config_robo.version = "v2"; // Version of the robot.

config_robo.port = 8000; // override HTTP port
config_robo.serialport = '/dev/ttyUSB0' // override serial port
config_robo.baudrate = 57600; // override baudrate

//
// All physical distances are in mm
//

// Side of end effector (lowermost triangle. See included .gif image)
config_robo.e = 85;

// Side of top triangle (motor axis is in the middle of this triangle, see figure)
config_robo.f = 165;

// Length of upper joint (distance from axis to parallelogram)
config_robo.rf = 70;

//Length of parallelogram joint [155 For tapster2; 179 for tapster2-plus]
config_robo.re = 250;

// Default height depends on parallelogram joint length. You MUST have config_robo.re > abs(defaultHeight)
config_robo.defaultHeight = -190;

// Servo PIN config_robouration and calibration values
// min for 0 degree angle, max for 90 degree angle
config_robo.s1 = { pin: 1, min: -45, max: 75, rangeMin: 45, rangeMax: -75};
config_robo.s2 = { pin: 2, min: -45, max: 75, rangeMin: 45, rangeMax: -75};
config_robo.s3 = { pin: 3, min: -45, max: 75, rangeMin: 45, rangeMax: -75};

// Set boundries to prevent breaking robot
config_robo.boundary_enabled = false;
config_robo.boundary_x = { min: -100, max: 100 };
config_robo.boundary_y = { min: -70, max: 70 };
config_robo.boundary_z = { min: -250, max: -150 };

//
// If true, x,y,z values are interpolated between calibration points
// If false, x,y,z values are rounded to nearest calibration point. NOTE: you need LOT of calibration points in non-interpolated mode
//
config_robo.interpolatedMode = true;

// Time between calibration points in ms
config_robo.timeBetweenCalibrationPoints = 100;

// Time between each z-step in ms
config_robo.timeBetweenZSteps = 100;

// Time between positioning and start getting contact in ms
config_robo.offsetBeforeStartGettingContactZ = 2000;

// Time between touch and getting back to defaultHeight in ms
config_robo.timeToGoUpAfterTouch = 500;

module.exports = config_robo;