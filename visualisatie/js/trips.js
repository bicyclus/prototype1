function getAllTrips(){ //JSON van alle trips opvragen en naar drawChart doorgeven
    $.ajax({
        url: "http://dali.cs.kuleuven.be:8080/qbike/trips",
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
                        if (timestampDate.getFullYear() > 1971) {
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
    console.log(dataArray);
    var chartData = google.visualization.arrayToDataTable(dataArray);

    var options = {'title':'X Y Z',colors:['red','green','blue'],curveType: 'function',backgroundColor:'#f5f5f5'};

    var chart = new google.visualization.LineChart($("#accel_div")[0]); //Chart aanmaken in div
    chart.draw(chartData, options); //Tekenen
}

function SortByTimestamp(a, b){
    return ((a.timestamp < b.timestamp) ? -1 : ((a.timestamp > b.timestamp) ? 1 : 0));
}