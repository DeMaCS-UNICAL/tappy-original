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
        this.communicationStorage = [];
        this.connect();
    }

    startRead(){
      this.parser.on('data', (data) => {
        this.communicationStorage.push(data);
      });
    }

    // legge una linea dalla seriale appena disponibile
    async readLine(){
      await new Promise(resolve => setTimeout(resolve, 1));
      while(this.communicationStorage.length == 0){
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      let line = this.communicationStorage.shift();
      if(this.debug){
        console.log("<<< " + line);
      }
      return line;
    }

    writeLine(data){
      if (this.debug) {
        console.log(">>> " + data);
      }
      return this.sp.write(data + "\n");
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

    isServoMoving(id){
      this.writeLine("ISM "+ id);
      if(this.readLine() == "1"){
        return true;
      }
      return false;
    };

    setServoPosition(id, position){
      this.writeLine("SSP "+ id + " " + position);
      if(this.readLine() != "OK"){
        return false;
      }
      return true;
    };

    getServoPosition(id){
      this.writeLine("GSP " + id);
      let pos = parseFloat(this.readLine());
      return pos;
    };

    emitEvent(event, data){
      this.emit(event, data);
    }
}

module.exports = Board;