class Servo{

    constructor(board, options){
        this.board = board;
        this.id = options.id;
        this.startAt = options.startAt || 20;
        this.range = options.range || [-90, 75];
    }


    to(angle, raw = false){
        if(!raw)
            angle = -angle + 60;
        if(angle < this.range[0] || angle > this.range[1]){
            console.log("Angle out of range" + angle);
            return false;
        }
        return this.board.setServoPosition(this.id, angle);
    }

    last(){
        return this.board.getServoPosition(this.id);
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
        this.board.setServoPosition(this.id, this.last());
    }

    home(){
        this.board.setServoPosition(this.id, this.startAt);
    }

}

module.exports = Servo;