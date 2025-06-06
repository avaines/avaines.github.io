---
draft: false
author: Aiden Vaines
title: A sort of golf related game about synonyms.
image: "/things/2025-05-15-word-golf-game/hero.png"
categories:
  - thing
  - javascript
  - code
date: 2025-05-15T00:00:00.000Z
app_url: "https://golf.vaines.org"
# code_url: "#"
# blog_url: "#"
---

I've been trying to think of a small game idea I could build as a way of playing with React and came up with a small game about guessing synonyms.

The concept would be for a player to guess a handful of synonyms for a word they are presented with in a short number of guesses, which made me think of golf...


**Word Golf** is a game where you try to find the shortest possible synonym for each given word. Like golf, the goal is to use as few letters as possible while minimizing failed attempts!

### Rules:

    Each game consists of 5 words (holes)
    For each word, enter a valid synonym
    Your score is the number of letters in your answer plus any failed attempts
    You have 3 attempts per word before automatically moving to the next one
    Par is calculated as the median length of all possible synonyms
    Try to score under par by finding short synonyms with minimal attempts!

### Scoring Example:

Word: "Dangerous" (Par: 5)
    "Risky" on first try = 5 letters (Par)
    "Dire" on first try = 4 letters (1 under par)
    "Unsafe" after 2 failed attempts = 6 letters + 2 = 8 (3 over par)
    Failed all 3 attempts = Par + 3

### Tips:
    Think carefully before guessing to avoid penalty points from failed attempts
    Consider skipping a difficult word rather than using all attempts
    Short synonyms are great, but only if you can find them quickly!
