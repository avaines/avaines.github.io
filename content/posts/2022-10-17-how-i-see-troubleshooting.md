+++
_template = "blog_post"
author = "Aiden Vaines"
catagories = ["ops"]
date = 2022-10-17T19:00:00Z
featured = true
image = "/uploads/throubleshooting.png"
tags = ["ops", "devops", "meta"]
title = "How I See Troubleshooting"

+++
When I've been involved in an incident or dragged in to one of those "if we get enough people involved one of them might know" calls, one of the first things that usually catches my attention is the lack of solid troubleshooting that's gone on.

Usually this is because the issue had only just occurred or the people who had been involved up to this point had started at step 5, not step 1 of troubleshooting. Frequently it's because the full picture of how the service hangs together wasn't clear to all parties; which admittedly makes troubleshooting significantly harder.

_This issue cropped up first thing this morning and by 10 I had most of this in my head and needed to write it down, so here goes..._

## Lets get troubleshooting

A lot of people have written some very good things about the theory and mechanics of good troubleshooting, but from my experience these need to be VERY simple to be effective during a crisis/incident/outage/hangover.

_For the sake of this, I'm also assuming you have a reasonable to good understanding of the service/application/workload that's currently on fire._

### 1) Whats the problem? But like, really.

The standard minimum dataset I would expect or immediately start working on is always the 5xW's:

* What is the issue?
* Who is affected by the issue?
* Why has this started occurring?
* Where is experiencing this issue? (live? staging? just the french sites?)
* When did this start being an issue?

### 2) Hmm, could it be...?

You should have a reasonable idea of the failure mode at this point. Simply follow the obligatory XKCD [https://xkcd.com/627/](https://xkcd.com/627/ "https://xkcd.com/627/"), but if that doesn't work...

As part of #1 you should have a good idea of log messages which relate to the issue. Have any areas of code which intersect where these logs are generated changed recently?

Don't be worried about questioning the obvious, Occam's Razor and so on; just because it could be an issue AWS are having on their control-planes that hasn't been reported, it's more likely to be that commit which got pushed in at 5pm yesterday.

Start from the top (or bottom) and work down (or up) from the layers of the application and the stack; the more you can rule out the easier it is to start pinning down where an issue lies.

This is the stage where you will be tempted to make all-the-changes, because everything is on fire and people are panicking. But you are not, you are chill, you are the epitome of rationality.

When this issue is resolved, you are going to need to fill in that RCA document and prepare tickets and works to resolve underlying issues to properly fix the issue. Make notes as to what you are changing and possibly more importantly WHY you are making those changes.

Did you see something specific in the logs which led you to enabling additional debugging which led you to a certain area of the network or codebase? In a week that could be as important as how you fixed the problem.

### 3) Was it that?

Was your assumption correct? Are you really really sure? Was this change you just made combined with the one you made 10 minutes ago the solution? You didn't change multiple things before testing did you?

If it didn't work, GOTO 1, maybe reviewing the basic problem with the additional context and knowledge gained so far will help. Repeat as necessary.

### 4) Make it permanent

You've probably just made several changes that didn't fix the problem and likely only un-did several of those. Tidy up after yourself. Don't wait for a week to go by and wonder why that instance has just run out of storage because you left all the extra logging enabled.

The internet is held together with sticking plasters, duct tape and string, don't be part of the problem and make sure what you just did is done properly. Put tickets on back logs, raise risks and put time in your calendar to fix that problem properly while it's still fresh in yours and your team's minds.

**That 'tactical' fix you just made will outlive you if you don't do this.**

### 5) Document it

By Document it, I don't just mean completing an RCA document and forgetting about it.

Was the issue caused by not following (or total lack of) process? Was it caused by inexperience? Was it caused by a bug or other flaw in the service? Was it caused by untested/bad code escaping somewhere?

All this stuff shouldn't occur but does and probably did, its what you do next that matters.

Can you create an alert in your observability tool-bag to detect such an occurrence of a similar or the same problem? Can you shore up the documentation/run-books/process docs to make it clearer? Can you add new tests either unit, automated or otherwise to better cover the related failure modes? Can you improve your team's knowledge transfer process to faster plug gaps? _(Can you remove Ian's access to production?)_

## Now go shoot your troubles

Really understand the problem statement and the impacted areas of the workload before starting anything else. Sometimes this includes which related parts of the workload are actually working as much as the on-fire bits.

For the love of Hephaestus, write down what you are changing and why before you forget three changes down the line.
