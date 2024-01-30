#include <AltSoftSerial.h>
#include <DynamixelShield.h>

AltSoftSerial soft_serial;

#define BUFFER_SIZE 32

const float DXL_PROTOCOL_VERSION = 2.0;

DynamixelShield dxl;

uint8_t i = 0;
uint8_t bufferIndex = 0;
char inputBuffer[BUFFER_SIZE];

using namespace ControlTableItem;

void setup() {
  // START COMMUNICATION
  soft_serial.begin(57600);

  //soft_serial.println("START CONFIGURATION");

  dxl.begin(57600);
  dxl.setPortProtocolVersion(DXL_PROTOCOL_VERSION);

  /*
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
  */

  // SETTING SERVO
  for (i = 1; i < 4; i++) {
    dxl.torqueOff(i);
    dxl.setOperatingMode(i, OP_EXTENDED_POSITION);
    //dxl.writeControlTableItem(PROFILE_ACCELERATION, i, 0);
    dxl.writeControlTableItem(PROFILE_VELOCITY, i, 5);
    dxl.torqueOn(i);
  }

  //soft_serial.println("READY");
}

void isServoMoving(uint8_t id) {
  if(id > 3 || id < 1){
    soft_serial.println("BAD VALUE");
    return;
  }
  soft_serial.println(dxl.readControlTableItem(MOVING, id));
}

void getServoPosition(uint8_t id) {
  if(id > 3 || id < 1){
    soft_serial.println("BAD VALUE");
    return;
  }
  soft_serial.println(String(dxl.getPresentPosition(id, UNIT_DEGREE)));
}

void setServoPosition(uint8_t id, float value) {
  if (id > 3 || id < 1) {
    soft_serial.println("BAD VALUE");
    return;
  }
  else{
    soft_serial.println("OK");
    dxl.setGoalPosition(id, value, UNIT_DEGREE);
  }
}

void compute() {
  char* pos;

  pos = strstr(inputBuffer, "SSP");
  if (pos) {
    uint8_t id = inputBuffer[4] - '0';
    float value = atof(inputBuffer + 6);
    setServoPosition(id, value);
    return;
  }
  
  pos = strstr(inputBuffer, "ISM");
  if (pos) {
    uint8_t id = inputBuffer[4] - '0';
    isServoMoving(id);
    return;
  }
  
  pos = strstr(inputBuffer, "GSP");
  if (pos) {
    uint8_t id = inputBuffer[4] - '0';
    getServoPosition(id);
    return;
  }

  soft_serial.println("BAD COMMAND");
  return;
}

void loop() {
  while (soft_serial.available()) {
    char c = soft_serial.read();
    // Se abbiamo raggiunto un carattere di fine linea o il buffer è pieno
    if (c == '\n' || bufferIndex == BUFFER_SIZE - 1) {
      inputBuffer[bufferIndex++] = '\0';
      compute();
      bufferIndex = 0;
    } else /*if (isprint(c))*/ {
      inputBuffer[bufferIndex++] = toupper(c);
    }
  }
}
