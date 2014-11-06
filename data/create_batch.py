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

def convert_coordinates(coor):
    """Changes GPS coordinates from degrees-minutes.decimals format to degrees.decimals format."""
    k = 0
    coor = str(coor)

    #get the degrees and perform the first step in obtaining the transformed minutes (dmin)
    for i in range(0, len(coor)):
        if coor[i] == ".":
            k = i
            break
    minutes = int(coor[k + 1:len(coor)])
    degrees = (coor[0:k])
    dmin = str(minutes / 60.0)

    #removing the . in the original format(second step in obtaining dmin)
    for s in range(0, len(dmin)):
        if dmin[s] == ".":
            k = s
            break    
    dmin1 = dmin[0:k]
    dmin2 = dmin[k + 1:len(dmin)]
    dmin = dmin1 + dmin2

    #adding degrees and dmin together in the desired format
    coordinates = degrees + "." + dmin
    return coordinates

def beat_pointdata():
    """Collects heartbeat data of a specific moment (one value)."""
    arduino = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 115200)
    hb = eval(arduino.readline().strip())
    st = time.strftime("%Y-%m-%dT%H:%M:%S")
    data = [{"sensorID": 9, "timestamp": st, "data": [{"value": [hb]}]},]
    return data

def temphum_pointdata():
    """Gets temperature and humidity data at a specific moment."""
    arduino = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 115200)
    humi = eval(arduino.readline().strip())
    temp = eval(arduino.readline().strip())
    st = time.strftime("%Y-%m-%dT%H:%M:%S")
    data = [{"sensorID": 3, "timestamp": st, "data": [{"value": [temp]}]}, {"sensorID": 4, "timestamp": st, "data": [{"value": [humi]}]}, ]
    return data

def gps_pointdata():
    """Gets gps data at a specific moment and uses convert_coordinates(coor) to transfrom them into the right format."""
    arduino = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 115200)
    ln = eval(arduino.readline().strip())/100
    lt = eval(arduino.readline().strip())/100
    st = time.strftime("%Y-%m-%dT%H:%M:%S")
    ln = convert_coordinates(ln)
    lt = convert_coordinates(lt)
    data = [{"sensorID": 1, "timestamp": st, "data": [{"type": "Point", "coordinates": [ln, lt]}]}, ]
    return data

def accelerometer_pointdata():
    """Reads the accelerometer data at a specific moment and puts them in the desired format."""
    XLoBorg.printFunction = XLoBorg.NoPrint
    XLoBorg.Init()
    x, y, z = XLoBorg.ReadAccelerometer()
    mx, my, mz = XLoBorg.ReadCompassRaw()
    st = time.strftime("%Y-%m-%dT%H:%M:%S")
    data = [{"sensorID": 5, "timestamp": st,"data": [{"acceleration": [{"x": x, "y": y, "z": z}], "orientation": [{"mx": mx, "my": my, "mz": mz}]}]}, ]
    return data

def create_batch():
    """Collects all the data for the batch (whereafter the batch itself is to be created with create_batch())."""
    arduino = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 115200)
    batch_data = []
    end = 1
    starttime = time.strftime("%Y-%m-%dT%H:%M:%S") #the gps already has a fix when the function is executed so this is the correct start time
    while end != 0:
        #adds accelerometer data and most of the time data from one sensor (GPS, humidity, temperature or heartbeat) to the batch_data list
        ard_read = arduino.readline().strip()
        if ard_read == '1234':
            batch_data += temphum_pointdata()
        if ard_read == '1337':
            batch_data += gps_pointdata()
        if ard_read == '1996':
            batch_data += beat_pointdata()
        batch_data += accelerometer_pointdata()
        #checks whether stop conditions have been met
        if ard_read == '1995':
            end = 0
            endtime = time.strftime("%Y-%m-%dT%H:%M:%S")
    batch = [{"startTime": starttime, "endTime": endtime, "groupID": "cwa2", "userID": "r0462183", "sensorData": batch_data,"meta": {}}]
    return batch


#MAIN LOOP: RUNS WHEN FILE IS EXECUTED
k = 0
while k == 0:
    ard = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 115200)
    if ard.readline().strip() == '1337': #the arduino nano sends 1337 to the pi when the gps has a fix so the collection of all data can start
        k = 1
        batch = create_batch() #creates the batch corresponding to the trip


#TESTS CONNECTION AND SENDS BATCH IN THE CORRECT FORMAT TO THE SERVER
while not try_connection():
    time.sleep(2)

info = {'purpose': 'batch-sender', 'groupID': "cwa2", 'userID': "r0462183"}

socketIO = SocketIO('dali.cs.kuleuven.be', 8080)
socketIO.on('server_message', on_response)
socketIO.emit('start', json.dumps(info), on_response)
socketIO.wait(2)
socketIO.emit('batch-tripdata', json.dumps(batch), on_response)
socketIO.wait(5)
