# MQTT contract

Topics are `hvac/{room}/temperature`, `humidity`, `airquality`, `occupancy`, `energy`, and `status`. The `MQTTService` adapter keeps broker details in environment variables and is ready to subscribe and publish without exposing broker credentials to the browser.
