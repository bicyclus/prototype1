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

def on_emit(*args):
    """Prints the server message and stores the ID."""
    global startID
    startID = args[0]
    print 'server_message', args

def convert_coordinates(coor):
    """Changes GPS coordinates from degrees-minutes.decimals (dmc) format to degrees.decimals (google) format."""
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

##def beat_pointdata():
##    """Collects heartbeat data of a specific moment (one value)."""
##    arduino = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 115200)
##    hb = eval(arduino.readline().strip())
##    st = time.strftime("%Y-%m-%dT%H:%M:%S")
##    data = [{"sensorID": 9, "timestamp": st, "data": [{"value": [hb]}]},]
##    return data

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
    data = [{"sensorID": 1, "timestamp": st, "data": [{"type": "Point", "coordinates": [ln, lt]}], "unit": "google"}, ]
    return data

def accelerometer_pointdata():
    """Reads the accelerometer data at a specific moment and puts them in the desired format."""
    XLoBorg.printFunction = XLoBorg.NoPrint
    XLoBorg.Init()
    x, y, z = XLoBorg.ReadAccelerometer()
    mx, my, mz = XLoBorg.ReadCompassRaw()
    st = time.strftime("%Y-%m-%dT%H:%M:%S")
    data = [{"sensorID": 5, "timestamp": st,"data": [{"acceleration": [{"x": x, "y": y, "z": z}], "orientation": [{"mx": mx, "my": my, "mz": mz}]}]}]
    return data

def realtime():
    """Starts realtime data collection."""
    arduino = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 115200)
    ard_read = arduino.readline().strip()
    if ard_read == '1234':
        return temphum_pointdata()
    elif ard_read == '1337':
        return gps_pointdata()
##    elif ard_read == '1996':
##        return beat_pointdata()
    elif ard_read == '1995':
        return 'END'
    else:
        return None
    
#CONNECTING TO THE SERVER, STARTING THE TRIP, STORING THE ID AND WAITING FOR THE STARTING SIGNAL
arduin = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 115200)
arduin_read = arduino.readline().strip() #defined beforehand so no connection is made with server if arduino is not connected

info_start = {'purpose': 'realtime-sender', 'groupID': "cwa2", 'userID': "r0462183"}
metadata = {} #the set of metadata is empty: no metadata used
while try_connection() == False: #connection tests before each server interaction to minimise amount of errors
    time.sleep(2) 
socketIO = SocketIO('dali.cs.kuleuven.be', 8080)
while try_connection() == False:
    time.sleep(2)  
socketIO.on('server_message', on_emit)
while try_connection() == False:
    time.sleep(2)  
socketIO.emit('start', json.dumps(info_start), on_emit)
socketIO.wait(2)
info_end = {"_id":startID, "meta": metadata}

while True:
    if arduin_read == 1337:
        break

#SENDING REALTIME DATA
condition = realtime()
sensordata1 = {"_id":startID, "sensorData":condition}
while condition != 'END':
    if try_connection() == False:
        print "Cannot send data. Please connect to the internet."
        time.sleep(2)
    elif not condition == None:
        socketIO.emit('rt-sensordata',sensordata1)
        sensordata2 = {"_id":startID, "sensorData":accelerometer_pointdata()}
        socketIO.emit('rt-sensordata',json.dumps(sensordata2))
    sensordata = realtime()

#ENDING THE TRIP
while try_connection() == False:
    time.sleep(2)  
socketIO.emit('endBikeTrip', json.dumps(info_end), on_response)
socketIO.wait(5)
