---
title: ExifTool
summary: Reads and removes metadata from images, documents and other files.
side: both
use: open
docs: https://exiftool.org/
kali: libimage-exiftool-perl
alt: binwalk
---
## What it's for
Files carry hidden details: the camera, the author, the software, and sometimes GPS coordinates. ExifTool reads and edits this metadata, for investigators and privacy-minded users alike.

## How it works
Formats keep metadata in defined blocks: EXIF in photos, XMP in many formats, and document properties in Office and PDF files. ExifTool is a Perl program that knows thousands of tags, and parses them without opening the file in its usual application. Metadata is easy to change, so treat it as a hint, not as proof.

## Try it
```
exiftool photo.jpg
exiftool -gps:all photo.jpg
exiftool -all= -o clean.jpg photo.jpg
```

The last line writes a copy with the metadata removed. Check it by reading `clean.jpg`. Try this on a photo from your own phone.

## What defenders see
Organisations leak usernames and software versions through documents on their websites, so strip metadata before publishing. Forensic examiners compare metadata with file system timestamps, since a mismatch can reveal tampering.

?! A PDF on your company's website shows an author name and a Word version. Why does an attacker care, and how would you stop it happening again?
