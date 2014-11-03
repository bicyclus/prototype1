import XLoBorg
import time
import serial
from socketIO_client import SocketIO
import json
import urllib2

#DEFINING FUNCTIONS
def try_connection():
    """Checks if we can connect to the server by checking the availability of http://dali.cs.kuleuven.be:8080/qbike/."""
    try:
        response = urllib2.urlopen('http://dali.cs.kuleuven.be:8080/qbike/', timeout=1)
        return True
    except urllib2.URLError as err:
        pass
    return False


def accelerometer_pointdata():
    """Reads the accelerometer data at this specific moment and puts them in the desired format."""
    XLoBorg.printFunction = XLoBorg.NoPrint
    XLoBorg.Init()
    x, y, z = XLoBorg.ReadAccelerometer()
    mx, my, mz = XLoBorg.ReadCompassRaw()
    st = time.strftime("%Y-%m-%dT%H:%M:%S")
    data = [{"sensorID": 5, "timestamp": st,"data": [{"acceleration": [{"x": x, "y": y, "z": z}], "orientation": [{"mx": mx, "my": my, "mz": mz}]}]}, ]
    return data


def convert_coordinates(coor):
    """Converts the coordinates from dd mm format to dd format."""
    k = 0
    coor = str(coor)
    for i in range(0, len(coor)):
        if coor[i] == ".":
            k = i
            break
    minutes = int(coor[k + 1:len(coor)])
    degrees = (coor[0:k])
    dmin = str(minutes / 60.0)

    for s in range(0, len(dmin)):
        if dmin[s] == ".":
            k = s
            break
    dmin1 = dmin[0:k]
    dmin2 = dmin[k + 1:len(dmin)]
    dmin = dmin1 + dmin2

    coordinates = degrees + "." + dmin
    return coordinates

def gps_pointdata():
    """Gets gps data of the current point."""
    ln = eval(arduino.readline().strip())/100
    lt = eval(arduino.readline().strip())/100
    st = time.strftime("%Y-%m-%dT%H:%M:%S")
    ln = convert_coordinates(ln)
    lt = convert_coordinates(lt)
    data = [{"sensorID": 1, "timestamp": st, "data": [{"type": "Point", "coordinates": [ln, lt]}]}, ]
    return data


def create_batch_data():
    """Creates all the data to send with the batch."""
    arduino = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 115200)
    batch_data = []
    end = 1
    starttime = time.strftime("%Y-%m-%dT%H:%M:%S") #the gps already has a fix when the function is executed so this is the corect start time
    while end != 0:
        #adds accelerometer data and data from sometimes one sensor and the accelerometer
        ard_read = arduino.readline().strip()
        if ard_read == '1337':
            batch_data += gps_pointdata()
        batch_data += accelerometer_pointdata()
        #checks whether stop conditions have been met
        if ard_read == '1995':
            end = 0
            endtime = time.strftime("%Y-%m-%dT%H:%M:%S")
    return batch_data, starttime, endtime


def create_batch():
    """Creates the batch itself using the create_batch_data() function."""
    batch_data, starttime, endtime = create_batch_data()
    batch = [
        {"startTime": starttime, "endTime": endtime, "groupID": "cwa2", "userID": "r0462183", "sensorData": batch_data,
         "meta": {}}]
    return batch


def on_response(*args):
    """Prints the server message."""
    print 'server_message', args

#MAIN LOOP: RUNS WHEN FILE IS RUNNED
k = 0
while k == 0:
    ard = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 115200)
    if ard.readline().strip() == '1337':
        k = 1
        batch = create_batch()


#TESTS CONNECTION AND SENDS BATCH IN THE CORRECT FORMAT TO THE SERVER
while not try_connection():
    time.sleep(5)

data = {'purpose': 'batch-sender', 'groupID': "cwa2", 'userID': "r0462183"}

socketIO = SocketIO('dali.cs.kuleuven.be', 8080)
socketIO.on('server_message', on_response)
a = socketIO.emit('start', json.dumps(data), on_response)
socketIO.wait(2)

socketIO.emit('batch-tripdata', json.dumps(batch), on_response)
socketIO.wait(5)
