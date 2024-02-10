const SerialPort = require('serialport');
const ReadlineParser = require('@serialport/parser-readline');
const EventEmitter = require('events');
const { resolve } = require('path');

class Board extends EventEmitter{
    constructor(options){
        super();
        this.port = options.port;
        this.baudrate = options.baudrate;
        this.debug = options.debug || false;
        this.timeout = options.timeout || 5000;
        this.sp = null;
        this.parser = null;
        this.communicationStorage = [];
        this.actualTicket = 0;
        this.lastTicket = 0;
        this.connect();
    }

    startRead(){
      this.parser.on('data', (data) => {
        if(this.debug){
          console.log("<<< " + data);
        }
        this.communicationStorage.push(data);
      });
    }

    // legge una linea dalla seriale appena disponibile
    async readLine(id, ticket){
      let line;
      while(this.actualTicket < ticket){
        await new Promise((resolve) => {setTimeout(resolve, 10)});
      }
      line = this.communicationStorage.shift();
      while (line == undefined){
        await new Promise((resolve) => {setTimeout(resolve, 10)});
        line = this.communicationStorage.shift();
      } 
      this.actualTicket++;
      return line;
    }

    writeLine(data, readRequest = false){
      if (this.debug) {
        console.log(">>> " + data);
      }
      this.sp.write(data + "\n");
      if (readRequest) {
        let t = this.lastTicket; 
        this.lastTicket++; 
        return t;}
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
        this.emitEvent("connect", null);
        if (this.debug) {
          console.log("Connected to " + this.port + " at " + this.baudrate + " bauds");
        }
        this.emitEvent("ready", null);
      });
    }

    async isServoMoving(id){
      let t = this.writeLine("ISM " + id);
      if(await this.readLine(id, t) == "1"){
        return true;
      }
      return false;
    };

    setServoPosition(id, position){
      this.writeLine("SSP "+ id + " " + position);
    };

    async getServoPosition(id){
      let t = this.writeLine("GSP " + id);
      let pos = await this.readLine(id, t);
      return pos;
    };

    async getAllServoPosition(){
      let t = this.writeLine("GAP");
      let str = await this.readLine(0, t);
      console.log(str);
      let pos = str.split(" ");
      return pos;
    }

    setServoVelocity(id, speed){
      this.writeLine("SPV "+ id + " " + speed);
    }

    setAllServoPosition(positions){
      let data = "SAP";
      for (let i = 0; i < positions.length; i++){
        data += " " + positions[i];
      }
      this.writeLine(data);
    }

    emitEvent(event, data){
      this.emit(event, data);
    }
}

module.exports = Board;