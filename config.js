var config = {}

config.port = 80; // override HTTP port
// config.serialport = 'COM3' // override serial port

// Side of end effector
config.e = 34.64101615137754; // Math.sqrt(3) * 10 * 2

// Side of top triangle
config.f = 110.85125168440814; // Math.sqrt(3) * 32 * 2

// Length of upper joint
config.rf = 52.690131903421914; // Math.sqrt(52**2 + 8.5**2)

//Length of parallelogram joint [155 For tapster2; 179 for tapster2-plus]
config.re = 179; //130+21*2+7

// Default height depends on parallelogram joint length
config.defaultHeight = -170;

// Plane dimension for calibration. 20 for smaller phones; 25 for larger phones
// Decrease value if end effector goes past phone dimensions while calibrating
config.calWidth = 24;

// Servo PIN configuration and calibration values
// min for 0 degree angle, max for 90 degree angle
config.s1 = { pin: 11, min: 10, max: 101 };
config.s2 = { pin: 9, min: 0, max: 98 };
config.s3 = { pin: 10, min: -3, max: 90 };

// Set boundries to prevent breaking robot
config.boundary_enabled = false;
config.boundary_x = { min: -40, max: 40 };
config.boundary_y = { min: -70, max: 70 };
config.boundary_z = { min: -195, max: -170 };


module.exports = config;
