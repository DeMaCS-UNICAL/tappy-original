var config_robo = {}

config_robo.version = "v1"; // Version of the robot.

config_robo.port = 8000; // override HTTP port
// config_robo.serialport = 'COM3' // override serial port

//
// All physical distances are in mm
//

// Side of end effector (lowermost triangle. See included .gif image)
config_robo.e = 34.64101615137754; // Math.sqrt(3) * 10 * 2

// Side of top triangle (motor axis is in the middle of this triangle, see figure)
config_robo.f = 110.85125168440814; // Math.sqrt(3) * 32 * 2

// Length of upper joint (distance from axis to parallelogram)
config_robo.rf = 52.690131903421914; // Math.sqrt(52**2 + 8.5**2)

//Length of parallelogram joint [155 For tapster2; 179 for tapster2-plus]
config_robo.re = 179; //130+21*2+7

// Default height depends on parallelogram joint length. You MUST have config_robo.re > abs(defaultHeight)
config_robo.defaultHeight = -163;

// Servo PIN config_robouration and calibration values
// min for 0 degree angle, max for 90 degree angle
config_robo.s1 = { pin: 11, min: 10, max: 101, rangeMin: 0, rangeMax: 90};
config_robo.s2 = { pin: 9, min: 0, max: 98, rangeMin: 0, rangeMax: 90 };
config_robo.s3 = { pin: 10, min: 13, max: 90, rangeMin: 0, rangeMax: 90 };

// Set boundries to prevent breaking robot
config_robo.boundary_enabled = false;
config_robo.boundary_x = { min: -40, max: 40 };
config_robo.boundary_y = { min: -70, max: 70 };
config_robo.boundary_z = { min: -195, max: -165 };

//
// If true, x,y,z values are interpolated between calibration points
// If false, x,y,z values are rounded to nearest calibration point. NOTE: you need LOT of calibration points in non-interpolated mode
//
config_robo.interpolatedMode = true;

// Time between calibration points in ms
config_robo.timeBetweenCalibrationPoints = 30;

// Time between each z-step in ms
config_robo.timeBetweenZSteps = 30;

// Time between positioning and start getting contact in ms
config_robo.offsetBeforeStartGettingContactZ = 0;

// Time between touch and getting back to defaultHeight in ms
config_robo.timeToGoUpAfterTouch = 0;

// Time to go down from defaultHeight to touch in ms
config_robo.timeToGoDownBeforeTouch = 500;

// Time touching in ms
config_robo.timeTouching = 500;

// Tapping offset
config_robo.tapOffset = 1;

module.exports = config_robo;