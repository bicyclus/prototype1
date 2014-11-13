import XLoBorg
import time
import serial
from socketIO_client import SocketIO
import json
import urllib2

#DEFINING THE AUXILIARY FUNCTIONS
def try_connection():
    """Checks if we can connect to the server by checking the availability of the page http://dali.cs.kuleuven.be:8080/qbike/."""
    try:
        response = urllib2.urlopen('http://dali.cs.kuleuven.be:8080/qbike/', timeout=1)
        return True
    except urllib2.URLError as err:
        pass
    return False

def on_response(*args):
    """Prints the server message."""
    print 'server_message', args

def beat_pointdata():
    """Collects heartbeat data of a specific moment (one value)."""
    arduino = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 115200)
    hb = eval(arduino.readline().strip())
    st = time.strftime("%Y-%m-%dT%H:%M:%S")
    data = [{"sensorID": 9, "timestamp": st, "data": [{"value": [hb]}]},]
    return data

def create_batch():
    """Collects all the data for the batch (whereafter the batch itself is to be created with create_batch())."""
    arduino = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 115200)
    batch_data = []
    starttime = time.strftime("%Y-%m-%dT%H:%M:%S") #the gps already has a fix when the function is executed so this is the correct start time
    ard_read = arduino.readline().strip() #added to prevent error first run of the while-loop
    while ard_read != '1995': #Stop condition: arduino sending '1995' to the Pi
        #adds accelerometer data and most of the time data from one sensor (GPS, humidity, temperature or heartbeat) to the batch_data list
        ard_read = arduino.readline().strip()
        if ard_read == '1996':
            batch_data += beat_pointdata()
    endtime = time.strftime("%Y-%m-%dT%H:%M:%S")
    batch = [{"startTime": starttime, "endTime": endtime, "groupID": "cwa2", "userID": "r0462183", "sensorData": batch_data,"meta": {}}]
    return batch


#MAIN LOOP: RUNS WHEN FILE IS EXECUTED
batch = create_batch() #creates the batch corresponding to the trip


#TESTS CONNECTION AND SENDS BATCH IN THE CORRECT FORMAT TO THE SERVER
while not try_connection():
    time.sleep(1)

info = {'purpose': 'batch-sender', 'groupID': "cwa2", 'userID': "r0462183"}

socketIO = SocketIO('dali.cs.kuleuven.be', 8080)
socketIO.on('server_message', on_response)
socketIO.emit('start', json.dumps(info), on_response)
socketIO.wait(2)
socketIO.emit('batch-tripdata', json.dumps(batch), on_response)
socketIO.wait(5)