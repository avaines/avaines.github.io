---
author: "Aiden Vaines"
title: "CI/CD Agnostic, mono-repo pipelines for Firebase (Hosting, Database & Functions)"
description: "Unified authentication with AWS Cognito!"
date: 2020-06-01
image: "/posts/2020-06-01-cicd-agnostic-monirepo-firebase-pipeline/featured.png"
featured: false
categories: [
  "CI/CD",
  "GCP",
]
tags: [
  "firebase",
  "nodejs",
  "github-actions",
  "github",
  "cicd",
]
---

## Introduction

I have been trying to teach myself how to build a simple Node.JS API with a NoSQL backend. A few of my colleagues mentioned that Google’s Firebase is probably the easiest place to start and off I went.

In my day to day life I’m more in with the Ops side of the DevOps culture; I mostly focus on watering and feeding infrastructure, building pipelines for deploying stuff our devs have written or tinkering with existing workflows. I’m by no means a programmer, I dabble at best, my usual tooling is Python, Bash, PowerShell, Ansible and a lot of Terraform.

When I usually need to write code it’s very situational; one shot scripts for solving a problem, or a specific piece of tooling for a plugging gaps etc. it’s rare I get to write something that’s a ‘thing’ in its own right that gets deployed and needs a solid workflow.

One of the biggest problems I faced in getting from zero to a deployable application was the complexity and variety of tooling that makes up the Node.JS and Google Firebase’s development experience. I’m fairly familiar with NPM from building pipelines and deployment processes but that’s pretty much where skills ended.

I wanted to try solving the complexity issue for myself and wrote up my experience, hopefully it could help someone else following the same road I travelled.


## The problem

With Google Firebase specifically the documentation doesn’t particularly cover how you get your code from a super function that puts some text in a database to a CI pipeline. Of course not, there’s a million ways to skin that cat…but none of them seem to be sensibly cover it that didn’t seem crazily complicated.

It all starts with setting up a firebase project (I’m not going to cover that, even I figured that step out without StackOverflow)

Once you’ve got a project, you’ll want a Git repository to store your code. (again, I’m not covering that)

To keep my project simple, I decided to go for a mono-repo. This is going to be a small project and going this way means I can test a couple of ideas I had.

I understand Git a hell of a lot better than development so having easier testing, less complexity and easier refactoring is more important than the ownership and scaling that separating into multiple repositories would give me. If I’m wrong, I can split the code out later.

As for structure my repo will look like this:

![ide_structure](/posts/2020-06-01-cicd-agnostic-monirepo-firebase-pipeline/ide_structure.png)

Now we’ve got the basics it’s time to initialise the Frontend and Backend folders and set up the rudiments of the basic codebase.


## Lets Build a Backend Firebase Function
I’ll start with the backend as that’s the bit I was interested in learning, the Frontend was just to see if I could.

The first learning point was that in Firebase if you want to host a function AND a ‘website’ you have to create two web projects. The UI may change from time to time, but I had to create something like this:

![firebase_hosting](/posts/2020-06-01-cicd-agnostic-monirepo-firebase-pipeline/firebase_hosting.png)

The Function will go in the default Firebase Hosting site, the Frontend will go in the additional site with ‘-web’ at the end. One of the things I took away from this is that a Function can only be deployed to the ‘default’ site, but a regular ‘Hosting’ project can be ‘targeted’, this took me a while to get my head around. The documentation doesn’t do a particularly good job of explaining it either.

In the ‘BE’ folder initialise a new firebase project. This is covered by pretty much every tutorial I came across so I’m not going to cover this, it should look something like this:

![ide_structure_be](/posts/2020-06-01-cicd-agnostic-monirepo-firebase-pipeline/ide_structure_be.png)

I built a little Express API for the initial testing, my index.js looks like this:

```
name: Make - Back End

# Controls when the action will run. Triggers the workflow on push or pull request
# events but only for the master branch
on:
  push:
    branches:
      - master
    paths:
      - 'be/**'

jobs:
  build:
    # The name of the runner and OS to run it on
    name: Build the Backend
    runs-on: ubuntu-latest

    steps:
      # Checkout just the most recent commit (fetch-depth 1)
    - name: Checkout Repo
      uses: actions/checkout@master
      with:
          fetch-depth: 1

    # Run the makefile with the Firebase Secret Token
    - name: Run Makefile
      env:
        NODE_ENV: production
        APP_CONFIG_TYPE: FUNCTIONS_CONFIG
        FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
        FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
        FIREBASE_SA_PRIVATE_KEY_ID: ${{ secrets.FIREBASE_SA_PRIVATE_KEY_ID }}
        FIREBASE_SA_PRIVATE_KEY: ${{ secrets.FIREBASE_SA_PRIVATE_KEY }}
        FIREBASE_SA_CLIENT_EMAIL: ${{ secrets.FIREBASE_SA_CLIENT_EMAIL }}
        FIREBASE_SA_CLIENT_ID: ${{ secrets.FIREBASE_SA_CLIENT_ID }}

      run: make be
```

I created a ‘utils’ folder that contains my logic for connecting to the Firebase database. The main file is is this utils/dbconn.js file which looks like this:

```
// utils/dbconn.js
const admin = require("firebase-admin");
const loadEnvVars = require("./dbConfiguration");
// console.log( require("../permissions.json"))
function createDatabaseConnection(configuration) {
  console.log(configuration);
  var firebaseDb = admin.initializeApp({
    credential: admin.credential.cert(configuration),
    databaseURL: "https://project-0000000000.firebaseio.com",
  });
  const db = admin.firestore();
  const auth = admin.auth();
  return { db, auth };
}
module.exports = createDatabaseConnection(loadEnvVars());
```

Line 6 (commented out) is what the Firebase documentation advises to do for development, where by instead of line 5, you just import a JSON file which contains all the access permissions.

You can download a JSON key file, most tutorials I found on the subject stick this in the functions folder and name it `permissions.json` or `serviceAccountKey.json`. There’s more information here: https://firebase.google.com/docs/admin/setup?authuser=0

![firebase_settings](/posts/2020-06-01-cicd-agnostic-monirepo-firebase-pipeline/firebase_settings.png)

What the documentation misses is how on earth do you make this file available to your deployment process. You can’t very well just commit that to to your repository, that would be a bad idea for a myriad of reasons.

Handily there’s a `firebase functions:config` series of commands you can use to make your local firebase development environment aware of some variables. https://firebase.google.com/docs/functions/config-env

The downside of this is you have to manually set all the variables you need in a format that’s not what you actually downloaded from the firebase console. **This is not intuitive at all** and caused me no end of confusion.

I also found that when running locally with either `npm run start` or `firebase emulators:start` it wouldn’t pickup what was set in the `functions:config` command, it did work for `firebase deploy` . More head-scratching, confusion and pawing through the documentation.

At this junction was getting frustrated with the situation, there seemed to be a huge gap between developing locally and being able to have this thing up and running in a sensible way that made my development experience simpler and more enjoyable. Being an absolute beginner was not helping either I imagine.

I looked through every article I could find on how to set this up in a way that works for development and deployment in something approaching sensible and found nothing. People were using an NPM module called DotEnv when local and something else when deploying. Or the permissions file one way then a method of checking what the NODE_ENV variable is set to on release and countless others.

In the end I decided that I would stick to using Environmental Variables as the method of deciding if this is a deployment of a development scenario. In development I wanted to set `APP_CONFIG_TYPE` to `PERMISSIONS_JSON` in order to use the `permissions.json` file I saved earlier. Or it could be set to `FUNCTIONS_CONFIG` if this was a deployment situation and to use the `firebase functions:config` mechanism.

I didn’t want to have to faff about with switching these things around either so I wrote this series of functions which will source the variables the right way. All it does is look for that Environmental Variable, check it and then load the appropriate thing. Meaning I don’t have to do anything with this ever again, perfect.

```
// utils/dbConfiguration.js
let functions = require("firebase-functions");
function pullFromFunctionsConfig() {
  console.log("Loading from firebase-config");
  let serviceAccount = {
    type: "service_account",
    project_id: functions.config().app.project_id,
    private_key_id: functions.config().app.private_key_id,
    private_key: functions.config().app.private_key,
    client_email: functions.config().app.client_email,
    client_id: functions.config().app.client_id,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-7ytiy%40${
      functions.config().app.project_id
    }.iam.gserviceaccount.com`,
  };
  return serviceAccount;
}
function pullFromPermissionsJson() {
  console.log("Loading from permissions.json");
  var fs = require("fs");
  try {
    var serviceAccount = require("../permissions.json");
    return serviceAccount;
  } catch (error) {
    console.log("No permissions.json file", error);
  }
}
function loadEnvVars() {
  console.log(
    "env is:",
    process.env.NODE_ENV,
    "& APP_CONFIG_TYPE is",
    process.env.APP_CONFIG_TYPE
  );
  const type = process.env.APP_CONFIG_TYPE;
  switch (type) {
    case "PERMISSIONS_JSON":
      return pullFromPermissionsJson();
    case "FUNCTIONS_CONFIG":
    default:
      return pullFromFunctionsConfig();
  }
}
module.exports = loadEnvVars;
```

In any situation I don’t want to be tied into a specific CI/CD tool set, they suffer too much from not being cool (ironic when using Makefiles) and needing to be changed due to project constraints or whims

I like my microservices and funtainers to be like Ikea furniture, they should have all the necessary tools and instructions to use them, development them and deploy them, this should all be self contained in said repository.

The format of that ‘flat-packing’ could be a Makefile, dockerfile, docker-compose files etc. it doesn’t really matter, as long as theres a way to use the included stuff to be able to build a development environment or simply deploy it (given the right privileges) that should be sufficient and is why I like Makefiles.

(That said, Makefile syntax is a bit long in the tooth and hard to follow sometimes)

In this example I wanted to be able to, from the ‘BE’ folder, run a command to bring up development, and another to deploy the thing. This is what I settled on:

```
# BE/Makefile
debug:
	$(info Debugging)
	cd functions && export APP_CONFIG_TYPE=PERMISSIONS_JSON && npm run serve

build:
	$(info Install npm dependancies from the functions folder)
	cd functions && npm install

	$(info Install firebase-tools globally)
	sudo npm install -g firebase-tools

deploy:
	# Firebase functions don't currently supported targeted deployment
	# $(info Set the Firebase target for the BE function)
	# firebase target:apply hosting dev-firebase-pipeline

	$(info Set the firebase config)
	firebase functions:config:set \
	app.type="service_account" \
	app.project_id="$$FIREBASE_PROJECT_ID" \
	app.private_key_id="$$FIREBASE_SA_PRIVATE_KEY_ID" \
	app.private_key="$$FIREBASE_SA_PRIVATE_KEY" \
	app.client_email="$$FIREBASE_SA_CLIENT_EMAIL" \
	app.client_id="$$FIREBASE_SA_CLIENT_ID"
	firebase functions:config:get

	$(info Deploy to Firebase project)
	firebase deploy - token ${FIREBASE_TOKEN} - only functions
```

The debug section is pretty simple,

In the BE folder you can now run `make debug` and it’ll go away, change directories to the `functions` folder, export the Environmental Variable which tells the function we wrote above to use the `permissions.json` file and finally run ‘npm run serve’.

This could quite easily not include the `cd functions && ` bit and use `firebase emulators:start` either works fine and the ‘npm run serve’ method let me use breakpoints in VS Code _which I couldn't get working with firebase emulators_

Happy development process, low effort for repeatability and nice experience makes for a happy learning environment.

Next comes the deployment part, again pretty easy, although I do confess to being a bit of a hypocrite here about using multiple methods for achieving the same goal.

Because the `firebase function:config` mechanism needs access to the credentials it gets a bit cumbersome. Most CI tooling supports a method for presenting `secrets` in some way and usually it’s as an Environmental Variable.

Here I am expecting the session to have `FIREBASE_PROJECT_ID`, `FIREBASE_SA_PRIVATE_KEY` etc all available as environmental variables for the session. Whilst locally that’s going to require entering them manually, in the CI/CD tool, I would expect these to be available. (the double $ is the Makefile way of escaping weird stuff in the variable like \n etc).

Also, notice the comment section in `deploy`. As briefly mentioned somewhere above, a second hosting site in a Firebase project needs to be `targeted`, at the time of writing Functions don’t support that and will always use the default site. Hopefully this changes in the future but for now that is just commented out.

There’s reference here to a ‘FIREBASE_TOKEN’ variable, this should be the output of `firebase login:ci`. This is just like the regular login command but it gives you a token that can be used for subsequent logins without needing to authenticate manually using the browser redirect. Ideal for CI/CD deployment.

## Quick Frontend
We care a bit less about the front end, Mostly because i’ve not quite gotten to learning that bit beyond `hello world` just yet.

In the `FE` folder, initialise a Vue.js or React project (or whatever else you wish to use) and make sure it’s functional. Again, there are tons of projects on the basic preparation of this sort of thing.

Once we are happy with the basic frontend app, it’s time for another Makefile. Similar structure, there’s a `make debug` option and the steps to build and deploy:

```
 FE/Makefile
debug:
	$(info Debugging)
	npm run serve

build:
	$(info Install npm dependancies from the functions folder)
	npm install

	$(info Build package)
	npm run build

	$(info Install firebase-tools globally)
	sudo npm install -g firebase-tools

deploy:
	$(info Set the Firebase target for the Web function)
	firebase target:apply hosting web dev-firebase-pipeline-web

	$(info Deploy to Firebase)
	firebase deploy - only hosting:web - token ${FIREBASE_TOKEN}
```

This time when we get down to the deployment phase, we need to ensure the ‘FE’ gets deployed to the ‘web’ target. To make sure this sticks there’s also an update to the `firebase.json` file in the `FE` folder that needs to be made.

Add a `target` element to the `hosting` parent, which matches the target we specified in the Makefile target command. Note the target in the command needs to match the one created for the frontend in the `Firebase` console.

![ide_json](/posts/2020-06-01-cicd-agnostic-monirepo-firebase-pipeline/ide_json.png)


## String It All Together
Now we have two separate projects, each with their own development and deployment process. We need a way to make these executable from the root folder to make CI/CD setup nice and simple.

In the root of the repository we have, you guessed it, another Makefile:

```
## SETUP ##
# Get Git revision from the repository
REV:=$(shell git rev-parse HEAD | cut -c1–7)

.PHONY: $(shell echo -e "$(shell grep -e '^[^\s^.]\+:' Makefile | cut -d: -f1 | tr '\n' ' ')")

## LOGIC ##
be: be/build be/deploy
fe: fe/build fe/deploy

## IMPLEMENTATION ##
# BE
be/debug:
	@$(MAKE) -C BE debug

be/build:
	@$(MAKE) -C BE build

be/deploy:
	@$(MAKE) -C BE deploy

# FE
web/debug:
	@$(MAKE) -C FE debug

web/build:
	@$(MAKE) -C FE build

web/deploy:
	@$(MAKE) -C FE deploy
```

Now we can run `make be/debug` and it’ll kick off the `debug` for the Backend or just `make be` which will run the build and deployment commands for the Backend and it should build and deploy the back end. Not much more to it than that.

The `$(MAKE) -C` part essentially just re-runs the `make` command in the target folder specified.

![makefile_all_the_things](/posts/2020-06-01-cicd-agnostic-monirepo-firebase-pipeline/makefile_all_the_things.png)


## A test CI: Github Actions
To test all this out, I figured Github actions was the place to start, it’s just 2 clicks away on the same repository where my code lives, what could be easier.

I want a build to happen every time I push code to the `Master` branch of my repository, but I don’t want it to build the BackEnd when I push code to the FrontEnd folder as that would just be pointless and potentially disruptive.

![workflow](/posts/2020-06-01-cicd-agnostic-monirepo-firebase-pipeline/workflow.png)

Create a folder in the `.github` folder in the root of the repository called `workflows` and create two `.yml` files. This is the folder that GitHub actions looks in for action workflows

**BE.yml**
```
name: Make - Back End

# Controls when the action will run. Triggers the workflow on push or pull request
# events but only for the master branch
on:
  push:
    branches:
      - master
    paths:
      - 'be/**'

jobs:
  build:
    # The name of the runner and OS to run it on
    name: Build the Backend
    runs-on: ubuntu-latest

    steps:
      # Checkout just the most recent commit (fetch-depth 1)
    - name: Checkout Repo
      uses: actions/checkout@master
      with:
          fetch-depth: 1

    # Run the makefile with the Firebase Secret Token
    - name: Run Makefile
      env:
        NODE_ENV: production
        APP_CONFIG_TYPE: FUNCTIONS_CONFIG
        FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
        FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
        FIREBASE_SA_PRIVATE_KEY_ID: ${{ secrets.FIREBASE_SA_PRIVATE_KEY_ID }}
        FIREBASE_SA_PRIVATE_KEY: ${{ secrets.FIREBASE_SA_PRIVATE_KEY }}
        FIREBASE_SA_CLIENT_EMAIL: ${{ secrets.FIREBASE_SA_CLIENT_EMAIL }}
        FIREBASE_SA_CLIENT_ID: ${{ secrets.FIREBASE_SA_CLIENT_ID }}

      run: make be
```

**FE.yml**
```
name: Make - Front End

# Controls when the action will run. Triggers the workflow on push or pull request
# events but only for the master branch
on:
  push:
    branches:
      - master
    paths:
      - 'web/**'

jobs:
  build:
    # The name of the runner and OS to run it on
    name: Build the Backend
    runs-on: ubuntu-latest

    steps:
      # Checkout just the most recent commit (fetch-depth 1)
    - name: Checkout Repo
      uses: actions/checkout@master
      with:
          fetch-depth: 1

    # Run the makefile with the Firebase Secret Token
    - name: Run Makefile
      env:
        NODE_ENV: production
        FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
      run: make web
```

You should notes there are references to `secrets.VARIABLE` dotted throughout these files. In Github add some secrets to your project

![github_secrets](/posts/2020-06-01-cicd-agnostic-monirepo-firebase-pipeline/github_secrets.png)

There should be one for the `FIREBASE_TOKEN` which stores the output of the `firebase login:ci` command. Then a named variable for each of the items found in that Service Account `permissions.json` file. These `secrets` will be present in the build environment and referenced accordingly.

Because every CI/CD tool is different, at this point we don’t actually care. The `.github/workflows/file.yml` can reference its secrets this way but you could also have a Jenkins file doing the same thing and calling its own variables in its own mechanisms. Because that aspect is tooling dependant it doesn’t matter, what does matter is the commands the variables are getting used by once set, in this case the inputs for the ‘firebase functions:config’ that’s going to be used when we run ‘firebase deploy’ shortly after.

That’s pretty much it, the ‘Actions’ tab will now show a building process when changes are pushed to the ‘master’ branch for either the FE or BE folder, the result of which should be a passing build.

![github_action_run](/posts/2020-06-01-cicd-agnostic-monirepo-firebase-pipeline/github_action_run.png)

I did have to do quite a bit of faffing about with the `FIREBASE_SA_PRIVATE_KEY` variable as it didn’t like the `\n` characters present in the JSON file or the absence of them, that took a few tries to get working but the output of the Github Action console was enough to debug which way round I had got it.
