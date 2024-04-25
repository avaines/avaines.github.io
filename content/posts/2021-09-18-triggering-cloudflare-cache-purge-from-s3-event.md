---
author: Aiden Vaines
title: >-
  Triggering a Cloudflare Cache Purge from S3 Object Events
date: 2021-09-18
featured: true
image: /posts/2021-09-18-triggering-cloudflare-cache-purge-from-s3-event/featured.png
categories:
  - AWS
  - Cloudflare
---

## The Challenge
I've have been looking at some cost and performance improvements in some of my infrastructure. This particular environment is essentially a handful of websites which use some shared static assets that reside in an S3 bucket think assets.website.com which is used by website.co.uk, website.nl and website.ie.

These websites are currently all running through Cloudflare' CDN service, but this assets cache is fronted by AWS Cloudfront.

![user flow diagram before](/posts/2021-09-18-triggering-cloudflare-cache-purge-from-s3-event/blg_s3_cf_flow1.png)


With our Cloudflare CDN services we have implemented a load of optimisations; including the [Cloudflare Argo](https://blog.cloudflare.com/argo/) service (which is ace, but a subject for another blog).

Having now completed the migration from AWS Cloudfront to Cloudflare to the user flow looks more like this:

![user flow diagram after](/posts/2021-09-18-triggering-cloudflare-cache-purge-from-s3-event/blg_s3_cf_flow2.png)


With the assets in the S3 bucket we found a situation where by the marketing teams upload files and sometimes; these uploads contain fixes or edits which need to be changed on the website NOW. Waiting for the normal TTL to expire just wont work (typos, bad information etc); historically they would just log in to AWS, locate the assets.website.com distribution and run a cache invalidation. Access was govered by IAM and limited to this specific action on this specific distribution.

With Cloudflare's access model being a bit ~~shit~~ limited it's all or nothing. You can create users based on the account which will have access to all zones within it.

![cloudflare user perms 1](/posts/2021-09-18-triggering-cloudflare-cache-purge-from-s3-event/blg_s3_cf_perms1.png)

Your choices are to have a separate account for each domain/zone you manage if you want less access for users but a worse management experience, or you have the related zones in the same account but have an overly permissive accounts model

Whilst there is a 'purge_cache' privilage option it grants this access to all domains/ones in the account; which is not least-privilege and not something I want to deal with (Cloudflare are making improvements in this area apparently).

![cloudflare user perms 1](/posts/2021-09-18-triggering-cloudflare-cache-purge-from-s3-event/blg_s3_cf_perms1.png)

### The Solution
I needed a solution which would purge the cache when specific objects or types of objects are uploaded to S3, ideally without any user interaction whatsoever.

I created a fairly simple Lambda function which is triggered by S3 events, it takes in the Cloudflare API details from an AWS SSM Parameter Store value. Given the S3 event we can assemble the URL, generate a POST request and send a request to the Cloudflare API to purge this specific item (code at the bottom of this post).

In the past this S3 event would have had to go on an AWS SQS queue which was then polled by the Lambda function. Since [March this year](https://aws.amazon.com/blogs/aws/introducing-amazon-s3-object-lambda-use-your-code-to-process-data-as-it-is-being-retrieved-from-s3/) we've been able to trigger a Lambda function directly from an S3 object event eliminating some complexity in this particular situation.

Given my requirements it still might be better to use an SQS queue in the middle to ensure event delivery and provide some ordering and possibly a little more error handling for failed processing; but as this is just a case of picking up that a S3 object key has changed then firing its path over to an external API it seemed unnessessary. This was also a pretty fun way to try out this new-ish functionality.

It might turn out that when loads of files are uploaded we are loosing some and actually an SQS queue makes more sense to batch things up. I might also switch to using [tags on the objects](https://blog.cloudflare.com/introducing-a-powerful-way-to-purge-cache-on-cloudflare-purge-by-cache-tag/) in the Cloudflare space to make purging a bit more efficient.


~~~ python
"""
Script to invalidate cloudflare cache objects based on s3 object triggers. Assumes the bucket name is the same as the target URL

Environmental Variables:

  CLOUDFLARE_API_KEY:
    Type: "String"
    Usage: [optional] Cloudflare API KEY.

  CLOUDFLARE_API_KEY_SSMPATH:
    Type: "String"
    Usage: [optional] SSM Path for the Cloudflare API KEY.

  CLOUDFLARE_API_EMAIL:
    Type: "String"
    Usage: SSM Path for the Cloudflare API KEY.

  CLOUDFLARE_ZONE_ID:
    Type: String
    Usage: Cloudflare Zone ID for the target of the invalidations

  INCLUDED_EXTS
    Type: String, comma seperated list
    Usage: A comma seperated list of extensions to invalidate cache for, default is everything
    Default: *

  EXCLUDED_EXTS
    Type: String, comma seperated list
    Usage: A comma seperated list of extensions NOT to invalidate cache for, default is nothing
    Default: empty

Usage:
  Designed to be run as a lambda and triggered by an S3 event.
  If running manually, you'll need to set the environmental variables first

"""
import boto3
import json
import sys
import urllib3

from os import environ

def invalidate_cf_caches(invalidations):
  ssm = boto3.client('ssm')

  if "CLOUDFLARE_API_KEY_SSMPATH" in environ:
    print(environ.get("CLOUDFLARE_API_KEY_SSMPATH"))
    api_key = ssm.get_parameter(Name=environ.get("CLOUDFLARE_API_KEY_SSMPATH"), WithDecryption=True)

  elif "CLOUDFLARE_API_KEY" in environ:
    api_key = environ.get("CLOUDFLARE_API_KEY")

  else:
    sys.exit("CLOUDFLARE_API_KEY or CLOUDFLARE_API_KEY_SSMPATH are missing")

  api_email = environ.get("CLOUDFLARE_API_EMAIL") if "CLOUDFLARE_API_EMAIL" in environ else sys.exit("CLOUDFLARE_API_EMAIL is missing")
  zone_id = environ.get("CLOUDFLARE_ZONE_ID") if "CLOUDFLARE_ZONE_ID" in environ else sys.exit("CLOUDFLARE_ZONE_ID is missing")

  url = "https://api.cloudflare.com/client/v4/zones/" + zone_id +"/purge_cache"

  payload = json.dumps({
    "files": invalidations
  })

  headers = {
    'X-Auth-Email': api_email,
    'X-Auth-Key': api_key,
    'Content-Type': 'application/json',
  }

  http = urllib3.PoolManager()

  response = http.request('POST',
    url,
    body = payload,
    headers = headers,
    retries = False)

  # response.data is a bytes array, decode it to a json object making it somewhat useful
  response_usable = json.loads(response.data.decode('utf8').replace("'", '"'))
  response_usable["invalidations"] = invalidations

  return response_usable


# Lambda Handler
def lambda_handler(event, context):
  invalidations = []
  included_extensions = [] if not "INCLUDED_EXTS" in environ else [x.strip() for x in environ.get("INCLUDED_EXTS").split(",")]
  excluded_extensions = [] if not "EXCLUDED_EXTS" in environ else [x.strip() for x in environ.get("EXCLUDED_EXTS").split(",")]

  for record in event["Records"]:
    # If the current file has an extension not permitted by the included extensions filter, skip to the next record
    if len(included_extensions) > 0 and record['s3']['object']['key'].split(".")[-1] not in included_extensions:
      print(record['s3']['object']['key'], "does't have an extension in the inclusion filter and will be skippedun")
      # The INCLUDE_EXTS environmental variable doesnt have a matching file type
      continue

    if len(excluded_extensions) > 0 and record['s3']['object']['key'].split(".")[-1] in excluded_extensions:
      print(record['s3']['object']['key'], "has a excluded extension, and will be skipped")
      # The EXCLUDE_EXTS environmental variable has a matching file type to be excluded
      continue

    invalidations.append("https://" + record['s3']['bucket']['name'] + "/" + record['s3']['object']['key'])

  if len(invalidations) > 0:
    invalidation_response = invalidate_cf_caches(invalidations)
  else:
    invalidation_response="All updated S3 object keys were matched on the exclusion list or not explicitily included"

  print(invalidation_response)
  return invalidation_response

~~~
