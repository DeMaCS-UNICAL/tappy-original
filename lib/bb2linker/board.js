const SerialPort = require('serialport');
const ReadlineParser = require('@serialport/parser-readline');
const EventEmitter = require('events');

class Board extends EventEmitter{
    constructor(options){
        super();
        this.port = options.port;
        this.baudrate = options.baudrate;
        this.debug = options.debug || false;
        this.timeout = options.timeout || 5000;
        this.sp = null;
        this.parser = null;
        this.communicationInput = [];
        this.communicationOutput = [];
        this.actualTicket = 0;
        this.lastTicket = 0;
        this.connect();
    }

    startRead(){
      this.parser.on('data', (data) => {
        if(this.debug){
          console.log("<<< " + data);
        }
        this.communicationInput.push(data);
      });
    }

    startWrite(){
        setInterval(() => {
          if(this.communicationOutput.length > 0){
            let data = this.communicationOutput.shift();
            if (this.debug) {
              console.log(">>> " + data);
            }
            this.sp.write(data + "\n");
          }
        }, 30);
    }

    // legge una linea dalla seriale appena disponibile
    async readLine(id, ticket){
      let line;
      while(this.actualTicket < ticket){
        await new Promise((resolve) => {setTimeout(resolve, 10)});
      }
      line = this.communicationInput.shift();
      while (line == undefined){
        await new Promise((resolve) => {setTimeout(resolve, 10)});
        line = this.communicationInput.shift();
      } 
      this.actualTicket++;
      return line;
    }

    writeLine(data, readRequest = false){
      this.communicationOutput.push(data);
      if (readRequest) {
        let t = this.lastTicket; 
        this.lastTicket++; 
        return t;
      }
    }

    connect() {
      this.sp = new SerialPort(this.port, { baudRate: this.baudrate }); 

      // Imposta un timeout per la connessione
      let t = setTimeout(() => {
        if (!sp.isOpen) {
          this.sp.close(); // Chiudi la porta seriale se non è già aperta
        }
      }, this.timeout);
        
      // Gestisci la connessione riuscita
      this.sp.once('open', () => {
        clearTimeout(t); // Cancella il timeout
        this.parser = this.sp.pipe(new ReadlineParser.ReadlineParser());
        this.startRead();
        this.startWrite();
        this.emitEvent("connect", null);
        if (this.debug) {
          console.log("Connected to " + this.port + " at " + this.baudrate + " bauds");
        }
        this.emitEvent("ready", null);
      });
    }

    async isServoMoving(id){
      let t = this.writeLine("ISM " + id, true);
      if(await this.readLine(id, t) == "1"){
        return true;
      }
      return false;
    };

    async setServoPosition(id, position){
      let t = this.writeLine("SSP "+ id + " " + position, true);
      if (await this.readLine(id, t) == "OK"){
        return true;
      }
      return false;
    };

    async getServoPosition(id){
      let t = this.writeLine("GSP " + id, true);
      let pos = await this.readLine(id, t);
      return pos;
    };

    async getAllServoPosition(){
      let t = this.writeLine("GAP", true);
      let str = (await this.readLine(0, t)).trim();
      let pos = str.split(" ");
      return pos;
    }

    async setServoVelocity(id, speed){
      let t = this.writeLine("SPV "+ id + " " + speed, true);
      if (await this.readLine(id, t) == "OK"){
        return true;
      }
      return false;
    }

    async setAllServoPosition(positions){
      let data = "SAP";
      for (let i = 0; i < positions.length; i++){
        if(positions[i] == undefined){
          return;
        }
        data += " " + positions[i].toFixed(2);
      }
      let t = this.writeLine(data, true);
      if (await this.readLine(0, t) == "OK"){
        return true;
      }
      return false;
    }

    emitEvent(event, data){
      this.emit(event, data);
    }
}

module.exports = Board;