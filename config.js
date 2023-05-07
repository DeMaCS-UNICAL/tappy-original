var config = {}

config.port = 8000; // override HTTP port
// config.serialport = 'COM3' // override serial port

//
// All physical distances are in mm
//

// Side of end effector (lowermost triangle. See included .gif image)
config.e = 34.64101615137754; // Math.sqrt(3) * 10 * 2

// Side of top triangle (motor axis is in the middle of this triangle, see figure)
config.f = 110.85125168440814; // Math.sqrt(3) * 32 * 2

// Length of upper joint (distance from axis to parallelogram)
config.rf = 52.690131903421914; // Math.sqrt(52**2 + 8.5**2)

//Length of parallelogram joint [155 For tapster2; 179 for tapster2-plus]
config.re = 179; //130+21*2+7

// Default height depends on parallelogram joint length. You MUST have config.re > abs(defaultHeight)
config.defaultHeight = -165;

// Plane dimension for calibration. 20 for smaller phones; 25 for larger phones
// Decrease value if end effector goes past phone dimensions while calibrating
config.calWidth = 24;
config.calHeight = 36;
// Servo PIN configuration and calibration values
// min for 0 degree angle, max for 90 degree angle
config.s1 = { pin: 11, min: 10, max: 101 };
config.s2 = { pin: 9, min: 0, max: 98 };
config.s3 = { pin: 10, min: 13, max: 90 };

// Set boundries to prevent breaking robot
config.boundary_enabled = false;
config.boundary_x = { min: -40, max: 40 };
config.boundary_y = { min: -70, max: 70 };
config.boundary_z = { min: -195, max: -165 };


module.exports = config;
