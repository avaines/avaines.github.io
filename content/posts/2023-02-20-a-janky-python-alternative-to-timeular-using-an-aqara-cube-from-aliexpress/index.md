---
draft: false
title: >-
  A janky python alternative to Timeular using an Aqara cube from AliExpress
author: Aiden Vaines
image: featured.png
featured: true
categories:
  - Python
  - Jank
date: 2023-02-20T21:00:00.000Z
---

This little project stemmed from me seeing what looked like a fun idea but being a tight-arsed Yorkshireman. I'm not paying [£70 for a bit of plastic and £10 a month to use it](https://timeular.com), but I would find some of the features useful, namely, a way of tracking which project I'm currently working on. and for it to be historically referable.

Ideally I would like it to magically fill in my timesheets for various clients automatically, but, I'm also a realist and know the limit of my abilities, I'll settle for an Outlook calendar being populated for me.

I already have an Office 365 subscription with calendars and I don't mind spending £20 on AliExpress for some bits . A weekend spent writing a poorly designed, documented and optimised API and some new protocols to learn sounds fun-ish.

[Project Github link](https://github.com/avaines/timesheet-cube)

## What did I learn?

I had an awareness of the ZigBee protocol before starting but had never worked with it in practice. My initial hope was that I would be easily able to tap in to it as if it was a BLE Bluetooth device that I could sort of observe and read out of the ether when needed. I'd done similar with some little [Bluetooth Hygrometer](https://github.com/avaines/hygrometer-reporter) things.

In the end I deployed the HomeAssistant container on my NAS and set it up with a cheap ZigBee USB adapter I found on AliExpress. HomeAssistant took care of setting up the ZigBee network and managing the device, it does seem to drift off to sleep and not recognise the cube for a few seconds after a long time in one position though but thats probably a _you-get-what-you-pay-for_ type of thing.

I needed a HomeAssistant 'helper' to store the current position of the cube, and six different CURLs in the config file for hitting my API container. The Blueprint I created for the device then allowed me to just map those custom functions to the custom calls needed.

The API itself is just a little FastAPI service which initiates a class called 'cube' which stores the state, handles the cube being rotated, and working out how long its been on a particular face. It took me a few iterations to figure what I was actually doing with this thing as I had to write it without either the cube or the ZigBee dongle with AliExpress shipping being what it is.

Once a change to the cube face is detected it makes a calendar change via the [O365](https://github.com/O365/python-o365 "Python O365 library") Python library which made things a whole lot easier than I expected it to be. The end result through did exactly what I wanted (which has to be a first):

![outlook calendar with calendar segments](time-cube-calendar.png "its alive")

I have learnt that I still think [IoT stuff is a bag of shite](https://twitter.com/internetofshit) and I hate it; but now I'm also an enabler and hypocrite.

# If for some reason you want to try this yourself...

You are going to need a few things including a HomeAssistant server or some other way to automate the calling of an API based on the cube being rotated, a colleague reckon their Stream Deck would be a good fit.

## Shopping list

1. An Aqara Cube: https://www.aliexpress.com/af/aqara-cube.html
2. A USB Zigbee gateway: https://www.aliexpress.com/af/usb-zigbee.html

## Setup

* [Clone this repo](https://github.com/avaines/timesheet-cube)
* Create a new calendar
* Create an Office365 Enterprise app with the calendar permissions following [https://github.com/O365/python-o365#calendar](https://github.com/O365/python-o365#calendar "https://github.com/O365/python-o365#calendar")
* Populate a '.env' file in the root of this repo when cloned with the info for your calendar and EA

      CALENDAR_NAME="YourNewCalendar"
      CALENDAR_OWNER="yourname@domain.com"
      CLIENT_ID="0000-0000-0000-0000-0000"
      CLIENT_SECRET="000000000000"
      TENANT_ID="0000-0000-0000-0000-0000"
* Add some more to make things a bit more readable

      INTERVAL=1
      CUBE_FACE_ONE="OFF"
      CUBE_FACE_TWO="label2"
      CUBE_FACE_THREE="label3"
      CUBE_FACE_FOUR="label4"
      CUBE_FACE_FIVE="label5"
      CUBE_FACE_SIX="label6"

## Running it

The easiest way is to run it in a container and forget it. The API has zero security on it so don't expose it to your network and certainly don't expose it to the internet.

In my use case the only service that has access it is the container HomeAssistant runs in

    docker-compose -f docker-compose.yaml up --build

OR launch it directly. The helper script will kick off a virtual env, pull in the packages needed and launch the app. It will look for the `.env` file created above.

    ./run-locally

## Using it

You should now have an API that accepts a `new_face` query string to a `/change` endpoint, eg `127.0.0.1:8000/change?new_face=three`.

In my setup I have a HomeAssistance container configured with a ZigBee network and the cube as a registered device. A helper stores the current value of the cube and a custom script for each 'face' triggers a curl to the new API

![](https://github.com/avaines/timesheet-cube/blob/main/misc/homeassistant-helper.png "Home Assistant helper config")

The blueprint is under: `misc/homeassistant-automation.yaml` of the project repo, the HomeAssistant config is under `config/configuration.yaml` looks like

    shell_command:
      flip_face_one: curl -s --request POST '192.168.111.200:8000/change?new_face=one'
      flip_face_two: curl -s --request POST '192.168.111.200:8000/change?new_face=two'
      flip_face_three: curl -s --request POST '192.168.111.200:8000/change?new_face=three'
      flip_face_four: curl -s --request POST '192.168.111.200:8000/change?new_face=four'
      flip_face_five: curl -s --request POST '192.168.111.200:8000/change?new_face=five'
      flip_face_six: curl -s --request POST '192.168.111.200:8000/change?new_face=six'

[Project Github link](https://github.com/avaines/timesheet-cube)
