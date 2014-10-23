function getAllTrips(){ //JSON van alle trips opvragen en naar drawChart doorgeven
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
    $.ajax({
        url: getUrl + userFilter + dateFilter,
        jsonp: "callback",
        dataType: "jsonp",
        success: function(response){
            //$('#myReciever').append('<pre>' + JSON.stringify(response, null, 2) + '</pre>');
            $('#myReciever').append(JSON.stringify(response));
            drawChart(response);
            drawAccel(response);
            createMap(response);
        }
    });
}

function drawChart(data) {
    var dataArray = [['Number', 'Elapsed time']]; //Titels
    for (i = 0; i < data.length; i++) {
        if (!(data[i].endTime === undefined) && !(data[i].startTime === undefined)) { //Endtime moet bestaan
            var elap = (new Date(data[i].endTime) - new Date(data[i].startTime))/1000;//In seconds
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
                    for (b = 0; b < accelData.data.length; b++) { //Iterate over all data
                        if (!(accelData.data[b].coordinates === undefined) && (accelData.data[b].coordinates.length == 3)){
                            var completedata = accelData.data[b].coordinates;
                            var timestampDate = new Date(accelData.timestamp);

                            completedata.unshift(timestampDate);
                            dataArray.push(completedata);
                            //Nieuw formaat
//                        try {
//                            if (!(accelData.data[b].acceleration === undefined)) {
//                                dataArray.push(accelData.data[b].acceleration);
//                            }
//                        }
//                        catch(err){}
                        }
                    }
                }
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
            for (var i = 0; i < dataArray.length; i++) {
                chartData.addRow(['', dataArray[i][1],dataArray[i][2],dataArray[i][3]]);
            }
            var draw_div = $('<div></div>');
            $("#accel_div").append(draw_div);

            var chart = new google.visualization.LineChart(draw_div[0]); //Chart aanmaken in div
            chart.draw(chartData, options); //Tekenen
        }
    }
}

function SortByTimestamp(a, b){
    return ((a < b) ? -1 : ((a > b) ? 1 : 0));
}

var map;

function createMap(data){
    var mapOptions = {
        zoom: 3,
        center: new google.maps.LatLng(0, -180)
    };
    var markers = [];
    map = new google.maps.Map($("#map_div")[0], mapOptions);
    var pathCoords;
    elevator = new google.maps.ElevationService();
    for (i = 0; i < data.length; i++) { //Iterate over all trips
        if (!(data[i].sensorData === undefined)) {
            pathCoords = [];
            for (a = 0; a < data[i].sensorData.length; a++) { //Iterate over all sensorData
                var gpsData = data[i].sensorData[a];
                if ((gpsData.sensorID == "1") && !(gpsData.data === undefined)) {
                    for (b = 0; b < gpsData.data.length; b++) { //Iterate over all data
                        try {
                            pathCoords.push(new google.maps.LatLng(gpsData.data[b].coordinates[0], gpsData.data[b].coordinates[1]));
                        }
                        catch(err){
                            pathCoords = [];
                        }
                        if (pathCoords.length > 1){
                            //Elevator + Lineplot
//                            var pathRequest = {
//                                'path': pathCoords,
//                                'samples': 128
//                            }
                            //Teveel trips met gps data, google: OVER_QUERY_LIMIT
//                            elevator.getElevationAlongPath(pathRequest, plotElevation);
                            //Plotten dan maar..

                            markers.push(new google.maps.Marker({
                                position: pathCoords[0],
                                map: map,
                                title:data[i]._id
                            }));

                            var pathOptions = {
                                path: pathCoords,
                                strokeColor: '#0000CC',
                                opacity: 0.4,
                                map: map
                            }
                            polyline = new google.maps.Polyline(pathOptions);

                            var infowindow = new google.maps.InfoWindow({
                                content:data[i]._id
                            });

                            google.maps.event.addListener(polyline, 'click', function(event) {
                                infowindow.setPosition(event.latLng);
                                infowindow.open(map);
                            });
                        }
                    }
                }
            }
        }
    }
}

function plotElevation(results, status) {
    if (status != google.maps.ElevationStatus.OK) {
        console.log(status);
        return;
    }
    var elevations = results;
    var elevationPath = [];
    for (var i = 0; i < results.length; i++) {
        elevationPath.push(elevations[i].location);
    }

    var pathOptions = {
        path: elevationPath,
        strokeColor: '#0000CC',
        opacity: 0.4,
        map: map
    }
    polyline = new google.maps.Polyline(pathOptions);

    var infowindow = new google.maps.InfoWindow({
        content:"Trip 1"
    });

    google.maps.event.addListener(polyline, 'click', function(event) {
        infowindow.setPosition(event.latLng);
        infowindow.open(map);
    });

    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Sample');
    data.addColumn('number', 'Elevation');
    for (var i = 0; i < results.length; i++) {
        data.addRow(['', elevations[i].elevation]);
    }
    var el_div = $('<div style="display: block"></div>');
    $("#elevation_chart").append(el_div);
    chart = new google.visualization.ColumnChart(el_div[0]);
    chart.draw(data, {
        height: 150,
        legend: 'none',
        titleY: 'Elevation (m)'
    });
}