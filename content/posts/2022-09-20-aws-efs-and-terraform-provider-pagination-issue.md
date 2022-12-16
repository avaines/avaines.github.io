---
author: "Aiden Vaines"
title: "An odd AWS EFS & Terraform AWS pagination issue."
date: 2022-09-20
image: "/posts/2022-09-20-aws-efs-and-terraform-provider-pagination-issue/featured.png"
featured: true
catagories: [
  "AWS",
  "Terraform",
]
tags: [
  "aws",
  "terraform",
]


---

*I know the AWS CLI is different to the AWS CDK used by the provider and the two are not the same. For the sake of this explanation of my issue its good enough*

# Introduction

I recently came up against a pretty weird issue caused by the AWS Terraform provider's [aws_efs_file_system data resource][1]. It caused me quite a bit of headscratching to work out.

An AWS account I have been working with has a release mechanism which relies on hot-swapping EFS resources out. On the run up to the release theres a brief period where new EFS resources are spun up, the release occurs and the process is repeated.

For a number of reasons this particular release was delayed longer than might normally be expected, when it came for release time we were halted by this in the Terraform portion of the pipelines:

~~~
Error: Search returned 0 results, please revise so only one is returned
│
│   with data.aws_efs_file_system.myfiles,
│   on data_efs_file_system_myfiles.tf line 1, in data "aws_efs_file_system" "myfiles":
│    1: data "aws_efs_file_system" "myfiles" {
~~~

# Er, now what? This code needs to be released!
*....chorus the delivery managers*

The `data_efs_file_system_myfiles` resource looks like this:

~~~
data "aws_efs_file_system" "replica_myfiles" {
   tags = {
     Description       = "myfiles"
     Environment       = var.environment
     Application       = var.application_name
     ReplicState       = "next"
   }
}
~~~

The AWS account in question had, at the time of the incident, a few over 130 EFS resources which shouldn't be an issue. I expected it to just be a case of querying the AWS EFS API Endopoint, filtering the results and away we go; data resource populated.

There is one slight issue with my childish assumption; the AWS EFS API for the `describe-files-systems` endpoint doesn't have a `--filter` argument ![aws cli options for efs describe-file-systems](/posts/2022-09-20-aws-efs-and-terraform-provider-pagination-issue/aws-cli-synopsis.png)

The only option is to query the EFS `describe-file-systems` endpoint and then filter the result of ALL EFS resources in memory (post API call), this could be a bit resource intensive but given the endpoint won't do it for you via a `--filter` option the options are limited. It turns out the AWS Provider (4.25 at the time of the issue, still an issue as of 4.31) does exactly this [which you can see here][2].

The only downside is the theres *no pagination implemented*, so if you have 101 EFS resources, and you are looking for the 100 and 1st resource, you are shit out of luck.

This has previously been a known issue across several AWS service API endpoints, [for example here is the same issue with ASGs][3]

# An interim solution...
In order to get the release process back on the rails and as the AWS provider is effectivly broken and this isn't likely to be fixed urgently. I needed a fix.

*It's quite a hacky mess and I'm not particularly proud of it; but for the time being, it gets the release pipelines back on track and it'll do.*

By using an external data source, I can abuse the AWS CLI and JQ to get me the EFS resource ID no matter how many resources we have (at the cost of some compute time)

~~~
data "aws_efs_file_system" "replica_myfiles" {
  file_system_id = data.external.efs_describe_file_systems_myfiles.result["FileSystemId"]
}

data "external" "efs_describe_file_systems_myfiles" {
    program = [
        "bash", "-c",
        "aws efs describe-file-systems | jq -r '.FileSystems[] | select((.Tags[]|select(.Key==\"Application\")|.Value) | match(\"${var.application_name}\")) | select((.Tags[]|select(.Key==\"Description\")|.Value) | match(\"myfiles\")) | select((.Tags[]|select(.Key==\"Environment\")|.Value) | match(\"${var.environment}\")) | select((.Tags[]|select(.Key==\"ReplicaState\")|.Value) | match(\"next"}\")) | {FileSystemId: .FileSystemId}'"
    ]
}
~~~

# Better solutions
## Amazon fix their API consistency
There are a number of issues and inconsistencies in the thousands of AWS API endpoints, some support `--filter` some don't, some have tags formatted one way, some are formatted another way, some it's a completly seperate endpoint to get the tags (because that's helpful).

I would like to see a common approach to all these services to make descovery and implementation of these services easier to work with and at the end of the day more consistent.

## I learn Go
At the moment the best I could do was raise [an issue to the provider on GitHub][4]. In the longer term I would like to challenge myself to learn Go to a sufficient degree that I could just submit my own fix for this. Given I know [there have been similar issues][3] I'd like to use that as a starting point for building my own fix.


[1]: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/efs_file_system
[2]: https://github.com/hashicorp/terraform-provider-aws/blob/da38070f1ae31cda55c4000a0348d3004cb3acfb/internal/service/efs/file_system_data_source.go#L93
[3]: https://github.com/hashicorp/terraform-provider-aws/issues/4531
[4]: https://github.com/hashicorp/terraform-provider-aws/issues/26863