---
title: file
summary: Identifies what a file really is from its content, not from its name.
side: both
use: open
docs: https://man7.org/linux/man-pages/man1/file.1.html
alt: strings, binwalk, xxd
---
## What it's for
A file's extension is only part of its name, and names can lie. `file` looks at the bytes inside and says what the file actually is: an ELF program for Linux, a PE program for Windows, a ZIP archive, a PNG image, a shell script. It's the first command to run on anything you didn't create.

## How it works
Most formats start with a fixed signature, a "magic number": `7f 45 4c 46` (`\x7fELF`) for Linux programs, `4d 5a` (`MZ`) for Windows ones, `50 4b 03 04` (`PK`) for ZIP, which also covers .docx and .jar files. `file` compares the first bytes with a database of these signatures, the magic file, and checks whether text looks like a script or a known encoding. For programs it adds details such as the processor and whether the symbols were stripped.

## Try it
```
file -L /bin/ls
file -i invoice.pdf
file -z archive.gz
cp /bin/ls photo.jpg && file photo.jpg
xxd photo.jpg | head -1
```

`-L` follows a symbolic link to the real file, `-i` prints the MIME type and `-z` looks inside compressed files. The last two lines show that renaming a program doesn't change what it is, and [xxd](/tools/xxd/) shows you the magic bytes yourself.

## What defenders see
Mail and upload filters that trust extensions are easy to fool, so good ones check content the way `file` does. In triage, an "invoice.pdf" that is really a Windows program, or a ".jpg" with a ZIP archive appended, is an immediate red flag. Upload handlers should check content and never serve users' files as runnable code, as the [uploads](/modules/04-08-files-traversal-and-uploads/) module explains.

?! A user forwards "report.pdf", and `file` says "PE32+ executable (GUI) x86-64, for MS Windows". What do you do next, and what don't you do?
