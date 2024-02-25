---
draft: true
title: >-
  Platform Engineers hate these 5 simple patterns for packaging AWS Lambda
  functions
author: Aiden Vaines
image: /uploads/Lambda packing hero.png
featured: true
tags:
  - Terraform
  - CI/CD
  - AWS
date: 2024-02-25T00:00:00.000Z
---

There are many ways to manage cloud infrastructure and code we cram onto. in working with projects from the scale of one person, where I am the target demographic and its built by me, to supporting a platform with millions of daily users; there are some considerations on how I think we should consider workflows and how we deliver code.

I think it's important to set out that the needs of a small project with a couple of functions and a single developer vary significantly from a project with large development teams, several workflows and product ownership focuses. I wouldn't want the entire application to be developed because a team added a new widget, these should be atomic changes with the smallest possible blast radius.

Everything I'm about to whitter on about has working code examples here: [https://github.com/avaines/terraform\_lambda\_build\_options](https://github.com/avaines/terraform_lambda_build_options). I've tried to ensure these are all in the simplest form I could to get the pattern across.

I've set some basic requirements I want to achieve with a workflow I want to see in something of scale in the real world.

1. Lambda function code should be versioned, promotable, and targetable. An environment should be able to use a specific code version.
2. The code a function is running should be identifiable and retrievable for analysis.
3. Functions should not be replaced unless a change has occurred.

## 1) The Classic: Copy-&-paste from the docs

*Sample Code: [https://github.com/avaines/terraform\_lambda\_build\_options/tree/main/option1](https://github.com/avaines/terraform_lambda_build_options/tree/main/option1)*

First up is the easiest option, It's what the Terraform documentation shows, so just copy, paste and switch up the file names and we are good to go!

Terraform's documentation for the `aws_lambda_function` resource [https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda\_function](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_function)

It looks something like this,

```hcl
data "archive_file" "lambda" {
...
}

resource "aws_lambda_function" "test_lambda" {
  filename = data.archive_file.lambda.output_path
  source_code_hash = data.archive_file.lambda.output_base64sha256
...
}
```

A very simple chain of resources, Terraform's archive provider ZIPs up the Lambda code, creates a `aws_lambda_function` resource and provides the code bundle.
![option 1 diagram](https://raw.githubusercontent.com/avaines/terraform_lambda_build_options/main/option1/diagram.png)

The Terraform dependency graph is really simple to follow We've got some code, a Lambda function and an IAM role all attached.
![option 1 terraform graph](https://github.com/avaines/terraform_lambda_build_options/raw/main/option1/graph.png)

### How does that stack up against the requirements I set out at the start?

**Lambda function code should be versioned, promotable, and targetable. An environment should be able to use a specific code version.**
Assuming the Lambda code is always in a git repo and changes are checked in as part of the workflow :white\_check\_mark:

We don't produce any artefacts that can be reused by other deployments as the code is bundled at apply-time, we can't promote a lambda to another stage like Dev to UAT or into production without re-bundling it. If we can't do that we can expect "Well, it worked in my environment" to be whispered from the shadows at some point.

**The code a function is running should be identifiable and retrievable for analysis.**
We'd need to add something like the commit ID as a resource tag and we would have to rely on the AWS Lambda 'versioning' to retrieve old versions as not every commit to the repo would be a change to the running code.

**Functions should not be replaced unless a change has occurred.**
Big fail.

If the project is small and there isn't any CI/CD to speak of and deployments are done from ones laptop, two executions of the `terraform apply` command wouldn't cause the Lambda functions to be changed.

However, [ZIP files specifically have a very annoying header](http://en.wikipedia.org/wiki/Zip_%28file_format%29) which includes the last modification date & time, any zip file created even from files are identically at the byte level will always end up with a different checksum value

if we have multiple developers doing builds or have nice workflows with ephemeral build runners (like GitHub actions), each time the repo gets cloned the files have a new modification date on the file system (*they didn't exist before they got cloned*).

Unfortunately the Terraform `archive_file` resource only supports ZIP and the AWS Lambda service will only take a ZIP file (or an S3 object)

## 2) Did somebody say Shellscript?

*Sample Code: [https://github.com/avaines/terraform\_lambda\_build\_options/tree/main/option2](https://github.com/avaines/terraform_lambda_build_options/tree/main/option2)*

![option 2 diagram](https://github.com/avaines/terraform_lambda_build_options/raw/main/option2/diagram.png)
![option 2 terraform graph](https://github.com/avaines/terraform_lambda_build_options/raw/main/option2/graph.png)

### How does that stack up against the requirements I set out at the start?

**Lambda function code should be versioned, promotable, and targetable. An environment should be able to use a specific code version.**
**The code a function is running should be identifiable and retrievable for analysis.**
**Functions should not be replaced unless a change has occurred.**

## 3) The lie

![option 3 diagram](https://github.com/avaines/terraform_lambda_build_options/raw/main/option3/diagram.png)
![option 3 terraform graph](https://github.com/avaines/terraform_lambda_build_options/raw/main/option3/graph.png)

### How does that stack up against the requirements I set out at the start?

**Lambda function code should be versioned, promotable, and targetable. An environment should be able to use a specific code version.**
**The code a function is running should be identifiable and retrievable for analysis.**
**Functions should not be replaced unless unless a change has occurred.**

## 4) 1+2=4ish

*Sample Code: [https://github.com/avaines/terraform\_lambda\_build\_options/tree/main/option4](https://github.com/avaines/terraform_lambda_build_options/tree/main/option4)*

![option 4 diagram](https://github.com/avaines/terraform_lambda_build_options/raw/main/option4/diagram.png)
![option 4 terraform graph](https://github.com/avaines/terraform_lambda_build_options/raw/main/option4/graph.png)

### How does that stack up against the requirements I set out at the start?

**Lambda function code should be versioned, promotable, and targetable. An environment should be able to use a specific code version.**
**The code a function is running should be identifiable and retrievable for analysis.**
**Functions should not be replaced unless a change has occurred.**

### 4.5) Bonus solution

*Sample Code: [https://github.com/avaines/terraform\_lambda\_build\_options/tree/main/option4.5](https://github.com/avaines/terraform_lambda_build_options/tree/main/option4.5)*

![option 4.5 diagram](https://github.com/avaines/terraform_lambda_build_options/raw/main/option4.5/diagram.png)
![option 4.5 terraform graph](https://github.com/avaines/terraform_lambda_build_options/raw/main/option4.5/graph.png)

### How does that stack up against the requirements I set out at the start?

**Lambda function code should be versioned, promotable, and targetable. An environment should be able to use a specific code version.**
**The code a function is running should be identifiable and retrievable for analysis.**
**Functions should not be replaced unless a change has occurred.**

## 5) Decouple, separate, & Empower

*Sample Code: [https://github.com/avaines/terraform\_lambda\_build\_options/tree/main/option5](https://github.com/avaines/terraform_lambda_build_options/tree/main/option5)*

![option 5 diagram](https://github.com/avaines/terraform_lambda_build_options/raw/main/option5/diagram.png)
![option 5 terraform graph](https://github.com/avaines/terraform_lambda_build_options/raw/main/option5/graph.png)

### How does that stack up against the requirements I set out at the start?

**Lambda function code should be versioned, promotable, and targetable. An environment should be able to use a specific code version.**
**The code a function is running should be identifiable and retrievable for analysis.**
**Functions should not be replaced unless a change has occurred.**

# Super, now what?

To compare the options

| Option                                                                                      | Build time | Statefile size |
| ------------------------------------------------------------------------------------------- | ---------- | -------------- |
| [Option 1](https://github.com/avaines/terraform_lambda_build_options/tree/main/option1)     | 16s        | 8K             |
| [Option 2](https://github.com/avaines/terraform_lambda_build_options/tree/main/option2)     | 20s        | 8K             |
| [Option 3](https://github.com/avaines/terraform_lambda_build_options/tree/main/option3)     | N/A        | N/A            |
| [Option 4](https://github.com/avaines/terraform_lambda_build_options/tree/main/option4)     | 18s        | 12K            |
| [Option 4.5](https://github.com/avaines/terraform_lambda_build_options/tree/main/option4.5) | 18s        | 12K            |
| [Option 5](https://github.com/avaines/terraform_lambda_build_options/tree/main/option5)     | 21s        | 8K             |
