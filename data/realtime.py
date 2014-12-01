import logging
logging.basicConfig() #for viewing logging error messages with urllib2
import XLoBorg
import time
import serial
from socketIO_client import SocketIO
import socket
import json
import urllib2

#DEFINING THE AUXILIARY FUNCTIONS
def try_connection():
    """Checks if we can connect to the server by checking the availability of the page http://dali.cs.kuleuven.be:8080/qbike/."""
    try:
        response = urllib2.urlopen('http://dali.cs.kuleuven.be:8080/qbike/', timeout=1)
        return True
    except:
        pass
    return False

def on_response(*args):
    """Prints the server message."""
    print 'server_message', args

def on_emit(*args):
    """Prints the server message and stores the ID."""
    global startID
    startID = args[0]
    startID = startID.get('_id')
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
    data = [{"sensorID": 5, "timestamp": st,"data": [{"acceleration": [{"x": x, "y": y, "z": z}], "orientation": [{"mx": mx, "my": my, "mz": mz}]}]}]
    return data

def realtime():
    """Starts realtime data collection."""
    arduino = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 115200)
    while True:
        ard_read = str(arduino.readline().strip())
        if ard_read == '1234':
            temp = temphum_pointdata()
            return temp
        elif ard_read == '1337':
            gps_data = gps_pointdata()
            return gps_data
        elif ard_read == '1996':
            return beat_pointdata()
        elif ard_read == '1995':
            return 'END'

    
#CONNECTING TO THE SERVER, STARTING THE TRIP, STORING THE ID AND WAITING FOR THE STARTING SIGNAL
def connect():
    """Sends the starting signal to the server."""
    arduino = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 115200)
    info_start = {'purpose': 'realtime-sender', 'groupID': "cwa2", 'userID': "r0462183"}
    metadata = {'other':"trip ended"} #string "trip ended" stored in metadata under key 'other' to be able to filter on realtime trips easier on the bicyclus website
    print "Setting up for server connection ..."
    while True: #connection tests everywhere they are needed to minimise amount of connection errors
        if try_connection() == True:
            socketIO = SocketIO('dali.cs.kuleuven.be', 8080)
            break
        time.sleep(2)
    while True:
        if try_connection() == True:
            socketIO.on('server_message', on_emit)
            break
        socketIO.wait(2)
    print "Trying to send start signal for trip ..."
    while True:
        if try_connection() == True:
            socketIO.emit('start', json.dumps(info_start), on_emit)
            print "Connection verified, start signal sent."
            socketIO.wait(2)
            break
        socketIO.wait(2)
    info_end = {"_id":startID, "meta": metadata}
    return info_end

def collect_send():
    """Collects data and immediately sends it to the server (realtime sending of data) over and over again until end signal is read."""
    condition = realtime()
    print "Starting to collect data ..."
    while condition != 'END':
        if try_connection() == False:
            print "Connection error. Could not open webpage server."
        elif condition != None:
            sensordata1 = {"_id":startID, "sensorData":condition}
            while True:
                try:
                    socketIO.emit('rt-sensordata',json.dumps(sensordata1))
                    break
                except:
                    print "Connection refused or previous data not yet processed by server. Data not sent."
                    time.sleep(0.4)

            sensordata2 = {"_id":startID, "sensorData":accelerometer_pointdata()}
            while True:
                try:
                    socketIO.emit('rt-sensordata',json.dumps(sensordata2))
                    break
                except:
                    print "Connection error. Data not sent."
                    time.sleep(0.4)
                
            print "data sent"
        condition = realtime()
    print "End signal given. Trip data collected."
    
def end(info_end):
    """Sends the end signal to the server."""
    time.sleep(2) #to try to prevent broken pipe errors
    print "Trying to send end signal, testing connection ..."
    while True:
        if try_connection() == True:
            print "Connection verified, sending end signal."
            try:
                socketIO.emit('endBikeTrip', json.dumps(info_end), on_response)
                time.sleep(5)
                print "End signal sent."
            except:
                break
        socketIO.wait(2)

#MAIN LOOP (INFINITE), RUNS WHEN FILE IS RAN
while True:
    arduino = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 115200)
    if arduino.readline().strip() == '1337':
        print "Start signal for collecting trip data realtime given."
        connect()
        collect_send()
        end()
        print "Data from trip collected and sent to server succesfully."
    time.sleep(1)
