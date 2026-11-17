---
title: xxd
summary: Shows any file as hexadecimal and text side by side, and turns hex back into bytes.
side: both
use: open
docs: https://github.com/vim/vim/blob/master/runtime/doc/xxd.1
aka: hexdump
alt: strings, file
---
## What it's for
`xxd` prints a hex dump: each line shows an offset, sixteen bytes in hexadecimal, and the same bytes as text. It's how you look at data that isn't text, such as a file header, a packet's payload or a damaged file. It comes with Vim, and `hexdump -C` gives the same view on systems without it.

## How it works
It reads bytes and lays them out. The left column is the offset in hex, so `00000010` is byte 16. Printable bytes appear as characters on the right and everything else as a dot. `-r` reverses the process and turns a hex dump back into a binary file, so you can edit bytes in a text editor. `-p` prints plain hex with no offsets, handy for pasting into other tools.

## Try it
```
xxd /bin/ls | head -3
echo -n 'Hi!' | xxd
echo -n 'Hi!' | xxd -p
echo '486921' | xxd -r -p
xxd -s 0x200 -l 64 disk.img
```

`-s` starts at an offset and `-l` limits the length. Find the ELF signature in the first line of `/bin/ls`, and the letters "Hi!" as `48 69 21`.

## What defenders see
Hex is where encodings stop hiding things: a PowerShell command in Base64, a file with two formats glued together, or UTF-16 text with a zero after every letter. Looking at the first bytes with `xxd` confirms what [file](/tools/file/) reports, and matching offsets against a format's specification is the basis of file carving and malware analysis, as with [binwalk](/tools/binwalk/).

?! A log shows the bytes `70 61 73 73 77 6f 72 64` sent to an unknown server. Decode them with `xxd`, and say why data might be sent this way.
