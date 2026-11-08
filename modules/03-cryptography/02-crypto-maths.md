---
title: The maths behind public keys
summary: Modular arithmetic, groups, Euler's theorem and the discrete logarithm. Just enough number theory to read RSA and Diffie-Hellman properly, with everything small enough to run.
level: foundation
side: defence
minutes: 50
attack: none
needs: 03-01-crypto-foundations, 0039-public-keys-and-tls
pair: 03-05-rsa-in-depth, 03-06-diffie-hellman-and-elliptic-curves
source: Boneh and Shoup, A Graduate Course in Applied Cryptography | https://toc.cryptobook.us/
words: modular inverse, group, discrete logarithm
---
Public-key cryptography rests on a strange fact: some operations are quick in one direction and hopeless in the other. Multiplying two primes is easy, and finding them again isn't. To see why, you need four ideas. None is hard, and you can check each one in a Python prompt.

@term modular arithmetic = Arithmetic where numbers wrap around at a modulus, keeping only the remainder.
@term modular inverse = The number that multiplies with `a` to give 1 modulo `n`.
@term cyclic group = A group in which every element is a power of one generator.
@term discrete logarithm = Given `g` and `g^x mod p`, the problem of finding `x`.
@term trapdoor function = A function that's easy to compute and hard to invert, unless you hold a secret.

## Concept

### Fundamentals: clock arithmetic

`a mod n` is the remainder after dividing by `n`. So `17 mod 5` is 2. Sums and products behave as usual, and you can reduce at any step. That makes huge powers practical: **square-and-multiply** reaches `a^k mod n` in about `log k` steps.

```python
pow(2, 10, 1000)   # 24, since 1024 mod 1000 is 24
pow(5, 1000000, 23)   # instant, despite the size of the exponent
```

### Inverses

Division isn't defined here, so we ask for a **modular inverse**: a number `b` with `a × b ≡ 1 (mod n)`. It exists exactly when `a` and `n` share no common factor, meaning `gcd(a, n) = 1`. For example, 15 is the inverse of 7 modulo 26, because `7 × 15 = 105 = 4 × 26 + 1`. The extended Euclidean algorithm finds it quickly.

```python
pow(7, -1, 26)   # 15
```

### Euler's theorem

Euler's totient `φ(n)` counts the numbers below `n` that share no factor with it. For a prime `p`, `φ(p) = p − 1`. For two primes, `φ(pq) = (p − 1)(q − 1)`.

**Euler's theorem**: if `gcd(a, n) = 1`, then `a^φ(n) ≡ 1 (mod n)`. So exponents work modulo `φ(n)`. This single fact is what makes RSA function. Note the asymmetry: computing `φ(n)` from `n` alone seems to need the factors of `n`.

### Groups

A **group** is a set with one operation that's closed, associative, and has an identity and inverses. The non-zero numbers modulo a prime form one under multiplication. In a **cyclic group**, powers of a generator reach every element:

```
Powers of 3 mod 7:  3, 2, 6, 4, 5, 1   (every non-zero element)
```

The size of a group limits what can happen in it, and by **Lagrange's theorem**, the size of any subgroup divides the size of the group. This matters directly: if a prime `p` is chosen so that `p − 1` has only small factors, then discrete logs can be split into small subgroups and solved piece by piece, which is the Pohlig-Hellman attack. It's why Diffie-Hellman uses *safe primes*, or a large prime-order subgroup.

### Advanced: hard problems

**Factoring.** Given `n = pq`, find `p` and `q`. Trial division is hopeless at 2048 bits. The best classical method, the General Number Field Sieve, is sub-exponential, which is why RSA needs much larger keys than AES for the same strength.

**Discrete logarithm.** In a suitable group, computing `g^x` is easy, but recovering `x` is believed to be hard. Elliptic-curve groups have no known sub-exponential attack in general, which is why a 256-bit curve matches a 3072-bit RSA key.

| Security level | Symmetric | RSA or DH | Elliptic curve |
|---|---|---|---|
| 112 bits | 112 | 2048 | 224 |
| 128 bits | 128 | 3072 | 256 |
| 256 bits | 256 | 15360 | 512 |

These are from [NIST SP 800-57](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final).

**Quantum computers.** Shor's algorithm solves both factoring and discrete logs in polynomial time on a large fault-tolerant quantum computer. That single result is why [post-quantum cryptography](/modules/03-12-modern-crypto-frontier/) exists. These problems are "believed hard", not proved hard, and security rests on that belief.

?? When does `a` have a modular inverse modulo `n`?
+ When `a` and `n` share no factor
- When `a` is smaller than the modulus
- When `n` is an even whole number
- When `a` is a perfect square number
=> The inverse exists exactly when `gcd(a, n) = 1`. That's why RSA requires `e` to be coprime with `φ(n)`.

## Threat model

Attackers almost never solve these problems. They exploit the conditions around them: small or weak parameters, shared factors, or bad randomness. In 2012, [Heninger and others](https://factorable.net/) found thousands of live RSA keys that shared a prime, because of poor randomness at boot. A simple `gcd` of two public keys broke them instantly, with no factoring needed.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Python `pow`, `math.gcd` | Exact big-integer arithmetic | Every exercise here |
| SageMath | Number theory and algebra | Serious study of groups and curves |
| `sympy` | Primes and factoring | Small experiments |
| `openssl prime` | Tests primality | Checking a number |
| `openssl dhparam` | Generates DH parameters | Learning what safe primes cost |

## Defence

- **Use standard parameters.** Named groups from [RFC 7919](https://www.rfc-editor.org/rfc/rfc7919) and standard curves avoid weak or backdoored choices.
- **Reject small keys.** RSA below 2048 bits and DH below 2048 bits should fail policy.
- **Validate inputs.** A peer's public value should be checked for being in the right group. Otherwise, small-subgroup attacks can leak key bits.
- **Generate keys with good randomness**, after a system has enough entropy.
- **Use big-integer libraries built for crypto.** General libraries aren't constant-time.

## Pitfalls

- **Rounding with floats.** `2**2048` won't fit in a float. Use integers.
- **Computing `a^k` before reducing.** It'll never finish. Use `pow(a, k, n)`.
- **Confusing `n` with `φ(n)`.** Message arithmetic is modulo `n`, and exponent arithmetic is modulo `φ(n)`.
- **"Hard" meaning "proved hard".** No proof exists. It's a long-standing belief, tested by decades of attack.
- **Assuming big equals strong.** A huge prime with a smooth `p − 1` is weak.

?? Why does a prime with a smooth `p − 1` weaken Diffie-Hellman?
+ Discrete logs split into small subgroup problems
- Modular inverses stop existing for most elements
- The shared secret becomes equal to zero
- The generator can no longer reach one
=> Pohlig-Hellman solves the log in each small subgroup, then recombines the answers. Safe primes leave no such small subgroups.

## Exercise

::: law Lab only
This is pure maths on your own numbers. Don't test real private keys that aren't yours.
:::

The Python below uses numbers small enough to check by hand.

1. List the powers of each number from 2 to 6 modulo 7. Which are generators?
2. Compute `pow(7, -1, 26)`, then check it by multiplying.
3. Build toy RSA: `p = 61`, `q = 53`, `n = 3233`, `φ = 3120`, `e = 17`. Find `d` with `pow(17, -1, 3120)`. You should get 2753. Encrypt 65 with `pow(65, 17, 3233)` to get 2790, then decrypt.
4. Generate two RSA moduli that share a prime on purpose, then break both using `math.gcd`. Explain why this needs no factoring.
5. Time a brute force discrete log for a 20-bit, 24-bit and 28-bit prime. Extrapolate to 2048 bits, and write down the result.

?! Explain, without formulas, why RSA needs keys about ten times longer than a comparable elliptic-curve key.

## Further reading

- [A Graduate Course in Applied Cryptography](https://toc.cryptobook.us/), the number theory chapters.
- [NIST SP 800-57 Part 1](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final), for security strengths.
- [Mining Your Ps and Qs](https://factorable.net/), on weak keys in the wild.
- [SageMath](https://www.sagemath.org/), free software for this kind of work.
- Dan Boneh, [Twenty Years of Attacks on the RSA Cryptosystem](https://crypto.stanford.edu/~dabo/papers/RSA-survey.pdf).
