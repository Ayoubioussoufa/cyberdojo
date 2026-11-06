---
title: Machine learning for detection
summary: Build a phishing URL classifier from scratch in plain Python, then learn why good scores lie: the base-rate trap, leakage, drift, and attacks on models.
month: 20
minutes: 60
builds: a working classifier, and the judgement to distrust its score
source: NIST AI 100-2, Adversarial Machine Learning | https://csrc.nist.gov/pubs/ai/100/2/e2025/final
words: feature, overfitting, concept drift
---
Before language models, security used machine learning for years: spam filters, malware classifiers and anomaly detection. It's still everywhere, and it's worth building once. After this, no vendor can impress you with "99% accurate AI".

@term machine learning = Software that learns patterns from examples instead of following written rules.
@term feature = A measurable property of an example, used as input to a model.
@term label = The right answer attached to a training example.
@term supervised learning = Learning from examples that have labels.
@term unsupervised learning = Finding structure in data with no labels.
@term overfitting = When a model memorises its training data and does badly on new data.
@term data leakage (ML) = When information about the answer slips into a model's inputs, inflating its score.
@term concept drift = When the real world changes, so a model's accuracy falls over time.
@term anomaly detection = Flagging what's unusual compared with normal behaviour.
@term data poisoning = Corrupting training data so that a model learns the wrong thing.

## Rules or examples

A detection rule is written by a person: "if the parent is Word and the child is PowerShell". **Machine learning** works the other way round: show it thousands of examples with the right answers, and let it find the pattern.

| Word | In a spam filter |
|---|---|
| **Example** | One email |
| **Feature** | The words in it |
| **Label** | "Spam" or "not spam" |
| **Model** | The numbers it learned |
| **Prediction** | Its guess for a new email |

With labels, it's **supervised learning**. Without labels, it's **unsupervised**: finding clusters, or spotting what doesn't fit, which is called **anomaly detection**. That suits security, because attacks are rare and often unlabelled, but "unusual" isn't the same as "malicious".

?? You've got a year of login data with no labels. Which approach fits?
+ Anomaly detection, flagging logins unlike the normal ones
- Supervised learning, because labels aren't actually needed here
- A rule that blocks every login from anywhere
- Nothing can be learned from any unlabelled data
=> With no labels, you model normal behaviour and look for departures. Expect plenty of harmless oddities.

## Build one

This is a complete **Naive Bayes** classifier, which is the idea behind early spam filters. It counts how often each word appears in each class, then asks which class makes a new URL more likely. It uses no libraries, and the data is generated, so every domain is a harmless fake.

```python
import math
import random
from collections import Counter

SAFE = ["mail", "docs", "shop", "news", "portal", "blog", "cdn", "api", "www", "learn"]
BAIT = ["login", "verify", "secure", "account", "update", "confirm", "paypa1", "reset"]
TLDS = ["example", "test", "invalid"]

def make(label, rng):
    if label == "phish":
        parts = rng.sample(BAIT, 2) + [str(rng.randint(10, 999))]
        rng.shuffle(parts)
        return "-".join(parts) + "." + rng.choice(TLDS)
    return rng.choice(SAFE) + "." + rng.choice(["oasis", "atlas", "north"]) + "." + rng.choice(TLDS)

def words(url):
    """The features: the pieces of the address."""
    return url.replace("-", ".").split(".")

def train(rows):
    counts = {"phish": Counter(), "safe": Counter()}
    docs = Counter()
    for url, label in rows:
        docs[label] += 1
        counts[label].update(words(url))
    return counts, docs

def score(url, label, counts, docs):
    total = sum(counts[label].values())
    vocab = len(set(counts["phish"]) | set(counts["safe"]))
    s = math.log(docs[label] / sum(docs.values()))
    for w in words(url):
        s += math.log((counts[label][w] + 1) / (total + vocab))
    return s

def predict(url, counts, docs):
    return max(("phish", "safe"), key=lambda c: score(url, c, counts, docs))

rng = random.Random(7)
data = [(make(l, rng), l) for l in ["phish", "safe"] * 200]
rng.shuffle(data)
cut = int(len(data) * 0.7)
train_set, test_set = data[:cut], data[cut:]
counts, docs = train(train_set)

tp = fp = fn = tn = 0
for url, truth in test_set:
    said = predict(url, counts, docs)
    if said == "phish" and truth == "phish": tp += 1
    elif said == "phish": fp += 1
    elif truth == "phish": fn += 1
    else: tn += 1
print(f"precision {tp / max(tp + fp, 1):.2f}  recall {tp / max(tp + fn, 1):.2f}")
print(predict("verify-login-204.example", counts, docs))
print(predict("docs.oasis.example", counts, docs))
print(predict("invoice-payment-77.example", counts, docs))
```

Save it as `classify.py`, and run `python3 classify.py`. This is the real output:

```
precision 1.00  recall 1.00
phish
safe
safe
```

Notice the split. The model learned from 70% of the data, and it was tested on the 30% that it had never seen. Testing on your training data is like giving students the exam in advance.

?? Why keep part of the data out of training?
+ To measure performance on examples it hasn't seen
- To make the training run use less electricity
- Because models can only read 70% of files
- So that attackers can't reach the remaining data
=> A model can memorise what it has seen. Only unseen data shows whether it learned something general.

## Now distrust it

Perfect scores! And look at the last line. `invoice-payment-77.example` is obviously phishing-shaped, and the model called it safe. Why? Its bait words weren't in training, so it had nothing to go on. Our score was perfect only because the test data came from the same narrow generator as the training data.

::: key Too good means check harder
A perfect score in security nearly always means a problem with your test, not a miracle. Real data is messy, and attackers don't follow your dataset.
:::

Here are the classic ways scores lie.

| Problem | What happens | Check |
|---|---|---|
| **Overfitting** | It memorises training data | Compare training and test scores |
| **Data leakage** | The answer slips into the features | Ask if that feature exists at prediction time |
| **Concept drift** | The world changes | Measure again over time |
| Base-rate neglect | Rare attacks swamp the score | Calculate precision at the real rate |

@drill ml-problem

?? A model scores 100% on test data, then fails on real traffic. What's the first thing to suspect?
+ The test data doesn't resemble the real traffic
- Real traffic must be broken in some way
- The model needs a much higher price tag
- The operating system's clock has drifted by accident
=> A test only tells you about data like itself. Collect realistic data, from later in time, before you trust a number.

## The base-rate trap

This is the most important idea in the lesson. Suppose that a detector catches 100% of attacks and wrongly flags just 1% of normal events. Sounds excellent. Now use it on 100,000 events, of which 10 are attacks.

| | Count |
|---|---|
| Real attacks caught | 10 |
| False alarms (1% of 99,990) | 1,000 |
| Share of alerts that are real | **under 1%** |

Ninety-nine in every hundred alerts are false. When attacks are rare, a small false-positive rate overwhelms them. That's why "99% accurate" means little in security, and why precision at the real rate is the number to ask for.

@drill base-rate

?? A vendor claims "99% accuracy". What should you ask next?
+ What's the precision at our real attack rate?
- Which colour is used on the product's dashboard?
- How many other customers use the same logo?
- Was the marketing page written by an engineer?
=> Accuracy on balanced test data says little. Ask how many alerts you'd get a day, and how many would be real.

## Attacks on models

Models are software, and they can be attacked. NIST's [adversarial machine learning taxonomy](https://csrc.nist.gov/pubs/ai/100/2/e2025/final) names the main families.

| Attack | When | Example |
|---|---|---|
| **Evasion** | At prediction time | Changing a sample until it's called safe |
| **Poisoning** | At training time | Slipping bad examples into the data |
| Privacy attacks | After deployment | Extracting training data from a model |
| Abuse | Through normal use | Using a model's power for harm |

The defences are mostly engineering. Control your training data, retrain and re-measure, watch for drift, and never let one model be your only line of defence.

?? An attacker pads a malware file until a classifier calls it benign. What's that called?
+ Evasion, changing only the input at prediction time
- Poisoning, corrupting the data used for model training
- Concept drift, a natural change over the years
- Overfitting, memorising every file in the training set
=> The model didn't change, and the input did. Evasion is why classifiers need backup from behaviour-based detection.

?! Improve the classifier: add a feature, such as the URL's length or its count of digits, or better training data. What changed, and how would you know it helped in the real world?
