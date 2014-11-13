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
    """Prints the server message."""
    global startID
    startID = args[0]
    print 'server_message', args

def return_response(*args):
    """Returns the server message."""
    return args

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
    data = [{"sensorID": 1, "timestamp": st, "data": [{"type": "Point", "coordinates": [ln, lt]}], "unit": "google"}, ]
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

def realtime():
    """Starts realtime data collection."""
    arduino = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 115200)
    ard_read = arduino.readline().strip()
    if ard_read == '1234':
        return temphum_pointdata()
    elif ard_read == '1337':
        return gps_pointdata()
    elif ard_read == '1996':
        return beat_pointdata()
    elif ard_read == '1995':
        return 'END'
    else:
        return None
    
#CONNECTING TO THE SERVER, STARTING THE TRIP AND STORING THE ID
info_start = {'purpose': 'realtime-sender', 'groupID': "cwa2", 'userID': "r0462183"}
metadata = {} #the set of metadata is empty: no metadata used
        
socketIO = SocketIO('dali.cs.kuleuven.be', 8080)
socketIO.on('server_message', on_emit)
socketIO.emit('start', json.dumps(info_start), on_emit)
info_end = {"_id":startID, "meta": metadata}
socketIO.wait(2)

#SENDING REALTIME DATA
sensordata = realtime()
while sensordata != 'END':
    if try_connection() == False:
        print "Cannot send data. Please connect to the internet."
        time.sleep(2)
    elif not sensordata == None:
        socketIO.emit('rt-sensordata',{"_id":startID, "sensorData":sensordata})
        socketIO.emit('rt-sensordata',{"_id":startID, "sensorData":accelerometer_pointdata()})
    sensordata = realtime()

#ENDING THE TRIP
socketIO.emit('endBikeTrip', json.dumps(info_end), on_response)
socketIO.wait(5)
