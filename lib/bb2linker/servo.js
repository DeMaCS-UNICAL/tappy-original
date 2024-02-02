const { re } = require("../../config_bot2");

class Servo{

    constructor(board, options){
        this.board = board;
        this.id = options.id;
        this.startAt = options.startAt || 20;
        this.range = options.range || [-60, 60];
    }

    angleToRaw(angle){
        return angle;
    }

    rawToAngle(raw){
        return raw;
    }
    
    to(angle, raw = false){
        if(!raw)
            angle = this.angleToRaw(angle);
            console.log("To: "+angle)
        
            if(angle < this.range[0] || angle > this.range[1]){
            console.log("Angle out of range - " + angle);
            return false;
        }
        return this.board.setServoPosition(this.id, angle);
    }

    last(raw = false){
        if(raw)
            return this.board.getServoPosition(this.id);
        else
            return this.rawToAngle(this.board.getServoPosition(this.id));
    }

    min(){
        this.board.setServoPosition(this.id, this.range[0]);
    }

    max(){
        this.board.setServoPosition(this.id, this.range[1]);
    }

    center(){
        this.board.setServoPosition(this.id, (this.range[1] - this.range[0])/2);
    }

    stop(){
        this.board.setServoPosition(this.id, this.last(true));
    }

    home(){
        this.board.setServoPosition(this.id, this.startAt);
    }

}

module.exports = Servo;