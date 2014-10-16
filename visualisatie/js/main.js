google.load('visualization', '1.0', {'packages':['corechart']});

function getInit(){
    $("#getTrips") //Button maken
        .click(function( event ) {
            event.preventDefault();
            getAllTrips();
        });
}

$(document).ready(getInit);