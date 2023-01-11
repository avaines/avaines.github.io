+++
author = "Aiden Vaines"
catagories = ["Terraform"]
date = 2019-10-19T23:00:00Z
featured = false
image = ""
tags = ["AWS"]
title = "Terraform: Taxing, Tangled & a bit Tenuous"

+++
One of the first tools I picked up walking in to the DevOps world was Terraform, I found it a bit challenging to get to grips with one major concept. The language itself is easy enough to get to grips with but actually structuring anything slightly complex just didn’t click for me.

When picking up a new technology I like find a book or video series from the tech vendor or a publisher I respect. Usually one of O’Reilly’s and plough through the book. Once I’ve got a somewhat working knowledge of the thing, I will put together a simplified version of whatever it is I’m trying to do or model something I have built in the past using similar technologies.

When trying to learn Terraform I followed this same pattern, looking through YouTube videos for overviews or small project tutorials, and skim through a book on the tool.

If you have not done anything with Terraform before its essentially a way of documenting the desired state of your infrastructure so it can be repeatable.he There’s a lot more to it than that obviously but that’s the gist. There are many other tools for doing this like AWS’s own CloudFormation or Ansible does a decent job too.

Terraform differs in that it has support for many different ‘providers’ and you describe your infrastructure using Hashicorp’s HCL, it’s a bit like JSON and Ruby.. sort of. It looks something like this:![](https://miro.medium.com/max/1372/1*44Fr-jcIS-PcI4bqt1Y7PQ.png)

When you want to make the stuff you have written in to something real, the Terraform binaries take your code, analyse what you have written and work out how badly you’ve written it and throws up some error messages. Or hopefully tells you what is going to be changed or created as a result.

When trying to learn something new you are going to run in to tones of issues and end up just Googling your way through the issue. This is where the confusion started for me.

The immediate challenge is learning the new language, syntax, structure, referencing and everything. The O’Reilly book took care of most of this and give a pretty good overview of how to write it and assemble files, modules and so on. The book also assumes you are going to write Terraform in a specific way, which is fine for learning but the second I took this and tried to scale it up in to something useful I ran in to some immediate issues with keeping things DRY (Don’t Repeat Yourself).

![](https://miro.medium.com/max/1220/1*09IEYtkb0fQYgi_ubeQeUQ.png)

The book recommends you structure your project sort of like this, where you have a ‘component’ which references a number of modules.

In this example there are two modules, one for creating a keypair and putting it in secrets manager along with a second module for creating a webserver.

The ‘myplatform’ folder is a component which will call the various modules in order to create a keypair, and a couple of webservers.

Easy enough concept to get going; what happens if you want to use the same code but to separate Dev and Prod instances? You can use ‘tfvars’ files and use them like an answer file containing specific variables for your environments like instance size, IP addresses etc.

To get these different environments to work correctly you need to implement workspaces, which didn’t appear to exist or be widely used when the book was written and instead recommends using Terragrunt. Again this didn’t help a beginner.

This structure is simple and easy to follow if you are starting out, which is exactly what I was doing. It doesn’t exactly hold up to anything complicated. Deploying to different environments means tangling with Workspaces and changing the code in the ‘myplatform’ folder could lead to breaking your production setup quite easily.

If you go down the route of creating multiple components you have to import them in them from the Terraform state file in order to reference them. But keeping them together in the same component gets overwhelming quite quickly.

When looking through StackOverflow for the solutions to some of the issues I was facing it became quickly apparent that there are a load of different ways to write and structure a Terraform project of any sort of complexity. Some of them make more use of other Terraform functionality than others. Initially I thought maybe the book I was reading was out of date, given the bits about workspaces and so on.

I figured a quick YouTube series or two would should be enough to fill in some blanks.

![](https://miro.medium.com/max/1288/1*6J2gHEnXHeyR-tILZcA6UA.png)

I found a couple of series of videos, which I have completely lost other wise I would include links, where they structured the project something like this. Keeping the above example in mind we still have two modules and a ‘myplatform’ component.  
  
This time the Dev and Prod environments are split in to two separate folders, each still uses the modules for creating webservers and keypairs but they are separated meaning the risk of affecting Prod when changing Dev is reduced. We have the answer files to provide answers for things like instance sizes and so on.  
  
The downside of this arrangement is also the same as the previous structure. Rather than managing Terraform’s workspaces we have to manage any difference between Dev and Prod folders when making change to the infrastructure code as deviation could occur quite easily.  
  
This is fine but continues to be a bit of a pain for anything complicated, with differences between the Dev and Prod folder quickly become a risk.

I had the chance to work on an existing project where they had got some complicated infrastructure and needed to resolve the challenges I had seen up to this point.

![](https://miro.medium.com/max/1400/1*ydUZ8KebJO64hRUcrVkRUg.png)

I have simplified the teams setup continuing from the previous examples.

They have retained the separation of components to avoid using workspaces and grouped them by the environment. The major change is is the ‘shared’ folder which contains the core code for the components.

These shared components are symlink’d into the environment meaning each environment folder is using their own answer file but retains the shared infrastructure code.

The major downside of this is the reliance on symlinks. We found very quickly if you’ve got someone using a windows device, this structure will get broken the first time they clone the repository because Windows still doesn’t play nice with symlinks. (The solution to this is making them use a Linux VM or WSL).

Overall this works really well if not possibly a bit over complicated when you are trying to get to grips with the tool.

In summary, learning Terraform itself was not difficult, the complexity arose from there being no one way to correctly assemble a project, every StackOverflow article I saw when figuring how to solve an issue I had assumed you were setting up a project in a particular way. If you understand the tool this would be fine as you can make it fit your use case. When learning you still don’t have the pre-requisite knowledge and experience to do this which adds to the learning curve.

Whichever way you decide to assemble the project will have potential future ramifications for the ability to debug, evolve or improve your code. It also limits the ability to port your code to someone else's project without some serious refactoring required and in the worst case building up the wrong way could mean you find yourself re-writing the entire thing.