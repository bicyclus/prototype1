google.load('visualization', '1.0', {'packages':['corechart']});

function getInit(){

    $("#getTrips")
        .click(function( event ) {
            event.preventDefault();
            getAllTrips();
        });
}

function getAllTrips(){
    $.ajax({
        url: "http://dali.cs.kuleuven.be:8080/qbike/trips",
        jsonp: "callback",
        dataType: "jsonp",
        success: function(response){
            console.log(JSON.stringify(response, null, 2));
            $('#myReciever').append('<pre>' + JSON.stringify(response, null, 2) + '</pre>');
            drawChart(response);
        }
    });
}

function drawChart(data) {
    var dataArray = [['Number', 'Elapsed time']];

    for (i = 0; i < data.length; i++) {
        if (!(data[i].endTime === undefined)) {
            console.log( new Date(data[i].endTime));
            console.log( new Date(data[i].startTime));
            var elap = (new Date(data[i].endTime) - new Date(data[i].startTime))/1000;
            console.log(Math.abs(elap));
            if (Math.abs(elap) < 1000){
                dataArray.push([i, elap])
            }
        }
    }
    var chartData = google.visualization.arrayToDataTable(dataArray);

    var options = {'title':'Elapsed Times over all trips'};

    // Instantiate and draw our chart, passing in some options.
    var chart = new google.visualization.LineChart($("#chart_div")[0]);
    chart.draw(chartData, options);
}

$(document).ready(getInit);