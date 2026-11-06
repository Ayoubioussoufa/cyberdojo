/** Short manual pages, in the shape of real ones, for the commands in the simulator. */
const page = (name: string, what: string, synopsis: string, options: string) =>
  `NAME\n       ${name} - ${what}\n\nSYNOPSIS\n       ${synopsis}\n\nOPTIONS\n${options
    .trim()
    .split("\n")
    .map((l) => `       ${l.trim()}`)
    .join("\n")}`;

export const MAN: Record<string, string> = {
  sha256sum: page("sha256sum", "compute or check SHA-256 hashes", "sha256sum [-c] [FILE]...", `
    no flag   print each file's hash, then its name
    -c        read a list of hashes from FILE and check each one`),
  jq: page("jq", "filter JSON (this simulator handles the common part)", "jq [-r] [-c] FILTER [FILE]", `
    .a.b               the value at that path
    .items[]           each element, one at a time
    A | B              feed A's output into B
    select(.a == "x")  keep a value only if the test is true
    -r                 print strings without their quotes
    -c                 one line per value`),
  ls: page("ls", "list directory contents", "ls [OPTION]... [FILE]...", `
    -a   show all entries, including names starting with .
    -l   long format: type, permissions, owner, group, size, date
    -h   with -l, sizes like 1.2K
    -R   list subdirectories too
    -t   newest first
    -S   largest first
    -r   reverse the order
    -d   list a directory itself, not what's inside it`),
  cd: page("cd", "change the working directory (a shell builtin)", "cd [DIR]", `
    no DIR   go to your home directory
    -        go back to the previous directory
    ..       the parent directory`),
  pwd: page("pwd", "print the name of the working directory", "pwd", "(none needed)"),
  cat: page("cat", "concatenate files and print them", "cat [OPTION]... [FILE]...", `
    -n   number the lines`),
  head: page("head", "output the first part of files", "head [-n NUM] [FILE]...", `
    -n NUM   the first NUM lines (default 10)
    -c NUM   the first NUM bytes`),
  tail: page("tail", "output the last part of files", "tail [-n NUM] [FILE]...", `
    -n NUM    the last NUM lines (default 10)
    -n +NUM   everything from line NUM onwards`),
  wc: page("wc", "count lines, words and bytes", "wc [OPTION]... [FILE]...", `
    -l   lines
    -w   words
    -c   bytes`),
  grep: page("grep", "print lines that match a pattern", "grep [OPTION]... PATTERN [FILE]...", `
    -i   ignore case
    -v   invert: lines that do NOT match
    -c   count matching lines
    -n   show line numbers
    -r   search directories recursively
    -l   show only the names of matching files
    -o   show only the matching part of each line
    -w   match whole words only
    -E   extended regular expressions (+ ? | work unescaped)
    -A N / -B N   also show N lines after / before a match`),
  find: page("find", "search for files in a directory tree", "find [PATH]... [EXPRESSION]", `
    -name PATTERN    base name matches a glob (quote it!)
    -iname PATTERN   same, ignoring case
    -type f|d|l      file, directory, symbolic link
    -user NAME       owned by NAME
    -group NAME      group is NAME
    -perm MODE       exact permissions
    -perm -MODE      all of these bits are set
    -perm /MODE      any of these bits is set
    -size N[ckMG]    size; +N larger, -N smaller; c = bytes
    -maxdepth N      descend at most N levels
    -exec CMD {} \;  run CMD on each result`),
  sort: page("sort", "sort lines of text", "sort [OPTION]... [FILE]...", `
    -n   compare as numbers
    -r   reverse
    -u   keep unique lines only
    -f   ignore case
    -k N   sort by field N
    -t C   fields are separated by C`),
  uniq: page("uniq", "collapse ADJACENT repeated lines", "uniq [OPTION]... [FILE]", `
    -c   prefix each line with its count
    -d   only lines that repeat
    -u   only lines that don't repeat
    Note: only neighbours are compared, so sort first.`),
  cut: page("cut", "pick out columns", "cut OPTION... [FILE]...", `
    -d C      the delimiter is C (default: tab)
    -f LIST   these fields, e.g. 1 or 1,3 or 2-
    -c LIST   these characters`),
  tr: page("tr", "translate or delete characters from standard input", "tr [OPTION]... SET1 [SET2]", `
    -d   delete characters in SET1
    -s   squeeze repeats into one
    Example: tr 'a-z' 'A-Z'`),
  sed: page("sed", "stream editor (this simulator: s, d and p only)", "sed [-n] [-E] SCRIPT [FILE]...", `
    s/old/new/    replace the first match on each line
    s/old/new/g   replace every match
    /re/d         delete matching lines
    5p with -n    print only line 5`),
  awk: page("awk", "pattern scanning (this simulator: filter + print only)", "awk [-F SEP] 'PROGRAM' [FILE]...", `
    -F SEP              the field separator
    '{print $1, $3}'    print fields 1 and 3
    '$3 == 0 {print $1}'  only lines where field 3 is 0
    '/re/ {print $NF}'  last field of matching lines`),
  chmod: page("chmod", "change file mode bits", "chmod [-R] MODE FILE...", `
    Numeric: 755 means rwx r-x r-x (r=4 w=2 x=1)
    Symbolic: u+x  g-w  o=r  a+r
    Special: 4000 set-user-ID, 2000 set-group-ID, 1000 sticky
    Only the owner or root may change a file's mode.`),
  chown: page("chown", "change file owner and group", "chown OWNER[:GROUP] FILE...", `
    Only root may give a file to another user.`),
  chgrp: page("chgrp", "change group ownership", "chgrp GROUP FILE...", `
    The owner may pick any group they belong to.`),
  id: page("id", "print user and group ids", "id [USER]", "uid = who you are; euid (when shown) = who the kernel treats you as"),
  whoami: page("whoami", "print the effective user name", "whoami", "(none needed)"),
  groups: page("groups", "print the groups a user is in", "groups [USER]", "(none needed)"),
  ps: page("ps", "report running processes", "ps [aux | -ef]", `
    (nothing)   your processes on this terminal
    aux         every process: USER PID %CPU %MEM COMMAND
    -ef         every process, with the parent's PPID`),
  kill: page("kill", "send a signal to a process", "kill [-SIGNAL] PID...", `
    (default)   15 SIGTERM: please stop; a program may catch or ignore it
    -9          9 SIGKILL: the kernel stops it; it can't be caught
    -l          list signals
    You may only signal your own processes, unless you are root.`),
  sudo: page("sudo", "run a command as root", "sudo COMMAND", `
    -l   list what you are allowed to run`),
  file: page("file", "determine file type from content", "file FILE...", "It looks inside the file; the name doesn't matter."),
  strings: page("strings", "print the printable text in a binary file", "strings FILE", "Prints runs of 4 or more printable characters."),
  base64: page("base64", "encode or decode base64", "base64 [-d] [FILE]", "-d   decode. Base64 is an encoding: anyone can reverse it. It hides nothing."),
  man: page("man", "show a manual page", "man COMMAND", "Press q to leave a real man page."),
  mkdir: page("mkdir", "make directories", "mkdir [-p] DIR...", "-p   make parents as needed; no error if it exists"),
  rm: page("rm", "remove files or directories", "rm [-r] [-f] FILE...", `
    -r   remove directories and their contents
    -f   ignore missing files, never ask
    There is no bin. Removed means gone.`),
  cp: page("cp", "copy files", "cp [-r] SOURCE... DEST", "-r   copy directories"),
  mv: page("mv", "move or rename files", "mv SOURCE... DEST", "(none needed)"),
  touch: page("touch", "create an empty file or update its time", "touch FILE...", "(none needed)"),
  stat: page("stat", "show file details", "stat [-c FORMAT] FILE", `
    %a octal mode, %A symbolic mode, %U owner, %G group, %s size, %n name`),
  echo: page("echo", "print text", "echo [-n] [-e] [STRING]...", `
    -n   no trailing newline
    -e   interpret \\n and \\t`),
  umask: page("umask", "show or set the mask for new files", "umask [MODE]", "New files get 666 minus the mask; new directories get 777 minus the mask."),
};
