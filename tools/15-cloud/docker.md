---
title: docker
summary: Builds, runs and inspects containers from the command line.
side: both
use: open
docs: https://docs.docker.com/reference/cli/docker/
aka: Docker Desktop
alt: trivy, grype, falco
---
## What it's for
Docker packages a program with everything it needs into an image, and runs it as a container, isolated from the rest of the machine. In security work it's everywhere: labs, tools that are awkward to install, and the applications you're asked to assess. Lesson [0029](/courses/0029-tests-and-docker/) explains it from zero, and this page is the reference card.

## How it works
The `docker` command is a client that sends requests to the Docker daemon, which builds images from Dockerfiles, downloads them from registries and runs containers. A container gets its own view of processes, files and network (Linux namespaces) and limits on what it may use (cgroups), but it shares the host's kernel, which is why it's lighter than a virtual machine and less isolated.

## Try it
```
docker run --rm hello-world
docker ps -a
docker images
docker run --rm -it ubuntu:24.04 bash
docker exec -it NAME sh
docker logs NAME
docker inspect NAME
docker system df
```

`inspect` prints everything about a container as JSON: its mounts, its network, the user it runs as, and whether it's privileged.

## What defenders see
The risks are well known. A container started with `--privileged`, with the host's root folder mounted, or with `/var/run/docker.sock` inside it can take over the host, and anyone in the `docker` group is root in all but name. Images can carry known vulnerabilities and secrets, which [Trivy](/tools/trivy/) and [Grype](/tools/grype/) find, and [Falco](/tools/falco/) watches containers while they run. The [container escape](/modules/10-05-container-escape-and-runtime/) module covers this from the defender's side.

?! `docker inspect` shows a container with `"Privileged": true` and the mount `/:/host`. What could a process inside it do to the host?
