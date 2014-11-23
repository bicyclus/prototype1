import XLoBorg
import time
import serial
from socketIO_client import SocketIO
import json
import urllib2
import os

# DEFINING THE AUXILIARY FUNCTIONS
def try_connection():
    """
    Checks if we can connect to the server by checking the availability of the page
    http://dali.cs.kuleuven.be:8080/qbike/.
    :return: True if able to connect to the server, False if not.
    """
    try:
        response = urllib2.urlopen('http://dali.cs.kuleuven.be:8080/qbike/', timeout=1)
        return True
    except:
        pass
    return False


def on_response(*args):
    """
    Prints the server message.
    :param: In this file, it requires the server message.
    :return: The server message printed out.
    """
    print 'server_message', args


def convert_coordinates(coor):
    """
    Changes GPS coordinates from degrees-minutes.decimals (dmc) format to degrees.decimals (google) format.
    :param: Requires dmc format coordinates in singles, not pairs.
    :return: Returns the google format of the dmc format coordinate.
    """
    k = 0
    coor = str(coor)

    # get the degrees and perform the first step in obtaining the transformed minutes (dmin)
    for i in range(0, len(coor)):
        if coor[i] == ".":
            k = i
            break
    minutes = int(coor[k + 1:len(coor)])
    degrees = (coor[0:k])
    dmin = str(minutes / 60.0)

    # removing the . in the original format(second step in obtaining dmin)
    for s in range(0, len(dmin)):
        if dmin[s] == ".":
            k = s
            break
    dmin1 = dmin[0:k]
    dmin2 = dmin[k + 1:len(dmin)]
    dmin = dmin1 + dmin2

    # adding degrees and dmin together in the desired format
    coordinates = degrees + "." + dmin
    return coordinates


def beat_pointdata():
    """
    Collects heartbeat data of a specific moment (one value).
    :return: Returns the heartbeat sensor data, in the correct format, which is delivered by
             the Arduino Nano and read by the Raspberry Pi.
    """
    arduino = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 115200)
    hb = eval(arduino.readline().strip())
    st = time.strftime("%Y-%m-%dT%H:%M:%S")
    data = [{"sensorID": 9, "timestamp": st, "data": [{"value": [hb]}]}, ]
    return data


def temphum_pointdata():
    """
    Gets temperature and humidity data at a specific moment.
    :return: Returns the temperature and humidity values in the correct data format. This data is read by
             the Raspberry Pi and delivered by the Arduino Nano.
    """
    arduino = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 115200)
    humi = eval(arduino.readline().strip())
    temp = eval(arduino.readline().strip())
    st = time.strftime("%Y-%m-%dT%H:%M:%S")
    data = [{"sensorID": 3, "timestamp": st, "data": [{"value": [temp]}]},
            {"sensorID": 4, "timestamp": st, "data": [{"value": [humi]}]}, ]
    return data


def gps_pointdata():
    """
    Gets gps data at a specific moment and uses convert_coordinates(coor) to transfrom them into the right format.
    :return: Returns the GPS coordinates in the correct data format. This data is read by
             the Raspberry Pi and delivered by the Arduino Nano.
    """
    arduino = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 115200)
    ln = eval(arduino.readline().strip()) / 100
    lt = eval(arduino.readline().strip()) / 100
    st = time.strftime("%Y-%m-%dT%H:%M:%S")
    ln = convert_coordinates(ln)
    lt = convert_coordinates(lt)
    data = [{"sensorID": 1, "timestamp": st, "data": [{"type": "Point", "coordinates": [ln, lt]}], "unit": "google"}, ]
    return data


def accelerometer_pointdata():
    """
    Reads the accelerometer data at a specific moment and puts them in the desired format.
    :return: Returns the accelerometer data in the correct format. The accelerometer is plugged in on the Pi.
    """
    XLoBorg.printFunction = XLoBorg.NoPrint
    XLoBorg.Init()
    x, y, z = XLoBorg.ReadAccelerometer()
    mx, my, mz = XLoBorg.ReadCompassRaw()
    st = time.strftime("%Y-%m-%dT%H:%M:%S")
    data = [{"sensorID": 5, "timestamp": st,
             "data": [{"acceleration": [{"x": x, "y": y, "z": z}], "orientation": [{"mx": mx, "my": my, "mz": mz}]}]}, ]
    return data


def create_batch():
    """
    Collects all the data for the batch (whereafter the batch itself is to be created with create_batch()).
    :return: Returns gathered data from a trip in the correct batch format.
    """
    arduino = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 115200)
    batch_data = []
    starttime = time.strftime(
        "%Y-%m-%dT%H:%M:%S")  # the gps already has a fix when the function is executed so this is the correct start time
    ard_read = arduino.readline().strip()  # added to prevent error first run of the while-loop
    while ard_read != '1995':  # Stop condition: arduino sending '1995' to the Pi
        #adds accelerometer data and most of the time data from one sensor (GPS, humidity, temperature or heartbeat) to the batch_data list
        ard_read = arduino.readline().strip()
        if ard_read == '1234':
            batch_data += temphum_pointdata()
        if ard_read == '1337':
            batch_data += gps_pointdata()
        if ard_read == '1996':
            batch_data += beat_pointdata()
        batch_data += accelerometer_pointdata()
    endtime = time.strftime("%Y-%m-%dT%H:%M:%S")
    batch = [
        {"startTime": starttime, "endTime": endtime, "groupID": "cwa2", "userID": "r0462183", "sensorData": batch_data,
         "meta": {}}]
    return batch


def send_data(save_path):
    """
    Sends all the data files that are present in the specified path to the Qbike server.
    :param save_path: Requires the path in which the trips are saved.
    :return: Nothing. The data is sent to the Server and the txt files are removed from the path's directory.
    """
    end = False
    Trip_nb = 100
    while end == False:
        if not os.path.isfile('C:\Users\Joren\Documents\Ir 1B\P&O\P&O 3\Tryouts\Trips\Trip1.txt'):
            end = True

        else:
            for nb in reversed(range(0, 100)):
                Trip = os.path.join(save_path, "Trip" + str(nb) + ".txt")
                Trip_nb = str(nb)
                if os.path.isfile(Trip):
                    break

            Trip_path = os.path.join(save_path, r"Trip" + Trip_nb + r".txt")

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

    print "Sent Data"


def get_trip_nb(save_path):
    """
    Gets the trip number for the next trip to be saved. If trips are present, it starts with 1.
    :param save_path: Requires the path in which the trips should be saved.
    :return: The Trip number of the trip to be saved.
    """
    for nb in range(1, 100):
        trip = os.path.join(save_path, "Trip" + str(nb) + ".txt")
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
    trip = os.path.join(save_path, "Trip" + get_trip_nb(save_path) + ".txt")
    with open(trip, "w") as trip:
        json.dump(tripdata, trip)

 
def send(save_path):
    """
    Sees if there is a connection present. If that is the case, it sends all the saved data present in the specified
     path to the server. It does this using the send_data function.
    :param save_path: Requires the path in which the trips are saved.
    :return: Nothing, the files are sent to the server.
    """
    if try_connection():
        send_data(save_path)

# MAIN LOOP: RUNS WHEN FILE IS EXECUTED
while True:
    ard = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 115200)
    save_path_pi = r'C:\Users\Joren\Documents\Ir 1B\P&O\P&O 3\Tryouts\Trips'
    if ard.readline().strip() == '1337':  #the arduino nano sends 1337 to the pi when the gps has a fix so the collection of all data can start
        batch = create_batch()  #creates the batch corresponding to the trip
        write_trip(batch, save_path_pi)
    send(save_path_pi)

