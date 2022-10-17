+++
author = "Aiden Vaines"
catagories = []
date = 2022-10-16T23:00:00Z
draft = true
featured = true
image = "/uploads/throubleshooting.png"
tags = ["devops", "meta"]
title = "How I See Troubleshooting - A Crashcourse"

+++
When I've been involved in an incident or dragged in to one of those "if we get enough people involved one of them might now" calls, one of the first things that usually catches my eye is the lack of troubleshooting.

Some times this is because the issue has only just occurred or the people who had been involved up to this point had started at step 5, not step 1 of troubleshooting.

This cropped up first thing this morning and by 10 I had most of this in my head and needed to write it down, so here goes...

## Troubleshooting

A lot of people have written some very good things about the theory and mechanics of good troubleshooting, but from my experience these need to be VERY simple to be effective during a crisis/incident/outage/hangover or they just won't be at the forefront of my mind.

### 1) Whats the problem? But like really.

What is the issue?

Who is affected by the issue

Why has this started occurring?

Where is experiencing this issue? (live? staging? just the french sites?)

When did this start being an issue

### 2) Hmm, could it be...?

1. Establish a theory of probable cause

Keep a log of everything you do, and importantly the reason you got to the conclusion that you needed to change that thing

### Was it that?

Test it

if not GOTO1

### Make it permanent

You've probably just made several changes that didn't fix the problem and likely only un-did several of those. Tidy up after yourself, don't wait for a week to go buy and wonder why that Jenkins instance has just ran on of storage because you left all the extra logging enabled.

The internet is held together with sticking plasters, duct tape and string, make sure what you just did is done properly. Put tickets on back logs, raise risks or put time in your own calendar to fix that problem properly while its still fresh in your and your teams minds.

That 'tactical' fix you just made will outlive you if you don't do this.

### Document it

By Document it, I don't just mean completing an RCA document.

Can you create an alert in your observability tool-bag to detect such an occurrence of a similar or the same problem

1. 

## Now go shoot your troubles.

Really understand the problem statement and the impacted areas of the workload. But equally which related parts of the workload are actually not on-fire.

Keep a log of what you are changing,

For the love of Hephaestus, write down what you are changing and why before you forget 3 changes later.