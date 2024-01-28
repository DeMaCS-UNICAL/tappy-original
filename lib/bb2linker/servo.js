class Servo{
    constructor(board, options){
        this.board = board;
        this.id = options.id;
        this.startAt = options.startAt || 90;
        this.range = options.range || [0, 180];
    }

    to(angle){
        if(angle < this.range[0] || angle > this.range[1]){
            throw new Error("Angle out of range");
        }
        this.board.setServoPosition(this.id, angle);
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
        this.board.setServoPosition(this.id, (this.range[1] - this.range[0]) / 2);
    }

    stop(){
        this.board.setServoPosition(this.id, this.last());
    }

    home(){
        this.board.setServoPosition(this.id, this.startAt);
    }

}

module.exports = Servo;