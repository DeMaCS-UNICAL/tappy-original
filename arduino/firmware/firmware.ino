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
  soft_serial.begin(9600);

  dxl.begin(57600);

  // SETTING SERVO
  for (i = 1; i < 4; i++) {
    dxl.torqueOff(i);
    dxl.writeControlTableItem(PROFILE_ACCELERATION, i, 100);
    dxl.writeControlTableItem(PROFILE_VELOCITY, i, 15);
    dxl.torqueOn(i);
  }
}

void compute() {
  uint8_t id = inputBuffer[4] - '0';

  if (strncmp(inputBuffer, "SSP", 3) == 0) {
    float value = atof(inputBuffer + 6);
    dxl.setGoalPosition(id, value, UNIT_DEGREE);
  } else if (strncmp(inputBuffer, "GSP", 3) == 0) {
    soft_serial.println(dxl.getPresentPosition(id, UNIT_DEGREE));
  } else if (strncmp(inputBuffer, "ISM", 3) == 0) {
    soft_serial.println(dxl.readControlTableItem(MOVING, id));
  } else if (strncmp(inputBuffer, "SPV", 3) == 0) {
    uint8_t value = atoi(inputBuffer + 6); 
    dxl.writeControlTableItem(PROFILE_VELOCITY, id, value);
  }
}

void loop() {
  while (soft_serial.available()) {
    char c = soft_serial.read();
    // Se abbiamo raggiunto un carattere di fine linea o il buffer è pieno
    if (c == '\n' || bufferIndex == BUFFER_SIZE - 1) {
      inputBuffer[bufferIndex++] = '\0';
      compute();
      bufferIndex = 0;
    } else{
      inputBuffer[bufferIndex++] = toupper(c);
    }
  }
}
