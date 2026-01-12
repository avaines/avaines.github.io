---
author: Aiden Vaines
title: >-
    Finding the most and least frequent list elements in JavaScript
date: 2022-02-03
image: featured.png
featured: true
categories:
  - JavaScript
---

#### The Problem
I love working through the [Advent of Code](https://adventofcode.com) puzzles, this year I decided it was a good opportunity to learn some JavaScript. Having only ever done some very basic stuff with JS before, there's no time like the present

I quickly found some things ive become used to in Python were just not a thing in this foreign land.

Mild Spoiler Alert:
Day 3 requires a number of inputs to be processed to figure out both the mode elements in a list, for example:
~~~
[1, 1, 2, 3, 4, 5, 5]
~~~

The first part of the puzzle needed you to figure out the largest modal value and other want the lowest modal value. The example list contains both two 1's and two 5's. Clearly I needed a function to get me the modal values in a list, sort it and voila. First element is the lowest (my_list[0]), first element is the largest (my_list[-1]). Job done.

...

Job not done :(
Then came the kicker, you also needed the anti-mode(?) or the least frequent element in the list. That example would show one 2, 3 and 4, and again the lowest and highest values accordingly (so 2 and 4).


#### The Challenge
I feel like I scoured the internet for hours to find something which would work and (most importantly) didn't require a lot of JavaScript knowledge which I clearly don't have. After Stack Overflow failed me, I came across [this post on 'tutorialspoint'](https://www.tutorialspoint.com/get-the-item-that-appears-the-most-times-in-an-array-javascript) which did something close.


#### My Solution

One step forward, I now have some code which for a given list will return another list of the most common elements.

Now I either needed two functions, one for most frequent, the modal, and one for least frequent, the anti-modal. Initially I tried again looking through the usual locations to no avail.

I took apart Amit's code, learning quite a lot in the process and came up with the below, Its not the most elegant and I'm sure is inefficient. But hey it works (and it's commented!).

Having solved the Day 3 puzzle with it I hope someone can make further use of it in future.


~~~ javascript
function getFrequent(array, leastFrequent=false) {
  if (array.length == 0) return null;

  let frequencyMap = {}
  let minElements = []
  let maxElements = []

  for (var i = 0; i < array.length; i++) { // for every item in the array (indexed)
      var element = array[i];           // set el to the current element from the source array

      // Ensure the current element is represented in the map
      if (frequencyMap[element] == null) {   // if frequencyMap doesn't contain an instance of this element add it
          frequencyMap[element] = 1;
      } else {                    // otherwise, there is an instance of it, increment it
          frequencyMap[element]++;
      }
  }

  let minCount = frequencyMap[Object.keys(frequencyMap)[0]]
  let maxCount = frequencyMap[Object.keys(frequencyMap)[0]]

  // Get the lowest and highest occurence
  Object.keys(frequencyMap).forEach(key => {

      if (frequencyMap[key] > maxCount){
          maxCount = frequencyMap[key]
          maxElements = [key]             // If this element has a higher count than everything before it, empty the array and it must be this one
      } else if (frequencyMap[key] == maxCount) {
          maxElements.push(key)           // If the element has same number of occurrences of the the current max, add it to the max array
      }

      if (frequencyMap[key] < minCount){
          minCount = frequencyMap[key]    // If this element has a lower count than everything before it, empty the array and it must be this one
          minElements = [key]
      } else if (frequencyMap[key] == minCount) {
          minElements.push(key)           // If the element has same number of occurrences of the the current min, add it to the min array
      }
  });

  if (leastFrequent==true) {
      return minElements.sort()
  } else {
      return maxElements.sort()
  }
}

myList=[1, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5]

// Get the most frequent elements in the list
// Outputs '[5, 5, 5, 5, 5]'
console.log( getFrequent(myList) );

// Get the least frequent elements in the list
// Outputs '[1]'
console.log( getFrequent(myList, true) );
~~~
