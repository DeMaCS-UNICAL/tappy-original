class Servo{

    constructor(board, options){
        this.board = board;
        this.id = options.id;
        this.startAt = options.startAt || 20;
        this.range = options.range || [10, 120];
        console.log(this.last());
    }

    // Angolo a angolo reale del servo
    conversion(angle){
        return 40 - angle;
    }

    // Angolo reale del servo a angolo
    inverseConversion(angle){
        return 40 - angle;
    }

    to(angle){
        if(angle < this.range[0] || angle > this.range[1]){
            //throw new Error("Angle out of range");
            console.log("Angle out of range" + angle);
        }
        this.board.setServoPosition(this.id, this.conversion(angle));
    }

    last(){
        return this.inverseConversion(this.board.getServoPosition(this.id));
    }

    min(){
        this.board.setServoPosition(this.id, this.conversion(this.range[0]));
    }

    max(){
        this.board.setServoPosition(this.id, this.conversion(this.range[1]));
    }

    center(){
        this.board.setServoPosition(this.id, this.conversion((this.range[1] - this.range[0]) / 2));
    }

    stop(){
        this.board.setServoPosition(this.id, this.inverseConversion(this.last()));
    }

    home(){
        this.board.setServoPosition(this.id, this.conversion(this.startAt));
    }

}

module.exports = Servo;