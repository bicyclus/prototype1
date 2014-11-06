//Constanten
var PROG_STEPS = 5;
var BEGIN_PERCENT = 1.618;
var ANIM_TIME = 200;
var ELEV_SAMPLE = 128//2-512
var RETRY_COUNT = 50;


//Globals
var progressTrips; //Holds percentage for trips progressbar

function getAllTrips(){ //JSON van alle trips opvragen en naar functies doorgeven
    progressTrips = BEGIN_PERCENT;
    $('#tripProgress').show(ANIM_TIME);
    $('#tripProgressBar').animate({ width: progressTrips.toString()+'%' },ANIM_TIME);
    //Check data in box, set getUrl
    var getUrl = "http://dali.cs.kuleuven.be:8080/qbike/trips?";

    //UserFilter
    var userName = $("#inputUserName").val();
    var userFilter;
    if (userName==null || userName == ''){
        userFilter = '';
        $("#inputUserName").css('border-color','#ee5f5b');
    } else {
        userFilter = 'userID=' + userName;
        $("#inputUserName").css('border-color','#CCC');
    }

    //DateFilter
    var dates = $("#datepicker").val().split(" - ");
    var dateFilter;
    try {
        dates[0] = dates[0].replace(/(\d{2})-(\d{2})-(\d{4})/, "$2-$1-$3");
        dates[1] = dates[1].replace(/(\d{2})-(\d{2})-(\d{4})/, "$2-$1-$3");

        if ((Date.parse(dates[0])) && (Date.parse(dates[1]))) { //Check for valid dates
            dateFilter = '&fromDate=' + dates[0] + '&toDate=' + dates[1];
            $("#datepicker").css('border-color','#CCC');
        } else {
            dateFilter = '';
            $("#datepicker").css('border-color','#ee5f5b');
        }
    }
    catch(err){
        dateFilter = '';
        $("#datepicker").css('border-color','#ee5f5b');
    }

    $('#myReciever').empty();
    $('#chart_div').empty();
    $('#accel_div').empty();
    $('#map_div').empty();
    $('#elevation_chart').empty();
    $('#temp_div').empty();
    $.ajax({
        url: getUrl + userFilter + dateFilter,
        jsonp: "callback",
        dataType: "jsonp",
        success: function(response){
            //$('#myReciever').append('<pre>' + JSON.stringify(response, null, 2) + '</pre>');
            progressTrips = progressTrips + 100/PROG_STEPS-BEGIN_PERCENT;
            $('#tripProgressBar').animate({ width: progressTrips.toString()+'%' },ANIM_TIME);
            checkProgressTrips();
            $('#myReciever').append(JSON.stringify(response));
            progressTrips = progressTrips + 100/PROG_STEPS;
            $('#tripProgressBar').animate({ width: progressTrips.toString()+'%' },ANIM_TIME);
            checkProgressTrips();
            drawChart(response);
            drawAccel(response);
            createMap(response);
            getTemperature(response)
        }
    });
}

function drawChart(data) { //Elapsed time graph of all trips
    var dataArray = [['Number', 'Elapsed time']]; //Titels
    for (var i = 0; i < data.length; i++) {
        if (!(data[i].endTime === undefined) && !(data[i].startTime === undefined)) { //Endtime moet bestaan
            var elap = (new Date(data[i].endTime) - new Date(data[i].startTime))/1000;//Tijdsduur in seconds
            if (Math.abs(elap) < 1000){ //Negeren van uitschieters
                dataArray.push([i, elap]);//Data toevoegen op het einde van de array
            }
        }
    }
    var chartData = google.visualization.arrayToDataTable(dataArray);

    var options = {'title':'Elapsed Times over all trips',backgroundColor:'#f5f5f5'};

    // Instantiate and draw our chart, passing in some options.
    var chart = new google.visualization.LineChart($("#chart_div")[0]); //Chart aanmaken in div
    chart.draw(chartData, options); //Tekenen
    progressTrips = progressTrips + 100/PROG_STEPS;
    $('#tripProgressBar').animate({ width: progressTrips.toString()+'%' },ANIM_TIME);
    checkProgressTrips();
}

function drawAccel(data){
    var dataArray;
    var options;
    for (i = 0; i < data.length; i++) { //Iterate over all trips
        if (!(data[i].sensorData === undefined)) {
            dataArray  = [];
            for (a = 0; a < data[i].sensorData.length; a++) { //Iterate over all sensorData
                var accelData = data[i].sensorData[a];
                if ((accelData.sensorID == "5") && !(accelData.data === undefined)) {
                    try {
                        if (!(accelData.data[0].acceleration === undefined)) {
                            var timestampDate = new Date(accelData.timestamp);
                            dataArray.push([timestampDate,accelData.data[0].acceleration[0].x,accelData.data[0].acceleration[0].y,accelData.data[0].acceleration[0].z]);
                        }
                    }
                    catch(err){console.log(err)}
                }
            }
            if (dataArray.length > 0) {
                dataArray.sort(SortByTimestamp);
                options = {'title':'Accelerometer: '+data[i]._id,colors:['red','green','blue'],curveType:'function',backgroundColor:'#f5f5f5'};
                var chartData = new google.visualization.DataTable();
                chartData.addColumn('string', 'Time');
                chartData.addColumn('number', 'X');
                chartData.addColumn('number', 'Y');
                chartData.addColumn('number', 'Z');
                for (var b = 0; b < dataArray.length; b++) {
                    chartData.addRow(['', dataArray[b][1],dataArray[b][2],dataArray[b][3]]);
                }
                var draw_div = $('<div></div>');
                $("#accel_div").append(draw_div);

                var chart = new google.visualization.LineChart(draw_div[0]); //Chart aanmaken in div
                chart.draw(chartData, options); //Tekenen
            }
        }
    }
    progressTrips = progressTrips + 100/PROG_STEPS;
    $('#tripProgressBar').animate({ width: progressTrips.toString()+'%' },ANIM_TIME);
    checkProgressTrips();
}

function SortByTimestamp(a, b){ //Sorteren
    return ((a < b) ? -1 : ((a > b) ? 1 : 0));
}

function getTemperature(data){
    var tempArray;
    var options;

    for (i=0; i<data.length; i++){ // Iterate over all trips
        if (!(data[i].sensorData === undefined)){
            tempArray = [];
            for (a=0 ; a<data[i].sensorData.length; a++){
                var temp = data[i].sensorData[a];
                if ((temp.sensorID=="3")&& !(temp.data === undefined)){
                    var timestampDate = new Date(temp.timestamp);
                    console.log(timestampDate,temp.data[0]);
                    tempArray.push([timestampDate,temp.data[0].temperature]);
                    if (tempArray.length>0){
                        tempArray.sort(SortByTimestamp);
                        options={'title':'Temperature: '+data[i]._id,colors:['red'],curveType:'function',backgroundColor:'#f5f5f5'};
                        var chartData = new google.visualization.DataTable();
                        chartData.addColumn('string', 'Time');
                        chartData.addColumn('number', 'Temperature');
                        for (var b = 0; b < tempArray.length; b++){
                            chartData.addRow(['',tempArray[b][1]]);
                        }
                        var draw_temp_div = $('<div></div>');
                        $("#temp_div").append(draw_temp_div);
                        var chart = new google.visualization.LineChart(draw_temp_div[0]); //Chart aanmaken in div
                        chart.draw(chartData, options); //Tekenen

                   }
                }
            }
        }
    }




}


//TripMap class:
//- id
//- coords
//- marker
//- polyline

var map;
var infowindow;
var bikeLayer;
var elevator;
var tripMaps = []; //Array of objects
var retries = 0;

function createMap(data){
    var mapOptions = {
        zoom: 14,
        center: new google.maps.LatLng(50.863774, 4.678921) //Campus
    };
    map = new google.maps.Map($("#map_div")[0], mapOptions);
    bikeLayer = new google.maps.BicyclingLayer(); //Show bike paths
    bikeLayer.setMap(map);
    elevator = new google.maps.ElevationService();
    infowindow = new google.maps.InfoWindow();
    retries = 0;

    for (i = 0; i < data.length; i++) { //Iterate over all trips
        if (!(data[i].sensorData === undefined)) {
            tripMapObj = {id:data[i]._id, coords:[]}; //Create tripMap object
            for (a = 0; a < data[i].sensorData.length; a++) { //Iterate over all sensorData
                var gpsData = data[i].sensorData[a];
                if ((gpsData.sensorID == "1") && !(gpsData.data === undefined)) {
                    for (b = 0; b < gpsData.data.length; b++) { //Iterate over all data
                        try { //Probeer deze blok uit te voeren
                            var coord = new google.maps.LatLng(gpsData.data[b].coordinates[0], gpsData.data[b].coordinates[1]);
                            if (!(isNaN(coord.lat()) || isNaN(coord.lng()))) {
                                if (!coord.equals(tripMapObj.coords[tripMapObj.coords.length - 1])) {
                                    tripMapObj.coords.push(coord);
                                }
                            }
                        }
                        catch (err) { //Ga hier als het ergens in de try een error oproept.
                            tripMapObj.coords = [];
                        }
                    }
                }
            }
            if (tripMapObj.coords.length > 1) {
                tripMapObj.marker = new google.maps.Marker({ //Marker op begincoördinaat
                    position: tripMapObj.coords[0],
                    map: map,
                    title: tripMapObj.id
                });
                //Random kleur van ID
                var stringHexNumber = (parseInt(parseInt(tripMapObj.id, 36).toExponential().slice(2,-5), 10) & 0xFFFFFF).toString(16).toUpperCase(); //http://stackoverflow.com/questions/17845584/converting-a-random-string-into-a-hex-colour
                var pathOptions = {
                    path: tripMapObj.coords,
                    strokeColor: '#' + ('000000' + stringHexNumber).slice(-6), //Lengte aanpassen
                    opacity: 0.4,
                    map: map
                };
                tripMapObj.polyline = new google.maps.Polyline(pathOptions);
                tripMapObj.polyline.myId = data[i]._id;
                google.maps.event.addListener(tripMapObj.polyline, 'click', function (event) { //Infowindow bij klikken op polyline
                    infowindow.setPosition(event.latLng);
                    infowindow.setContent(this.myId);
                    infowindow.open(map);
                });
                tripMaps.push(tripMapObj);
                elev(tripMapObj.coords);
            }
        }
    }
}

function elev(pathCoords){ //Plot elevation graphs, attention: async
    var pathRequest = {
        'path': pathCoords,
        'samples': ELEV_SAMPLE
    }
    elevator.getElevationAlongPath(pathRequest,
        function(results, status) {
            if (status != google.maps.ElevationStatus.OK) { // google houdt request tegen
                console.log(status);
                if (status == google.maps.ElevationStatus.OVER_QUERY_LIMIT) { //Herproberen als we over de limiet zitten.
                    console.log("Retrying query of length: " + pathCoords.length + ". Try #" + retries);
                    if (retries < RETRY_COUNT) {
                        retries = retries + 1;
                        setTimeout(function(){elev(pathCoords);}, 1000+Math.floor((Math.random() * 500)));
                    } else {
                        retries = retries + 1;
                        if (retries = RETRY_COUNT) {
                            alert("Google elevation query error: Not all elevations  will be plotted.");
                        }
                        progressTrips = progressTrips + 100 / PROG_STEPS / tripMaps.length;
                        $('#tripProgressBar').animate({width: progressTrips.toString() + '%'}, ANIM_TIME);
                        checkProgressTrips();
                    }
                }
            } else {
                var elevations = results;
                var elevationPath = [];
                var data = new google.visualization.DataTable();
                data.addColumn('string', 'Sample');
                data.addColumn('number', 'Elevation');

                for (var i = 0; i < elevations.length; i++) {
                    elevationPath.push(elevations[i].location);
                    data.addRow(['', elevations[i].elevation]);
                }

                var tempTitle = '';
                for (var a = 0; a < tripMaps.length; a++) { //Find trip
                    if (tripMaps[a].coords.equals(pathCoords)){
                        tempTitle = tripMaps[a].id;
                        break;
                    }
                }

                //Chart
                var el_div = $('<div style="display: block"></div>');
                $("#elevation_chart").append(el_div);
                chart = new google.visualization.ColumnChart(el_div[0]);
                chart.draw(data, {
                    height: 150,
                    legend: 'none',
                    titleY: 'Elevation (m)',
                    title: tempTitle
                });
                progressTrips = progressTrips + 100 / PROG_STEPS / tripMaps.length;
                $('#tripProgressBar').animate({width: progressTrips.toString() + '%'}, ANIM_TIME);
                checkProgressTrips();
            }
        }
    );
}

function checkProgressTrips(){
    if (progressTrips >= 100) {
        $('#tripProgressBar').animate({ width: '100%' },0);
        $('#tripProgress').hide('blind',3*ANIM_TIME); //doet progressbar verdwijnen
    }
}

Array.prototype.equals = function (array) { //Compare full arrays
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;
        }
        else if (this[i] != array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
}