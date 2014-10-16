google.load('visualization', '1.0', {'packages':['corechart']});
google.load('visualization', '1', {packages: ['columnchart']});

function getInit(){
    $("#getTrips") //Button maken
        .click(function( event ) {
            event.preventDefault();
            getAllTrips();
        });
    $("#plotGPS")
        .click(function( event ) {
            event.preventDefault();
            plotGPSmap();
        });
    $("#showJSON")
        .click(function( event ) {
            event.preventDefault();
            $('#myReciever').toggle();
        });
}

$(document).ready(getInit);