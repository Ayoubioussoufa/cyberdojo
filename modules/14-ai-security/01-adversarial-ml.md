---
title: Adversarial machine learning
summary: Models have an attack surface that's separate from prompts. Evasion, poisoning, backdoors, extraction and privacy leaks, with what the evidence says about defending them.
level: advanced
side: defence
minutes: 50
attack: none
needs: 0076-machine-learning-for-detection, 0071-securing-ai-applications
pair: 16-07-reading-and-doing-research
source: NIST AI 100-2, Adversarial Machine Learning | https://csrc.nist.gov/pubs/ai/100/2/e2025/final
words: adversarial example, data poisoning, membership inference
---
Lessons 71 and 73 dealt with attacks on LLM applications. Beneath them lies an older research field about machine learning itself: how models can be fooled, corrupted, copied, or made to reveal their training data. Lesson 76 touched on it. This module maps the area, and it's honest about how weak many defences remain.

@term adversarial example = An input changed very slightly so that a model gets it wrong.
@term model backdoor = A hidden behaviour planted in training, which activates on a specific trigger.
@term model extraction = Recreating a model's behaviour by querying it.
@term membership inference = Determining whether a given record was part of a model's training data.

## Concept

### Fundamentals: a lifecycle of attacks

[NIST AI 100-2](https://csrc.nist.gov/pubs/ai/100/2/e2025/final) organises attacks by stage and goal.

| Stage | Attack | Goal |
|---|---|---|
| Training | Poisoning, backdoors | Integrity |
| Deployment | Evasion | Integrity |
| Deployment | Extraction | Confidentiality of the model |
| Deployment | Inversion, membership inference | Privacy of the data |
| Deployment | Sponge inputs | Availability |

The attacker's knowledge matters: **white-box** means seeing the weights, while **black-box** means only querying.

### Evasion

In 2014, [Szegedy and others](https://arxiv.org/abs/1312.6199) showed that tiny, near-invisible image changes could flip a neural network's answer. [Goodfellow and others](https://arxiv.org/abs/1412.6572) explained why: models behave almost linearly in high dimensions, so many small changes add up.

For security, this isn't only a vision curiosity. A malware classifier is a model too, and small changes to a file that keep its behaviour can change its score. [Lesson 76](/courses/0076-machine-learning-for-detection/) warned about this. Physical-world versions exist, such as stickers on road signs in research settings.

### Poisoning and backdoors

If an attacker can influence training data, they might degrade a model, or plant a **backdoor**: it behaves normally unless a trigger is present. Data for training is often scraped or crowd-sourced, so this is a real supply chain issue. [Carlini and others](https://arxiv.org/abs/2302.10149) showed that poisoning web-scale datasets is practical, for example by buying expired domains that a dataset points to.

Model files are themselves a risk. Python's `pickle` format can execute code on load, which is [insecure deserialization](/modules/04-09-deserialization/) in a new form. Prefer `safetensors`.

### Extraction and privacy

**Extraction**: [Tramèr and others](https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/tramer) showed in 2016 that querying an API can recreate a model. It steals intellectual property, and it can help craft evasions offline.

**Membership inference**: [Shokri and others](https://arxiv.org/abs/1610.05820) showed that a model behaves differently on its training data, which reveals who was in the dataset. For a medical model, that alone is sensitive. **Model inversion** tries to reconstruct training examples.

### Advanced: the state of defence

Defences have a sobering record. Many proposed protections against adversarial examples have been broken soon after publication, as [Athalye and others](https://arxiv.org/abs/1802.00420) showed, since they hid gradients rather than adding robustness. [Carlini and Wagner's](https://arxiv.org/abs/1705.07263) work set a high bar for evaluating them.

| Defence | Helps with | Cost |
|---|---|---|
| Adversarial training | Evasion | Accuracy, compute |
| Certified robustness | Evasion, with guarantees | Small perturbation only |
| Differential privacy | Membership inference | Accuracy |
| Data provenance, filtering | Poisoning | Pipeline effort |
| Rate limits, monitoring | Extraction | Some legitimate use |
| Signed models | Supply chain tampering | Process |

The practical conclusion: **don't let a model be the only control**. Treat its output as a signal, with rules, limits and human review around it.

?? When does a model evasion attack happen?
+ At inference, on an already trained model
- At training, inside the labelled training dataset
- At deployment, inside the container image build
- At purchase, inside the vendor's licence terms
=> Evasion changes inputs to a finished model, whereas poisoning interferes earlier, during training.

## Threat model

Ask who controls what: training data, weights, inputs, or just outputs. A SOC classifier faces evasion, a fraud model faces gradual poisoning through feedback, and a downloaded model might carry a backdoor. [MITRE ATLAS](https://atlas.mitre.org/) maps these as tactics and techniques, in the style of ATT&CK.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Adversarial Robustness Toolbox | Attacks and defences in a library | Experiments on your models |
| Foolbox, CleverHans | Evasion testing | Research |
| TextAttack | Attacks on NLP models | Text classifiers |
| `safetensors` | Safe model format | Avoiding code in model files |
| ModelScan, `picklescan` | Check model files | Vetting downloads |
| MITRE ATLAS | Threat knowledge base | Threat modelling |

## Defence

- **Know your data's provenance,** and version your datasets.
- **Treat models as code:** scan, sign and review them.
- **Use safe formats,** and never load an untrusted pickle.
- **Limit and monitor queries.**
- **Validate before updating models** from new data, to catch drift or poisoning.
- **Test robustness** as part of evaluation.
- **Keep humans and rules around high-stakes decisions.**

## Pitfalls

- **Testing only on clean data.** It says little about an adversary.
- **Trusting a downloaded model** like you'd trust a data file.
- **Claiming robustness without an adaptive attack.** A proper test assumes that the attacker knows the defence.
- **Using accuracy alone.** See the [base-rate trap](/courses/0076-machine-learning-for-detection/).
- **Assuming an API hides the model.** Queries leak it.

?? What does membership inference reveal?
+ Whether one record was in training data
- Whether one model uses a GPU cluster
- Whether one user holds an admin role
- Whether one firewall rule has been applied
=> Models often respond more confidently on data they've seen, and that difference can leak who was in the dataset.

## Exercise

::: law Lab only
Use models you trained yourself and public datasets. Don't query someone else's production model to copy it or to test its privacy.
:::

1. Train a small classifier on MNIST or on the detection data from lesson 76.
2. With the Adversarial Robustness Toolbox, generate adversarial examples using FGSM. Plot accuracy against perturbation size.
3. Add adversarial training, and compare the clean and robust accuracy.
4. Poison 5% of your labels, retrain, and measure the drop.
5. Compare model confidence on training and test samples. What would that reveal?
6. Run `picklescan` on a model file you've downloaded in an isolated VM.

?! Your SOC wants to auto-close alerts using a model. List the adversarial ML risks, and the controls you'd require.

## Further reading

- [NIST AI 100-2](https://csrc.nist.gov/pubs/ai/100/2/e2025/final).
- [MITRE ATLAS](https://atlas.mitre.org/).
- Goodfellow and others, [Explaining and Harnessing Adversarial Examples](https://arxiv.org/abs/1412.6572).
- Athalye and others, [Obfuscated Gradients Give a False Sense of Security](https://arxiv.org/abs/1802.00420).
- Shokri and others, [Membership Inference Attacks Against Machine Learning Models](https://arxiv.org/abs/1610.05820).
