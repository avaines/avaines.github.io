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

I've provided working examples in a repo here: [https://github.com/avaines/terraform\_lambda\_build\_options](https://github.com/avaines/terraform_lambda_build_options) for all of the options discussed in its most basic form.

## 1) The Classic: Copy-Paste from the documentation

Terraform's documentation for the aws\_lambda\_function resource [https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda\_function](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_function)

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

![option 1 diagram](https://github.com/avaines/terraform_lambda_build_options/raw/main/option1/diagram.png)
![option 1 terraform graph](https://github.com/avaines/terraform_lambda_build_options/raw/main/option1/graph.png)

**Build time:** 16s
**Statefile size**: 8K

## 2)

![option 2 diagram](https://github.com/avaines/terraform_lambda_build_options/raw/main/option2/diagram.png)
![option 2 terraform graph](https://github.com/avaines/terraform_lambda_build_options/raw/main/option2/graph.png)

## 3)

![option 3 diagram](https://github.com/avaines/terraform_lambda_build_options/raw/main/option3/diagram.png)
![option 3 terraform graph](https://github.com/avaines/terraform_lambda_build_options/raw/main/option3/graph.png)

## 4)

![option 4 diagram](https://github.com/avaines/terraform_lambda_build_options/raw/main/option4/diagram.png)
![option 4 terraform graph](https://github.com/avaines/terraform_lambda_build_options/raw/main/option4/graph.png)

### 4.5)

![option 4.5 diagram](https://github.com/avaines/terraform_lambda_build_options/raw/main/option4.5/diagram.png)
![option 4.5 terraform graph](https://github.com/avaines/terraform_lambda_build_options/raw/main/option4.5/graph.png)

## 5)

![option 5 diagram](https://github.com/avaines/terraform_lambda_build_options/raw/main/option5/diagram.png)
![option 5 terraform graph](https://github.com/avaines/terraform_lambda_build_options/raw/main/option5/graph.png)

# Super, now what?

To compare the options

| Option     | Build time | Statefile size |
| ---------- | ---------- | -------------- |
| Option 1   | 16s        | 8K             |
| Option 2   | 20s        | 8K             |
| Option 3   | N/A        | N/A            |
| Option 4   | 18s        | 12K            |
| Option 4.5 | 18s        | 12K            |
| Option 5   | 21s        | 8K             |
