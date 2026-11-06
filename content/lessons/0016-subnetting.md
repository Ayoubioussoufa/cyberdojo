---
title: Subnetting without tears
summary: What /24 means, how to split networks, and a mental method for getting any answer in under a minute.
month: 2
minutes: 40
builds: subnet any /8 to /30 in under 60 seconds, the Month 2 exit gate
source: Practical Networking, Subnetting Mastery | https://www.practicalnetworking.net/stand-alone/subnetting-mastery/
words: subnet, CIDR, broadcast address
---
Subnetting looks like maths, but it's closer to a card trick: learn one move and you can do every problem. You need it to read firewall rules, cloud networks and scan targets, and it's your Month 2 exit gate.

@term subnet = A smaller network carved out of a larger one.
@term CIDR notation = Writing a network as an address plus a slash and the number of network bits, such as 10.0.0.0/24.
@term subnet mask = The same information as the slash, written like an address, such as 255.255.255.0.
@term network address = The first address in a subnet, naming the subnet itself.
@term broadcast address = The last address in a subnet, used to reach every device on it.
@term block size = How many addresses a subnet contains, always a power of two.

## What the slash means

An address has a **network part** and a **host part**. The number after the slash says how many bits are network bits.

```
192.168.1.10/24
11000000.10101000.00000001.00001010
└───── 24 network bits ───┘└ 8 host ┘
```

With 8 host bits there are 2⁸ = 256 addresses. The first and last are reserved: the first is the **network address**, and the last is the **broadcast address**. That leaves 254 for devices.

| Slash | Mask | Addresses | Usable hosts |
|---|---|---|---|
| /8 | 255.0.0.0 | 16,777,216 | 16,777,214 |
| /16 | 255.255.0.0 | 65,536 | 65,534 |
| /24 | 255.255.255.0 | 256 | 254 |
| /25 | 255.255.255.128 | 128 | 126 |
| /26 | 255.255.255.192 | 64 | 62 |
| /27 | 255.255.255.224 | 32 | 30 |
| /28 | 255.255.255.240 | 16 | 14 |
| /29 | 255.255.255.248 | 8 | 6 |
| /30 | 255.255.255.252 | 4 | 2 |

**The rule:** addresses = 2^(32 − slash), and usable hosts = that minus 2.

## The one move: block size

Subnets always start on a multiple of their block size. Here's the whole method.

**Find the network and broadcast of `192.168.1.77/26`.**

1. Which byte is the slash in? /26 is past 24, so the fourth byte.
2. Block size: 32 − 26 = 6 host bits, and 2⁶ = **64**.
3. Multiples of 64: 0, 64, 128, 192. The last one not above 77 is **64**.
4. Network: `192.168.1.64`. The next block starts at 128, so broadcast is one less: `192.168.1.127`.

Usable hosts run from `.65` to `.126`.

**Now one in a different byte: `10.20.133.5/18`.**

1. /18 is between 16 and 24, so the third byte is the one that splits.
2. Host bits within that byte: 24 − 18 = 6, so the block is **64** in the third byte.
3. Multiples of 64: 0, 64, 128, 192. The last one not above 133 is **128**.
4. Network: `10.20.128.0`. Next block starts at 192, so broadcast is `10.20.191.255`.

::: key The trick
Find the byte where the slash falls, work out the block size in that byte, and round down to a multiple. Everything to the right is 0 for the network and 255 for the broadcast.
:::

?? What's the network address of `172.16.5.200/25`?
+ `172.16.5.128`
- `172.16.5.0`
- `172.16.5.192`
- `172.16.0.0`
=> A /25 has a block size of 128 in the last byte. The multiples are 0 and 128, and 200 falls in the 128 block.

?? How many usable hosts does a /27 have?
+ 30
- 32
- 27
- 62
=> 2⁵ = 32 addresses, minus the network and broadcast addresses.

## Why this matters in security

- `10.0.0.0/8` in a firewall rule means sixteen million addresses, not one. A typo in the slash can open a whole company.
- `0.0.0.0/0` means **everything**. Seen on a cloud security group for SSH, it's a classic misconfiguration.
- Scanning `nmap 192.168.56.0/24` means 256 addresses. Getting the slash wrong can mean scanning systems you don't have permission to touch.

@drill subnet

::: tip How to train
Ten minutes a day, as the roadmap says. Spaced practice beats one long session. Your gate is 20 questions in a row, each under 60 seconds. There's a dedicated version on [the practice page](/practice/subnet/).
:::

::: ai Roadmap exercise
Ask an AI for 20 subnetting problems with answers. Solve them yourself, check the AI's answers, and log every error it made.
:::

?! Explain to a friend why a /24 has 254 usable addresses and not 256.
