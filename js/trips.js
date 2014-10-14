google.load('visualization', '1.0', {'packages':['corechart']});

function getInit(){
    $("#getTrips") //Button maken
        .click(function( event ) {
            event.preventDefault();
            getAllTrips();
        });
}

function getAllTrips(){ //JSON van alle trips opvragen en naar drawChart doorgeven
    $.ajax({
        url: "http://dali.cs.kuleuven.be:8080/qbike/trips",
        jsonp: "callback",
        dataType: "jsonp",
        success: function(response){
            $('#myReciever').append('<pre>' + JSON.stringify(response, null, 2) + '</pre>');
            drawChart(response);
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

    var options = {'title':'Elapsed Times over all trips'};

    // Instantiate and draw our chart, passing in some options.
    var chart = new google.visualization.LineChart($("#chart_div")[0]); //Chart aanmaken in div
    chart.draw(chartData, options); //Tekenen
}

$(document).ready(getInit);