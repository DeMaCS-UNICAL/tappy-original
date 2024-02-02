var config = {}

config.port = 8000; // override HTTP port
config.serialport = '/dev/ttyUSB0' // override serial port
config.baudrate = 9600; // override baudrate

//
// All physical distances are in mm
//

// Side of end effector (lowermost triangle. See included .gif image)
config.e = 85;

// Side of top triangle (motor axis is in the middle of this triangle, see figure)
config.f = 165;

// Length of upper joint (distance from axis to parallelogram)
config.rf = 70;

//Length of parallelogram joint [155 For tapster2; 179 for tapster2-plus]
config.re = 250;

// Default height depends on parallelogram joint length. You MUST have config.re > abs(defaultHeight)
config.defaultHeight = -200;

// Plane dimension for calibration. 20 for smaller phones; 25 for larger phones
// Decrease value if end effector goes past phone dimensions while calibrating

// P10 Lite values:
config.calWidth = 26;
config.calHeight = 38;
// Servo PIN configuration and calibration values
// min for 0 degree angle, max for 90 degree angle
config.s1 = { pin: 1, min: -45, max: 75, rangeMin:-75, rangeMax: 45};
config.s2 = { pin: 2, min: -45, max: 75, rangeMin: -75, rangeMax: 45};
config.s3 = { pin: 3, min: -45, max: 75, rangeMin: -75, rangeMax: 45};

// Set boundries to prevent breaking robot
config.boundary_enabled = false;
config.boundary_x = { min: -100, max: 150 };
config.boundary_y = { min: -70, max: 70 };
config.boundary_z = { min: -260, max: -165 };

//
// If true, x,y,z values are interpolated between calibration points
// If false, x,y,z values are rounded to nearest calibration point. NOTE: you need LOT of calibration points in non-interpolated mode
//
config.interpolatedMode = true;

module.exports = config;