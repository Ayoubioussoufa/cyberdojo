/** A fresh machine: the skeleton every mission's world starts from. */
import { COMMANDS } from "./commands";
import { Vfs, type User } from "./fs";
import { Shell } from "./shell";

const ROOT: User = { name: "root", uid: 0, gid: 0, groups: [], home: "/root", shell: "/bin/bash" };

export interface MachineUser {
  name: string;
  uid: number;
  groups?: string[];
}

/** Files the real tools keep on disk as programs; shell builtins are left out. */
const NOT_FILES = new Set(["cd", "pwd", "history", "export", "unset", "umask", "clear", "exit", "help", "submit", "type"]);

/** Builds a machine with users, standard directories and logged-in `login`. */
export function machine(login: string, users: MachineUser[], groups: string[] = []): Shell {
  const fs = new Vfs();
  fs.users = [ROOT];
  fs.groups = [{ name: "root", gid: 0 }, { name: "shadow", gid: 42 }, { name: "users", gid: 100 }, { name: "sudo", gid: 27 }];
  groups.forEach((g, i) => fs.groups.push({ name: g, gid: 2000 + i }));
  for (const u of users) {
    fs.groups.push({ name: u.name, gid: u.uid });
    fs.users.push({
      name: u.name,
      uid: u.uid,
      gid: u.uid,
      groups: (u.groups ?? []).map((g) => fs.groupId(g) as number),
      home: `/home/${u.name}`,
      shell: "/bin/bash",
    });
  }
  fs.dir("/", { mode: 0o755 });
  for (const d of ["/bin", "/etc", "/home", "/opt", "/usr/bin", "/usr/local/bin", "/var/log", "/var/tmp", "/dev"]) fs.dir(d);
  fs.dir("/tmp", { mode: 0o1777 });
  fs.dir("/root", { mode: 0o700 });
  for (const u of users) fs.dir(`/home/${u.name}`, { mode: 0o750, owner: u.name });

  for (const name of Object.keys(COMMANDS)) {
    if (NOT_FILES.has(name)) continue;
    fs.put(`/usr/bin/${name}`, "\x7fELF\0", { mode: 0o755, program: name });
  }
  for (const name of ["sudo", "passwd", "su", "mount", "umount", "chsh", "newgrp", "gpasswd"]) {
    fs.put(`/usr/bin/${name}`, "\x7fELF\0", { mode: 0o4755, program: name in COMMANDS ? name : "none" });
  }

  fs.put(
    "/etc/passwd",
    [
      "root:x:0:0:root:/root:/bin/bash",
      "daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin",
      "www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin",
      ...users.map((u) => `${u.name}:x:${u.uid}:${u.uid}::/home/${u.name}:/bin/bash`),
    ].join("\n") + "\n",
  );
  fs.put("/etc/shadow", "root:$y$j9T$hidden:20000:0:99999:7:::\n", { mode: 0o640, group: "shadow" });
  fs.put("/etc/group", `${fs.groups.map((g) => `${g.name}:x:${g.gid}:`).join("\n")}\n`);
  fs.put("/etc/hostname", "lab\n");
  fs.put("/etc/os-release", 'PRETTY_NAME="Ubuntu 26.04 LTS"\nNAME="Ubuntu"\nVERSION_ID="26.04"\n');

  const sh = new Shell(fs, login);
  sh.procs = [
    { pid: 1, ppid: 0, user: "root", tty: "?", cmd: "/sbin/init" },
    { pid: 612, ppid: 1, user: "root", tty: "?", cmd: "/usr/sbin/sshd -D" },
    { pid: 4021, ppid: 612, user: login, tty: "pts/0", cmd: "-bash" },
  ];
  return sh;
}
