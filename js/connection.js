var bol = bol || {};
var socket;
var querying;

/**
 * This file adds the trackers
 */
bol.connectionHandler = (function() {

    var realtime = false;
    var connected = false;


    function init() {

        initConnection();

    }



    function initConnection(){
        console.log("initializing connection.");
        querying = false;

        var conn_options = {
            'sync disconnect on unload':false
        };

        if (typeof io !== "undefined") {
            socket = io.connect("http://dali.cs.kuleuven.be:8080", conn_options);
            //socket = io.connect("http://localhost:8000", conn_options);

            socket.on('connect', function(){
                connected = true;
            });

            socket.on('server_message', function(data) {
                $('#receiver').append('<li>' + JSON.stringify(data) + '</li>');
                if (data._id !== undefined) {
                    bol.controller.setTripID(data._id);
                }
                if (querying) {
                    console.log("test1");
                    var chartData = new google.visualization.DataTable();
                    chartData.addColumn('string', 'ID');
                    chartData.addColumn('number', 'Seconds');
                    var myDate = parseJsonDate(data[0].stopTime);
                    console.log(myDate);
                    console.log(myDate.getSeconds());
                    /*data.addRows([
                     ['Mushrooms', 3],
                     ['Onions', 1],
                     ['Olives', 1],
                     ['Zucchini', 1],
                     ['Pepperoni', 2]

                     ]);*/
                    for (i = 0; i < data.length; i++) {
                        var myId = data[i].startTime;
                        console.log(myId);
                        chartData.addRows(['myId',data[i].stopTime.getSeconds()-data[i].startTime.getSeconds()])
                    }
                    var options = {'title':'How Much Pizza I Ate Last Night',
                        'width':400,
                        'height':300};

                    // Instantiate and draw our chart, passing in some options.
                    var chart = new google.visualization.PieChart($("#chart_div")[0]);
                    chart.draw(chartData, options);
                }
            });

        } else {
            console.log("woops...");
            //no fallback
        }
    }

    function connect(){
        if (!connected){

            initConnection();

        }   else {

            socket.socket.reconnect();

            if (socket.socket.connected) {
                $('#receiver').append('<li>Welcome back.</li>');
            }
        }
    }

    function startTrip(){
        //let the server know that this client will send attention data
        if (!connected){alert('not connected!')}
        else {
            var authentication_data =
            {
                "purpose": "realtime-sender",
                "userID": "u0044250",
                "groupID": "assistants"
            };
            socket.emit('start', JSON.stringify(authentication_data));
        }
    }

    //via socket.io (with fallback)
    function emitTripData(data){
        if (!connected){alert('not connected!')}
        else {
            socket.emit("rt-sensordata",JSON.stringify(data));
            console.log(data);
        }
    }

    function emitData_disconnect() {
        if (!connected){alert('not connected!')}
        else {

            console.log("bye bye");
            socket.socket.emit('disconnect');
        }

    }

    function endTrip(data) {
        if (!connected){alert('not connected!')}
        else {

            socket.emit('endBikeTrip', JSON.stringify(data));
        }
    }

    function queryAll() {
        if (!connected){alert('not connected!')}
        else {

            socket.emit('trips');
            querying = true;
        }
    }


    //do something when the page unloads
    $(window).bind('unload', function(){

        //emitData();
        socket.disconnect();
    });


    return {
        init: init,
        disconnect: emitData_disconnect,
        connect: connect,
        sendTripData: emitTripData,
        endTrip: endTrip,
        startTrip: startTrip,
        queryAll: queryAll

    };


})();
function parseJsonDate(jsonDateString) {
    return new Date(parseInt(jsonDateString.replace('/Date(', '')));
}
