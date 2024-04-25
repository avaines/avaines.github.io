---
author: Aiden Vaines
title: >-
  Many to one mailmerge aka Manager mail merge
date: 2017-05-28
featured: false
# image: "/posts/2017-11-09-Many-to-One-Mailmerge/featured.jpeg"
categories:
  - Powershell
---

Sometime it's necessary to email an individual about multiple people. Sometimes, its necessary to email loads of people about loads of people.

I needed a way to email managers about staff in their team who were receiving new equipment. As this was multiple people in multiple teams with multiple managers it was a bit out of the scope of what mail merge is designed to handle.

[Follow this project on GitHub](https://github.com/avaines/Random-Powershell-Scripts/tree/master/Start-ManagerMailMerge)


The script takes a "source.csv" layed out like this:

| ID | Name | Device | ManagerID | ManagerName | ManagerEmail |
|---|:---|:---|:---|:---|:---|
| 1001 | Joe Bloggs | iPhone 6 | 2001 | A | A@domain.com |
| 1002 | Steve Jones | iPhone 5 | 2001 | A | A@domain.com |
| 1003 | Dan Smith | iPhone 6 | 2002 | B | b@domain.com |


For each unique manager in this list ("A" and "B") a new email will be created based on an html template "_template.htm". addressed to the manager and containing a formatted table with their staff.

![screenshot1](/blog/2017-11-09-Many-to-One-Mailmerge/managermailmerge_1.PNG)

Using the table above, manager "A" will recieve and email about employees 1001 & 1002, and manager "B" about employee 1003. 


# Setup

* Edit the *"_template.html*" file in MS Word (to retain the formatting)
* Edit/replace the *"sourcedata.csv"* file, retaining the headers
* Run the script
* All messages will sit in outlooks *"Draft"* folder until ready to send


# To Do/Extension
1) Automatic sending
    The initial use case for this script need it to be sent by outlook at a given time

2) More options!

3) Inline processing
    This wasn't required initially but it might be useful to be able to accept the sourcedata table/object via a pipe or argument
