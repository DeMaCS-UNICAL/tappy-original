#include <AltSoftSerial.h>
#include <DynamixelShield.h>

AltSoftSerial soft_serial;

#define BUFFER_SIZE 32

const float DXL_PROTOCOL_VERSION = 2.0;

DynamixelShield dxl;

uint8_t i = 0;
uint8_t bufferIndex = 0;
uint8_t id = 0;
char inputBuffer[BUFFER_SIZE];

using namespace ControlTableItem;

void setup() {
  // START COMMUNICATION
  soft_serial.begin(57600);

  dxl.begin(57600);

  // SETTING SERVO
  for (i = 1; i < 4; i++) {
    dxl.torqueOff(i);
    dxl.writeControlTableItem(PROFILE_ACCELERATION, i, 100);
    dxl.writeControlTableItem(PROFILE_VELOCITY, i, 70);
    dxl.torqueOn(i);
  }
}

void compute() {
  if(strncmp(inputBuffer, "SAP", 3) == 0){
    char* offsetPos = inputBuffer + 4;
    float value1 = atof(offsetPos);
    offsetPos = strchr(offsetPos + 1, ' ');
    float value2 = atof(offsetPos);
    offsetPos = strchr(offsetPos + 1, ' ');
    float value3 = atof(offsetPos);

    dxl.setGoalPosition(1, value1, UNIT_DEGREE);
    dxl.setGoalPosition(2, value2, UNIT_DEGREE);
    dxl.setGoalPosition(3, value3, UNIT_DEGREE);

    soft_serial.println("OK");
    return;
    
  } else if(strncmp(inputBuffer, "GAP", 3) == 0){
    soft_serial.println(
      String(dxl.getPresentPosition(1, UNIT_DEGREE)) + " " + 
      String(dxl.getPresentPosition(2, UNIT_DEGREE)) + " " + 
      String(dxl.getPresentPosition(3, UNIT_DEGREE))
      );
    return;
     
  } else if (strncmp(inputBuffer, "SSP", 3) == 0) {
    id = inputBuffer[4] - '0';
    float value = atof(inputBuffer + 6);
    dxl.setGoalPosition(id, value, UNIT_DEGREE);

    soft_serial.println("OK");
    return;
    
  } else if (strncmp(inputBuffer, "GSP", 3) == 0) {
    id = inputBuffer[4] - '0';
    soft_serial.println(dxl.getPresentPosition(id, UNIT_DEGREE));
    return;
    
  } else if (strncmp(inputBuffer, "ISM", 3) == 0) {
    id = inputBuffer[4] - '0';
    soft_serial.println(dxl.readControlTableItem(MOVING, id));
    return;
    
  } else if (strncmp(inputBuffer, "SPV", 3) == 0) {
    id = inputBuffer[4] - '0';
    uint8_t value = atoi(inputBuffer + 6); 
    dxl.writeControlTableItem(PROFILE_VELOCITY, id, value);

    soft_serial.println("OK");
    return;
    
  } else if (strncmp(inputBuffer, "GPV", 3) == 0) {
    id = inputBuffer[4] - '0';
    soft_serial.println(dxl.readControlTableItem(PROFILE_VELOCITY, id));
    return;
  }

  soft_serial.println("ERR");
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
