---
author: "Aiden Vaines"
title: "PowerShell Framework"
date: 2017-05-28
description: "A small PowerShell Framework"
# featured_image: /blog/2017-05-powershell-framework/featured.png
tags: [
  "code",
  "powershell",
  "posh-fw",
]
---

Writing code that can be maintained by multiple people always requires some sort of structure. A lot of the frameworks I have seen are overly complicated for what is still essentially quite small scripts. So I decided to build my own

My requirements were for a small, extensible framework I can use for quick scripts, everything I found online was overly complicated. All I needed was a simple framework so all my scripts are a similar format, work in a similar way, can be moved around without too much fuss and can be easily debugged by someone else should they have issues.

[Follow this project on GitHub](https://github.com/n3rden/Powershell-Template)


To start off I asked myself what I want;

  1 **Simplicity**; This needs to be simple to read, reproduce and trace issues.

  2 **Troubleshooting**; Tracing a script that's run automatically in the background that failed should be just as easy to trace the fault as if I were stepping through the code. Logging will need to be important
  
  3 **Modular**; I want to be able to write other modules that I can just slot in when needed. Re-usable parts from other scripts without having to rewrite bits. Things like a module for connecting to Office 365 or a suite of functions I use often.
  
  4 **Consistency**: Scripts I have written two weeks ago can be difficult follow, one I wrote last year will be unrecognisable. Structure and framework will be important, I should be able to pick up any script and be able to roughly follow it because they all look and feel the same.

## Structure
![Structure](/blog/2017-05-powershell-framework/psh-framework-structure.png)

I've tried to keep things separated so they are easy to locate, easy to modify and easy to follow.

The &#8220;Verb-Driver.ps1&#8221; file is the work-horse of the framework, this is the file you run to execute the script or schedule a task to run.

The driver will set up the script environment by calling functions or initializing things.

![Flow](/blog/2017-05-powershell-framework/psh-framework-flow.png)

Firstly the config file will be loaded. The *Config.ps1* file by default contains the log folder, naming structure and file name format, it should also contain any variables which may be used every time the script is run.

This could be done with command line arguments, however if every time I run a script I have to enter a particular argument, that&#8217;s a waste of time. If the script runs as a scheduled task, it&#8217;ll be easier to update the config file than update the scheduled task.

Secondly the Logging module is loaded and initialised, this will trigger the log folder to be created and a log file to be created. If the folder and log file already exist the log file will be appended.

Next, any other modules should be loaded (in the template&#8217;s default state the &#8220;Sample-Functions.ps1&#8221;).

If any of these three sections are to fail for any reason they script will terminate and to avoid causing any potential damage.

Once the script is initialised and ready to perform custom actions the main script block can be run, safe in the knowledge that modules are loaded, the script is logging and config files are loaded.

The main script block is where the specific code for the project/tasks goes, this may be processing data from the config file, processing CSV files and other data and exporting some sort of result.

When writing a main script block use the following structure to write messages to the log file.

```
Log-write -logpath $Script:LogPath -linevalue "A message"
```

In it's default state these messages will be written out to console as well as the file. This can be altered in the config file by changing the ```$Script:LoggingDebug``` variable to ```$false```


The resultant log file will look something like this:

 ![pshLog](/blog/2017-05-powershell-framework/psh-framework-screen1-log.png)
 
The output on the PowerShell console will show the same information

 ![pshLog](/blog/2017-05-powershell-framework/psh-framework-screen2-psh.png)

Once the Main script block has completed, any session variables will be cleaned up and the log file finished off.

 ![pshLog](/blog/2017-05-powershell-framework/psh-framework-screen3-logend.png)

In future I would like to include some sort of unit testing, perhaps with Pester or something similar but I am still trying to learn this so it might be a while.

The logging script is cobbled together and cribbed from scripts found online. I want to re-write this to be more efficient for how I use it. I would also like to add a syslog option which would be useful for running scripts on schedule.

**NOTE:** PowerShell below version 4 might have issues using the framework
