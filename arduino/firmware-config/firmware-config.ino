#include <AltSoftSerial.h>
#include <DynamixelShield.h>

AltSoftSerial soft_serial;


const float DXL_PROTOCOL_VERSION = 2.0;

DynamixelShield dxl;

using namespace ControlTableItem;

void setup() {
  // START COMMUNICATION
  soft_serial.begin(57600);

  soft_serial.println("START CONFIGURATION");

  dxl.begin(57600);
  dxl.setPortProtocolVersion(DXL_PROTOCOL_VERSION);

  // CHECK SERVO
  for (int id = 1; id < 4; id++) {
    soft_serial.print("ID : ");
    soft_serial.print(id);
    if (dxl.ping(id)) {
      soft_serial.print(", Model Number: ");
      soft_serial.println(dxl.getModelNumber(id));
    } else {
      soft_serial.println(", NOT FOUND!");
    }
  }

  // SETTING SERVO
  for (i = 1; i < 4; i++) {
    dxl.torqueOff(i);
    dxl.setOperatingMode(i, OP_EXTENDED_POSITION);
    dxl.torqueOn(i);
  }

  soft_serial.println("READY");
}

void loop() {

}
