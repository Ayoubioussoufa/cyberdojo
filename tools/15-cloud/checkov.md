---
title: Checkov
summary: Scans infrastructure-as-code for misconfigurations before deployment.
side: both
use: open
docs: https://www.checkov.io/
alt: trivy, tfsec, terrascan
---
## What it's for
A single line in a Terraform file can open a storage bucket to the world. Checkov, from Bridgecrew, reads infrastructure-as-code and flags risky settings before they're ever deployed.

## How it works
It parses Terraform, CloudFormation, Kubernetes manifests and more, then checks each resource against hundreds of built-in policies: public access, missing encryption, over-broad permissions. Catching these in code, before anything is created, is far cheaper than finding them in a running cloud. You can write custom policies too. [Infrastructure as code](/modules/10-07-iac-and-policy-as-code/) covers the wider practice.

## Try it
```
checkov -d . --compact
```

Run it on a small Terraform folder with a deliberately public bucket, read the finding, fix the code, and run it again.

## What defenders see
This is prevention at the cheapest point. Run it in CI and block a merge on a high-severity finding, with a clear, logged exception process. Combine it with runtime checks, since code scanning can't see what was changed by hand after deployment, which is why drift detection matters too.

?! Why is catching a misconfiguration in Terraform code cheaper than catching it in the running cloud?
