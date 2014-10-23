import serial
arduino = serial.Serial('/dev/serial/by-id/usb-Gravitech_ARDUINO_NANO_13BP1066-if00-port0', 9600)

while True:   
    if arduino.readline().strip() == '1337':
        ln = eval(arduino.readline().strip())
        lt = eval(arduino.readline().strip())
        print ln,lt
        
