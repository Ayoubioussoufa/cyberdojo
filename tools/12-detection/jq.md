---
title: jq
summary: Filters, reshapes and pulls fields out of JSON on the command line.
side: both
use: open
docs: https://jqlang.org/manual/
alt: grep, awk
---
## What it's for
Modern logs and APIs speak JSON: Suricata's `eve.json`, cloud audit trails, container logs and almost every web API. `jq` is to JSON what [grep](/tools/grep/) is to text: it selects the records you want and prints the fields you need.

## How it works
`jq` reads JSON and applies a filter to it. `.` is the whole input, `.name` a field, `.[]` each element of an array, and `|` passes results to the next filter. `select(condition)` keeps only the records that match. With one JSON object per line, as most log files use, `jq` handles each line in turn. `-r` prints strings without their quotes, and `-c` prints one compact object per line.

## Try it
```
curl -s https://api.github.com/repos/jqlang/jq | jq '.stargazers_count'
echo '{"user":"sam","ok":false}' | jq '.user'
jq -c 'select(.event_type == "alert") | {src: .src_ip, sig: .alert.signature}' eve.json
jq -r '.Records[] | .userIdentity.arn' cloudtrail.json | sort | uniq -c | sort -rn
```

The third line shows only Suricata's alerts, with two fields each. The last one ranks who called the AWS API most often in a CloudTrail file.

## What defenders see
In an investigation, `jq` turns a gigabyte of JSON into the ten lines that matter. It does the same filtering a SIEM query does, which the [SIEM query languages](/modules/08-01-siem-query-languages/) module compares. Check field names carefully: a filter on a missing field quietly returns `null`, which can make it look as though nothing happened.

?! `jq 'select(.status == 500)' access.json` prints nothing, but you know errors happened. Name two reasons this filter could miss them.
