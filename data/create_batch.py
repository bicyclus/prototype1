import XLoBorg
import time
import serial
from socketIO_client import SocketIO
import json
import urllib2
import os

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

prev_coor_ln = None
prev_coor_lt = None

def matching_coor(lst):
    for i in len(lst):
        count = 0
        k = len(lst)-i
        while count != k:
            if abs(float(lst[i])-float(lst[i+count])) > 0.1:
                return False
            count += 1
    return True

def determine_correct_coor(n=5):
    """To prevent sending incorrect coordinates, this function tries to determine whether th gps has a stable fix by waiting for a group of coordinates near each other.
    As soon as n (default is 5) coordinates are seen as near each other (using an arbitrary value), the function exits and the creation of the batch may start."""
    arduino = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 115200)
    ard_read = arduino.readline().strip()
    coor_list = []
    while len(coor_list) != n: #fetching first five coordinates
        if ard_read == '1337':
            gps = gps_pointdata()
            if not gps == False:
                coor_list.append(gps)
    while not matching_coor(coor_list) == True: #trying to get a list with n correct gps values
        #retrieving next coordinate
        gps = False
        while gps != True: 
            if ard_read == '1337':
                gps = gps_pointdata()
                if not gps == False:
                    new_coor = gps
        #removing oldest coordinate and putting another in place
        coor_list.insert(0,new_coor)
        del coor_list[n]
    return #if the list with n correct values has been found, the function exits

def convert_coordinates_ln(coor):
    """Changes GPS coordinates from degrees-minutes.decimals (dmc) format to degrees.decimals (google) format. This function is written for longitude specifically to be able to compare
    the input longitude coordinate value to the previous input one, attempting to detect a single large offset coordinate point."""
    global prev_coor_ln
    global wrong_list_ln

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

    if prev_coor_lt == None:
        pass
    elif abs(float(prev_coor_ln)-float(coordinates)) > 0.1:
        return False
    prev_coor_ln = coordinates
    return coordinates

def convert_coordinates_lt(coor):
    """Changes GPS coordinates from degrees-minutes.decimals (dmc) format to degrees.decimals (google) format. This function is written for latitude specifically to be able to compare
    the input latitude coordinate value to the previous input one, attempting to detect a single large offset coordinate point."""
    global prev_coor_lt
    global wrong_list_lt

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

    if prev_coor_lt == None:
        pass
    elif abs(float(prev_coor_lt)-float(coordinates)) > 0.1:
        return False
    prev_coor_lt = coordinates
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
    ln = convert_coordinates_ln(ln)
    lt = convert_coordinates_lt(lt)
    if ln == False or lt == False:
        return False
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

def create_batch():
    """Collects all the data for the batch (whereafter the batch itself is to be created with create_batch())."""
    arduino = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 115200)
    batch_data = []
    starttime = time.strftime("%Y-%m-%dT%H:%M:%S") #the gps already has a fix when the function is executed so this is the correct start time
    ard_read = arduino.readline().strip() #added to prevent error first run of the while-loop
    while ard_read != '1995': #Stop condition: arduino sending '1995' to the Pi
        #adds accelerometer data and most of the time data from one sensor (GPS, humidity, temperature or heartbeat) to the batch_data list
        ard_read = arduino.readline().strip()
        if ard_read == '1234':
            batch_data += temphum_pointdata()
        if ard_read == '1337':
            gps = gps_pointdata()
            if not gps == False:
                batch_data += gps
        if ard_read == '1996':
            batch_data += beat_pointdata()
        batch_data += accelerometer_pointdata()
    endtime = time.strftime("%Y-%m-%dT%H:%M:%S")
    batch = [{"startTime": starttime, "endTime": endtime, "groupID": "cwa2", "userID": "r0462183", "sensorData": batch_data,"meta": {}}]
    return batch

def send_data(save_path):
    """
    Sends all the data files that are present in the specified path to the Qbike server.
    :param save_path: Requires the path in which the trips are saved.
    :return:
    """
    end = False
    Trip_nb = 100
    while end == False:
        if not os.path.isfile('/home/pi/Trips/Trip1.txt'):
            end = True
            print "No Data"

        else:
            for nb in reversed(range(0,100)):
                Trip = os.path.join(save_path,"Trip"+str(nb)+".txt")
                Trip_nb = str(nb)
                if os.path.isfile(Trip):
                    break

            Trip_path = os.path.join(save_path, r"Trip"+Trip_nb+r".txt")

            with open(Trip_path, "r") as Trip:
                batch = json.load(Trip)

            info = {'purpose': 'batch-sender', 'groupID': "cwa2", 'userID': "r0462183"}
            socketIO = SocketIO('dali.cs.kuleuven.be', 8080)
            socketIO.on('server_message', on_response)
            socketIO.emit('start', json.dumps(info), on_response)
            socketIO.wait(2)
            socketIO.emit('batch-tripdata', json.dumps(batch), on_response)
            socketIO.wait(5)

            os.remove(Trip_path)



def get_trip_nb(save_path):
    """
    Gets the trip number for the next trip to be saved. If trips are present, it starts with 1.
    :param save_path: Requires the path in which the trips should be saved.
    :return: The Trip number of the trip to be saved.
    """
    for nb in range(1,100):
        trip = os.path.join(save_path,"Trip"+str(nb)+".txt")
        if not os.path.isfile(trip):
            trip_nb = str(nb)
            break
    return trip_nb


def write_trip(tripdata, save_path):
    """
    Creates and saves a trip file containing the tripdata of the last trip.
    :param tripdata: The tripdata collected by the sensors.
    :param save_path: Requires the path in which the trips should be saved.
    :return: Nothing, the file is saved in the specified path.
    """
    trip = os.path.join(save_path, "Trip"+get_trip_nb(save_path)+".txt")
    with open(trip, "w") as trip:
        json.dump(tripdata, trip)

def send(save_path):
    """
    Sees if there is a connection present. If that is the case, it sends all the saved data present in the specified
     path to the server. It does this using the send_data function.
    :param save_path: Requires the path in which the trips are saved.
    :return: Nothing, the files are sent to the server.
    """
    time.sleep(5)
    if try_connection():
        send_data(save_path)

#MAIN LOOP: RUNS WHEN FILE IS EXECUTED
while True:
    ard = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 115200)
    save_path_pi = r'/home/pi/Trips'
    if ard.readline().strip() == '1337': #the arduino nano sends 1337 to the pi when the gps has a fix so the collection of all data can start
        determine_correct_coor()
        batch = create_batch() #creates the batch corresponding to the trip
        write_trip(batch,save_path_pi)
    send(save_path_pi)

