int button=2;
int sensorValue;
void setup(){
  pinMode(button, INPUT);
  Serial.begin(9600);
}

void loop(){
  sensorValue = digitalRead(button);
  if (sensorValue == LOW) {
    Serial.println(1);
  }  
  delay(250);

}


