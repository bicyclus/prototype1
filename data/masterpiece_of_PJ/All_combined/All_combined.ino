#include <Adafruit_GPS.h>
#include <SoftwareSerial.h>
#include <DHT.h>
#define DHTPIN 6
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

//  VARIABLES
#define pulsePin 14                 // Pulse Sensor purple wire connected to analog pin 0

volatile int BPM;                   // used to hold the pulse rate
volatile int Signal;                // holds the incoming raw data
volatile int IBI = 600;             // holds the time between beats, must be seeded! 
volatile boolean Pulse = false;     // true when pulse wave is high, false when it's low
volatile boolean QS = false;        // becomes true when Arduoino finds a beat.

SoftwareSerial mySerial(3, 2);

Adafruit_GPS GPS(&mySerial);

SIGNAL(TIMER0_COMPA_vect) {
  char c = GPS.read();
}
void setup()  
{   
  Serial.begin(115200);             // we agree to talk fast!
  GPSsetup();
  HBSsetup();
}

void GPSsetup(){
   GPS.begin(9600);
  // We use RMC (recommended minimum data) and GGA (Fix data)
  GPS.sendCommand(PMTK_SET_NMEA_OUTPUT_RMCGGA);

  // Set the update rate
  GPS.sendCommand(PMTK_SET_NMEA_UPDATE_1HZ);  
  OCR0A = 0xAF;
  TIMSK0 |= _BV(OCIE0A);
  mySerial.println(PMTK_Q_RELEASE);
}

uint32_t timer_GPS = millis();
#define GPS_INTERVAL 503 //the minimum time we want between the prints of a gps- coördinate
                         // it's a prime number to drastically decrease the change of overlapping with other timers

void read_GPS(){
  char c = GPS.read();
    if (GPS.newNMEAreceived()) {
    if (!GPS.parse(GPS.lastNMEA())){   
      return;  // we can fail to parse a sentence in which case we should just wait for another
  }
}
  if(timer_GPS > millis()) timer_GPS = millis(); 
  if(millis()-timer_GPS < GPS_INTERVAL){ //We use timers to get all the sensordata so we can work asynchronously
    return;
  }
timer_GPS = millis();
if (GPS.fix) { //only print sensordata if the gps has a fix
Serial.println("1337"); // print a key, so the arduino knows its the GPS
delay(100);
Serial.println(GPS.latitude,4);
Serial.println(GPS.longitude,4);
delay(50);    
}
}

int button=8; //define the pin of the switchsensor
int sensorValue;
uint32_t timer_HUMI_TEMP = millis();
#define HUMI_TEMP_INTERVAL 10099 //the minimum time between the prints of temp_hump data
                                 //it's a prime number to drastically decrease the change of overlapping with other timers


void read_HUMI_TEMP(){
  if(timer_HUMI_TEMP > millis()) timer_HUMI_TEMP = millis();
  if(millis()-timer_HUMI_TEMP < HUMI_TEMP_INTERVAL){   //only print sensordata if the current interval is bigger then the wanted interval
    return;
  }  
   timer_HUMI_TEMP = millis();
   Serial.println("1234"); //prints the key for temp_hump 
   delay(100);
   Serial.println((float)dht.readHumidity(), 2);
   Serial.println((float)dht.readTemperature(), 2);
   delay(50);

}


void loop()           // run over and over again
{

  sensorValue = digitalRead(button);
  if (sensorValue == LOW) { 
    Serial.println("1995");//prints the key when the user isn't collecting trips
    delay(100);
  }  
    if (sensorValue == HIGH) { //print out all the sensordata is their timer is ok
      read_GPS();
      read_HUMI_TEMP();
      read_HBS();    
   }
  }

