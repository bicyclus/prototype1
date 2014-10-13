var bol = bol || {};

/**
 * This file serves as the controller and depends on everything in the js folder
 */

bol.controller = (function() {

    var assets; //all our ajax-loaded assets (templates and json data)
    var realtime = false;
    var tripID;

    function init() {

       //init trackers
       //bol.connectionHandler.init();


       $("#connect")
            .click(function( event ) {
                event.preventDefault();
                bol.connectionHandler.connect();
            });

       $("#startTrip")
            .click(function( event ) {
                event.preventDefault();
                bol.connectionHandler.startTrip();
            });


        $("#sendTestData")
           .click(function( event ) {
               event.preventDefault();
               bol.controller.sendTripData();
           });

        $("#endTrip")
            .click(function( event ) {
                event.preventDefault();
                bol.controller.endTrip();
            });

        $("#queryAll")
            .click(function( event ) {
                event.preventDefault();
                bol.controller.queryAll();
            });

        $("#clearMessages")
            .click(function( event ) {
                event.preventDefault();
                $('#receiver').empty();
            });

    }

    // Example sensor data: array of sensor readings (cfr. wiki how to encode which sensors)
    var tripSensorDataArray = [

        {
            "sensorID": 0, //eg nb of breaks
            "timestamp": (new Date()).getTime(), //time of this sensor update
            "data": [
                {   "nbOfBreakHits":8,
                    "breaks":[(new Date()).getTime(), (new Date()).getTime(),(new Date()).getTime()]
                }]
        },
        {
            "sensorID": 1, //eg gps
            "timestamp": (new Date()).getTime(), //time of the update
            "data": [ //geoJSON - see http://geojson.org/
                { "type": "MultiPoint",
                    "coordinates": [ [100.0, 0.0], [101.0, 1.0] ]
                }
            ]
        }

    ]

    // Example sensor data: array of sensor readings (cfr. wiki how to encode which sensors)
    var tripSensorDataArray2 = [

        {
            "sensorID": 1, //eg gps
            "timestamp": (new Date()).getTime(), //time of the update
            "data": [ //geoJSON - see http://geojson.org/
                { "type": "MultiPoint",
                    "coordinates": [ [100.0, 4.0], [101.0, 4.0] ]
                }
            ]
        }

    ]

    function issueQuery(){
        bol.connectionHandler.queryAll();
        console.log("querying");
    }

    function setTripID(id){
        tripID = id;
    }

    function sendTripData(){

        var data = {"_id":tripID, "sensorData": tripSensorDataArray2 };
        bol.connectionHandler.sendTripData(data);
        console.log("sending data");
    }

    function endTrip(){

        var metadata =
        {
            distance: 5000,
            averageSpeed: 15.6,
            maxSpeed: 23.0,
            other: [{comment: "awesome trip!"}]
        }

        var data = {"_id":tripID, "meta": metadata }
        bol.connectionHandler.endTrip(data);
        console.log("sending end trip data");
    }



    return {
        init: init,
        setTripID: setTripID,
        sendTripData: sendTripData,
        endTrip: endTrip,
        queryAll: issueQuery
    };

})();

$(document).ready(bol.controller.init);
