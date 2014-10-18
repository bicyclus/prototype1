function getAllTrips(){ //JSON van alle trips opvragen en naar drawChart doorgeven
    //Check data in box, set getUrl
    var getUrl = "http://dali.cs.kuleuven.be:8080/qbike/trips/";

    var dates = $("#datepicker").val().split(" - ");
    try {
        dates[0] = dates[0].replace(/(\d{2})-(\d{2})-(\d{4})/, "$2-$1-$3");
        dates[1] = dates[1].replace(/(\d{2})-(\d{2})-(\d{4})/, "$2-$1-$3");
        if ((Date.parse(dates[0])) && (Date.parse(dates[1]))) { //Check for valid dates
            getUrl = getUrl + '?fromDate=' + dates[0] + '&toDate=' + dates[1];
            $("#datepicker").css('border-color','#222222');
        } else {
            $("#datepicker").css('border-color','#ee5f5b');
        }
    }
    catch(err){
        $("#datepicker").css('border-color','#ee5f5b');
    }

    $('#myReciever').empty();
    $.ajax({
        url: getUrl,
        jsonp: "callback",
        dataType: "jsonp",
        success: function(response){
            $('#myReciever').append('<pre>' + JSON.stringify(response, null, 2) + '</pre>');
            drawChart(response);
            drawAccel(response);
        }
    });
}

function drawChart(data) {
    var dataArray = [['Number', 'Elapsed time']]; //Titels
    for (i = 0; i < data.length; i++) {
        if (!(data[i].endTime === undefined) && !(data[i].startTime === undefined)) { //Endtime moet bestaan
            var elap = (new Date(data[i].endTime) - new Date(data[i].startTime))/1000;//In seconds
            if (Math.abs(elap) < 1000){ //Fuck uitschieters
                dataArray.push([i, elap]);//Data toevoegen op het einde van de array
            }
        }
    }
    var chartData = google.visualization.arrayToDataTable(dataArray);

    var options = {'title':'Elapsed Times over all trips',backgroundColor:'#f5f5f5'};

    // Instantiate and draw our chart, passing in some options.
    var chart = new google.visualization.LineChart($("#chart_div")[0]); //Chart aanmaken in div
    chart.draw(chartData, options); //Tekenen
}

function drawAccel(data){

    var dataArray = [];

    for (i = 0; i < data.length; i++) { //Iterate over all trips
        if (!(data[i].sensorData === undefined)) {
            for (a = 0; a < data[i].sensorData.length; a++) { //Iterate over all sensorData
                var accelData = data[i].sensorData[a];
                if ((accelData.sensorID == "5") && !(accelData.data === undefined)) {
                    for (b = 0; b < accelData.data.length; b++) { //Iterate over all data
                        var completedata = accelData.data[b].coordinates;
                        var timestampDate = new Date(accelData.timestamp);
                        if (timestampDate.getDate() == 13) {
                            completedata.unshift(timestampDate);
                            dataArray.push(completedata);
                        }
                    }
                }
            }
        }
    }
    dataArray.sort(SortByTimestamp);
    dataArray.unshift(['Time', 'X', 'Y', 'Z']); //Titels
    var chartData = google.visualization.arrayToDataTable(dataArray);

    var options = {'title':'X Y Z',colors:['red','green','blue'],curveType: 'function',backgroundColor:'#f5f5f5'};

    var chart = new google.visualization.LineChart($("#accel_div")[0]); //Chart aanmaken in div
    chart.draw(chartData, options); //Tekenen
}

function SortByTimestamp(a, b){
    return ((a < b) ? -1 : ((a > b) ? 1 : 0));
}

function plotGPSmap(){
    $.ajax({
        url: "http://dali.cs.kuleuven.be:8080/qbike/trips/?userID=r0453111",
        jsonp: "callback",
        dataType: "jsonp",
        success: function(response){
            $('#myReciever').append('<pre>' + JSON.stringify(response, null, 2) + '</pre>');
            createMap(response);
        }
    });
}

var map;

function createMap(data){
    var mapOptions = {
        zoom: 3,
        center: new google.maps.LatLng(0, -180),
        mapTypeId: google.maps.MapTypeId.TERRAIN
    };

    map = new google.maps.Map($("#map_div")[0], mapOptions);
    var pathCoords = [];

    for (i = 0; i < data.length; i++) { //Iterate over all trips
        if (!(data[i].sensorData === undefined)) {
            for (a = 0; a < data[i].sensorData.length; a++) { //Iterate over all sensorData
                var gpsData = data[i].sensorData[a];
                if ((gpsData.sensorID == "1") && !(gpsData.data === undefined)) {
                    for (b = 0; b < gpsData.data.length; b++) { //Iterate over all data
                        pathCoords.push(new google.maps.LatLng(gpsData.data[b].coordinates[0],gpsData.data[b].coordinates[1]));
                    }
                }
            }
        }
    }

    elevator = new google.maps.ElevationService();

    var pathRequest = {
        'path': pathCoords,
        'samples': 512
    }

    // Initiate the path request.
    elevator.getElevationAlongPath(pathRequest, plotElevation);

    var flightPath = new google.maps.Polyline({
        path: pathCoords,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
    });

    flightPath.setMap(map);
}

function plotElevation(results, status) {
    if (status != google.maps.ElevationStatus.OK) {
        return;
    }
    var elevations = results;

    // Extract the elevation samples from the returned results
    // and store them in an array of LatLngs.
    var elevationPath = [];
    for (var i = 0; i < results.length; i++) {
        elevationPath.push(elevations[i].location);
    }

    // Display a polyline of the elevation path.
    var pathOptions = {
        path: elevationPath,
        strokeColor: '#0000CC',
        opacity: 0.4,
        map: map
    }
    polyline = new google.maps.Polyline(pathOptions);

    // Extract the data from which to populate the chart.
    // Because the samples are equidistant, the 'Sample'
    // column here does double duty as distance along the
    // X axis.
    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Sample');
    data.addColumn('number', 'Elevation');
    for (var i = 0; i < results.length; i++) {
        data.addRow(['', elevations[i].elevation]);
    }

    chart = new google.visualization.ColumnChart($('#elevation_chart')[0]);
    $('#elevation_chart').css('display','block');

    chart.draw(data, {
        height: 150,
        legend: 'none',
        titleY: 'Elevation (m)'
    });
}