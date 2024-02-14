var app = angular.module('robotApp', ['rzModule']);

app.factory('socket', ['$rootScope', function($rootScope) {
    var socket = io.connect(null, { forceNew: true, 'multiplex': false });
    return {
        on: function(eventName, callback) {
            socket.on(eventName, callback);
        },
        emit: function(eventName, data) {
            socket.emit(eventName, data);
        }
    };
}]);

app.controller('IndexController', function($scope, socket) {

    $scope.runScript = function() {
        var data = document.getElementById("script").value;

        console.log("im work" + data);
        // eval(data);
        $scope.$eval(data);
    }

    $scope.conn = false;

    socket.on('connect', function() {
        console.log('connected');
        $scope.$apply(function() { $scope.conn = true });
    });
    
    socket.on('disconnect', function() {
        $scope.status = "disconnected";
        console.log('disconnected');
        $scope.$apply(function() { $scope.conn = false });
    });

    $scope.status = {};
    $scope.currentCustomer = {};
    $scope.calibrationDevice = {};

    $scope.moveServos = function() {
        socket.emit('moveServos', [
            $scope.slider1.value,
            $scope.slider2.value,
            $scope.slider3.value
        ]);
    };

    $scope.changeSpeedServos = function() {
        socket.emit('changeSpeedServos', $scope.sliderSpeed.value);
    }

    $scope.sliderSpeed = {
        value: 25,
        options: {
            floor: 1,
            ceil: 100,
            id: 'speed',
            onChange: function(value) {
                $scope.changeSpeedServos();
            },
        }
    }

    $scope.slider1 = {
        options: {
            vertical: true,
            rightToLeft: true,
            floor: 0,
            ceil: 120,
            id: '1',
            onChange: function(id, value) {
                // console.log('on change ' + value); // logs 'on change slider-id'
                // socket.emit('moveServos', { servo_id: id, value: value });
                $scope.moveServos();
                // socket.emit('moveServo', { servo_id: id, value: value });
            },
        }
    };

    $scope.slider2 = {
        options: {
            vertical: true,
            rightToLeft: true,
            floor: 0,
            ceil: 120,
            id: '2',
            onChange: function(id, value) {
                // console.log('on change ' + value); // logs 'on change slider-id'
                $scope.moveServos();
                // socket.emit('moveServo', { servo_id: id, value: value });
            },
        }
    };

    $scope.slider3 = {
        options: {
            vertical: true,
            rightToLeft: true,
            floor: 0,
            ceil: 120,
            id: '3',
            onChange: function(id, value) {
                // console.log('on change ' + value); // logs 'on change slider-id'
                // socket.emit('moveServo', { servo_id: id, value: value });
                $scope.moveServos();
            },
        }
    };

    $scope.sliderx = {
        value: 0,
        options: {
            rightToLeft: true,
            floor: -50,
            ceil: 50,
            id: 'x',
            onChange: function(id, value) {
                $scope.moveLinear();
            },
        }
    };
    $scope.slidery = {
        value: 0,
        options: {
            rightToLeft: true,
            floor: -100,
            ceil: 50,
            id: 'y',
            onChange: function(id, value) {
                $scope.moveLinear();
            },
        }
    };

    $scope.sliderz = {
        value: -130,
        options: {
            rightToLeft: true,
            floor: -235,
            ceil: -125,
            id: 'z',
            onChange: function(id, value) {
                $scope.moveLinear();
            },
        }
    };

    $scope.reset = function() {
        socket.emit('resetPosition');
        $scope.sliderx.value = 0;
        $scope.slidery.value = 0;
        $scope.sliderz.value = -130;

    };

    $scope.move_servo = function(data) {
        socket.emit('moveServo', data);
    };

    $scope.moveLinear = function() {
        x = $scope.sliderx.value;
        y = $scope.slidery.value;
        z = $scope.sliderz.value;

        socket.emit('moveLinear', { x: x, y: y, z: z });
    };

    $scope.tap = function(x, y) {
        socket.emit('tap', [x, y]);
    };

    socket.on('info', function(data) {
        $scope.$apply(function() {
            console.log(data);
            /* only apply if we received data */
            if (data.ip) $scope.ip = data.ip;
            if (data.config){
                $scope.config = data.config;
                $scope.v2 = data.config.version == "v2";

                $scope.slider1.options.floor = data.config.s1.min;
                $scope.slider1.options.ceil = data.config.s1.max;

                $scope.slider2.options.floor = data.config.s2.min;
                $scope.slider2.options.ceil = data.config.s2.max;

                $scope.slider3.options.floor = data.config.s3.min;
                $scope.slider3.options.ceil = data.config.s3.max;

                $scope.sliderx.options.floor = data.config.boundary_x.min;
                $scope.sliderx.options.ceil = data.config.boundary_x.max;

                $scope.slidery.options.floor = data.config.boundary_y.min;
                $scope.slidery.options.ceil = data.config.boundary_y.max;

                $scope.sliderz.options.floor = data.config.boundary_z.min;
                $scope.sliderz.options.ceil = data.config.boundary_z.max;

                $scope.slider1.options.rightToLeft = data.config.s1.min > data.config.s1.max;
                $scope.slider2.options.rightToLeft = data.config.s2.min > data.config.s2.max;
                $scope.slider3.options.rightToLeft = data.config.s3.min > data.config.s3.max;
                

            }
            if (data.calibration) $scope.calibration = data.calibration;
        });
    });


    socket.on('update', function(data) {
        console.log(data);
        $scope.$apply(function() {
            $scope.slider1.value = data.angles[0];
            $scope.slider2.value = data.angles[1];
            $scope.slider3.value = data.angles[2];
            $scope.sliderx.value = data.position[0];
            $scope.slidery.value = data.position[1];
            $scope.sliderz.value = data.position[2];
        });
    });

    socket.on('calibrationDeviceConnected', function(data) {
        $scope.$apply(function() {
            $scope.calibrationDevice = data;
        });
    });

    $scope.startCalibration = function() {
        socket.emit('startCalibration');
    };
    $scope.stopCalibration = function() {
        socket.emit('stopCalibration');
    };
   
    $scope.addToCalibration = function() {
        data = { "x" :  $scope.sliderx.value , 
                 "y" :  $scope.slidery.value ,
                 "z" :  $scope.sliderz.value };
        socket.emit('addToCalibration', data);
    };
    
    $scope.startDancing = function() {
        socket.emit('startDancing');
    }

    $scope.stopDancing = function() {
        socket.emit('stopDancing');
    }
});

function send(target, data) {
    $.ajax({
        type: "POST",
        url: target,
        data: data,
        success: success,
        dataType: dataType
    });
}