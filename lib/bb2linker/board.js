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
        this.connect();
    }

    async readLine(){
      return await this.parser.read();
    }

    async writeLine(data){
      return await this.sp.write(data + "\n");
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
        this.emitEvent("connect", null);
        let startingString = "CONNECTED";
        console.log(this.parser.read());
        /*
        while(startingString != "READY")
        {
          console.log(startingString);
          startingString = this.readLine();
        }*/
        this.emitEvent("ready", null);
      });
    }

    isServoMoving(id){
      this.writeLine("ISM "+ id);
      if(this.readLine() == 1){
        return true;
      }
      return false;
    };

    setServoPosition(id, position){
      this.writeLine("SSP "+ id + " " + position);
    };

    getServoPosition(id){
      this.writeLine("GSP "+ id);
      return this.readLine();
    };

    emitEvent(event, data){
      this.emit(event, data);
    }
}

module.exports = Board;