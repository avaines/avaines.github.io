---
draft: false
author: Aiden Vaines
title: A Unix Tree command - but for S3!
image: hero.gif
categories:
  - thing
  - javascript
  - code
  - cli
  - aws
date: 2025-06-06T00:00:00.000Z
app_url: "https://www.npmjs.com/package/s3tree-cli"
code_url: "https://github.com/avaines/s3tree"
blog_url: "#"
---

I was trying to visualise some S3 buckets for a cost optimisation exercise and wanted to be able to run a Tree command on it, obviously thats not a thing the Unix command can do ... and I've been playing with JavaScript recently.

Earlier in the week I had used a tool which was installed from NPM as a global package, rather than defaulting to Python as I might usually have done I instead opted to do a bit of JavaScript which ive been trying to teach myself more of since [the time it ruined Christmas](posts/2022-02-03-javascript-most-and-least-frequent-list-elements) and [it funds my hobbies](posts/2024-10-22-building-a-simple-ecommerce-site-with-hugo-cloudflare-workers-and-square/) ([*please buy my wares*](https://shop.vaines.org))

So, off I went, pulled the arguments the Unix Tree command lists in the Man pages, removed the ones that where too complicated for me to think about and started writing code the features I ended up with can be boiled down in to 4 categories:
* Visualizes S3 bucket contents as a directory tree
* Supports filtering, sorting, and formatting options
* Supports AWS region and role assumption
* Supports text, json, and yaml output

Python is my default language for things more anything more complicated than BASH, and I would usually use the [argparse](https://pypi.org/project/argparse/) package. In JavaScript, [yargs](https://www.npmjs.com/package/yargs) seems to be the alternative mostly because of the pirate themed icon. From there I just broke down what I needed and away I went; the recursion for building the object tree is still beyond my JavaScript skillz but not beyond ChatGPT & [CoPilot](https://docs.github.com/en/copilot/managing-copilot/managing-copilot-as-an-individual-subscriber/getting-started-with-copilot-on-your-personal-account/about-individual-copilot-plans-and-benefits#github-copilot-free).

I even wrote Unit tests! Jest seems way easier than Pytest to use, write, execute and debug.

It's even got badges when the workflow runs - if that sort of thing on a new project doesn't give you the warm-fuzzies, nothing will.
[![Status](https://github.com/avaines/s3tree/actions/workflows/main.yml/badge.svg)](https://github.com/avaines/s3tree/actions/workflows/main.yml)
