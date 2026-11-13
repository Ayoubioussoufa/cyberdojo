# Security policy

Please don't open a public issue for a vulnerability. Report it privately through GitHub: the repository's **Security** tab, **Report a vulnerability**. You'll get an answer within a week.

In scope: the website (sign-in, sessions, progress sync, the admin statistics), the desktop app (its local server, the window token, the tutor's routes, the Ollama installer and its checks), and the installers published in the releases.

The deliberately vulnerable targets inside the course (the Dojo and "Try to break in") are simulations that run in the learner's browser. Breaking them is the exercise, not a vulnerability.

To check an installer you downloaded, compare its SHA-256 with the `SHA256SUMS.txt` file of the same release.
