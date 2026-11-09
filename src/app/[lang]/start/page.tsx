import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { Pace } from "@/components/Pace";
import { SiteMap } from "@/components/SiteMap";
import { buildPath } from "@/lib/path";
import { strings, type LangParams } from "@/i18n/server";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: (await strings(params)).t.home.how };
}

export default async function Page({ params }: LangParams) {
  const { lang } = await strings(params);
  if (lang === "fr") return <French />;
  return (
    <div className="page narrow prose-page tour">
      <header className="page-head">
        <p className="kicker">Start here, 2 minutes</p>
        <h1>How CyberDojo works</h1>
        <p className="lede">This site takes you from zero to a job in cybersecurity. It's big, but you only ever need to look at one thing: your next step.</p>
      </header>

      <section>
        <h2><span className="tour-n">1</span> The one rule</h2>
        <p>Open <Link href="/roadmap/">the Roadmap</Link>, and do the step it marks. When you finish, it moves on. You never need to decide what to study, or look through menus.</p>
        <SiteMap />
      </section>

      <section>
        <h2><span className="tour-n">2</span> What each part is for</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Part</th><th>What it is</th><th>When you use it</th></tr></thead>
            <tbody>
              <tr><td><Link href="/roadmap/">Roadmap</Link></td><td>Every step for 24 months, in order</td><td>Every time you sit down</td></tr>
              <tr><td><Link href="/courses/">Lessons</Link></td><td>Teach one skill, with questions and exercises</td><td>When the Roadmap sends you</td></tr>
              <tr><td><Link href="/practice/">Practice</Link></td><td>Cases, hunts, drills, machines and daily review</td><td>A little, most days</td></tr>
              <tr><td><Link href="/projects/">Projects</Link></td><td>16 real things you build and publish</td><td>When the Roadmap sends you</td></tr>
              <tr><td><Link href="/library/">Library</Link></td><td>The Handbook, cheat sheets, glossary and resources</td><td>When you want to look something up</td></tr>
              <tr><td><Link href="/skills/">Progress</Link></td><td>Your belt, your skills and what you can now do</td><td>Whenever you want to see how far you've come</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2><span className="tour-n">3</span> Lessons or Handbook?</h2>
        <p>People often mix these up, so here's the difference.</p>
        <div className="compare">
          <div className="card">
            <p className="band">Lessons</p>
            <h3>Teach you to do something</h3>
            <p className="muted">"How do Linux permissions work?" You learn it, answer questions, and practise in a terminal. There are 78, in a set order, and each builds on the last.</p>
          </div>
          <div className="card">
            <p className="band">Handbook</p>
            <h3>Advice about the journey</h3>
            <p className="muted">"Which job suits me?" "How do I write a CV?" You read it once, at the right moment. It teaches no technical skills, and the Roadmap brings you to each page when it's useful.</p>
          </div>
        </div>
      </section>

      <section>
        <h2><span className="tour-n">4</span> What a lesson looks like</h2>
        <ol>
          <li><strong>Read.</strong> Everything is explained from scratch. Hover over, or tap, any dotted word to see its meaning.</li>
          <li><strong>Answer.</strong> Each section has a question, and you're told why straight away.</li>
          <li><strong>Do.</strong> Type real commands in the terminal on the page. Finish a mission by typing <code>submit your-answer</code>.</li>
          <li><strong>Get corrected.</strong> One button copies all your answers for your AI tutor.</li>
          <li><strong>Mark it as done.</strong> Your roadmap moves on, and questions come back later in your daily review, just before you'd forget them.</li>
        </ol>
      </section>

      <section>
        <h2><span className="tour-n">5</span> How you'll know you're improving</h2>
        <ul>
          <li><strong>Belts.</strong> You earn a new one each time you finish a stage, from white to black.</li>
          <li><strong>Exit gates.</strong> Each month ends with skills to prove with no notes and no AI. Passing one means that you really can do it.</li>
          <li><strong>A list of what you can now do.</strong> It grows with each lesson, in plain words.</li>
          <li><strong>Less help.</strong> Projects guide you step by step at first. As you improve, they guide you less, so you'll feel yourself needing them less.</li>
        </ul>
      </section>

      <section>
        <h2><span className="tour-n">6</span> Pick your pace</h2>
        <p>Your progress stays in this browser, and nothing is sent anywhere. Save it to a file from <Link href="/skills/">Progress</Link> before you change computer.</p>
        <Pace path={buildPath("en")} />
      </section>
    </div>
  );
}

/** The same tour in French. Kept as its own copy: the sentences are built around their links. */
function French() {
  return (
    <div className="page narrow prose-page tour">
      <header className="page-head">
        <p className="kicker">Pour commencer, 2 minutes</p>
        <h1>Comment fonctionne CyberDojo</h1>
        <p className="lede">Ce site vous emmène de zéro jusqu&apos;à un poste en cybersécurité. Il est vaste, mais vous n&apos;avez jamais qu&apos;une seule chose à regarder : votre prochaine étape.</p>
      </header>

      <section>
        <h2><span className="tour-n">1</span> La seule règle</h2>
        <p>Ouvrez <Link href="/roadmap/">le parcours</Link>, et faites l&apos;étape qu&apos;il indique. Quand vous la terminez, il avance. Vous n&apos;avez jamais à décider quoi étudier, ni à fouiller dans les menus.</p>
        <SiteMap lang="fr" />
      </section>

      <section>
        <h2><span className="tour-n">2</span> À quoi sert chaque partie</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Partie</th><th>Ce que c&apos;est</th><th>Quand l&apos;utiliser</th></tr></thead>
            <tbody>
              <tr><td><Link href="/roadmap/">Parcours</Link></td><td>Chaque étape sur 24 mois, dans l&apos;ordre</td><td>À chaque fois que vous vous installez</td></tr>
              <tr><td><Link href="/courses/">Leçons</Link></td><td>Enseignent une compétence, avec des questions et des exercices</td><td>Quand le parcours vous y envoie</td></tr>
              <tr><td><Link href="/practice/">Pratique</Link></td><td>Dossiers, chasses, exercices, machines et révision du jour</td><td>Un peu, presque tous les jours</td></tr>
              <tr><td><Link href="/projects/">Projets</Link></td><td>16 vraies réalisations à construire et publier</td><td>Quand le parcours vous y envoie</td></tr>
              <tr><td><Link href="/library/">Bibliothèque</Link></td><td>Le manuel, les aide-mémoire, le glossaire et les ressources</td><td>Quand vous voulez vérifier quelque chose</td></tr>
              <tr><td><Link href="/skills/">Progrès</Link></td><td>Votre ceinture, vos compétences et ce que vous savez faire maintenant</td><td>Quand vous voulez voir le chemin parcouru</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2><span className="tour-n">3</span> Leçons ou manuel ?</h2>
        <p>On confond souvent les deux, alors voici la différence.</p>
        <div className="compare">
          <div className="card">
            <p className="band">Leçons</p>
            <h3>Vous apprennent à faire quelque chose</h3>
            <p className="muted">« Comment fonctionnent les permissions Linux ? » Vous l&apos;apprenez, répondez à des questions et pratiquez dans un terminal. Il y en a 78, dans un ordre fixe, et chacune s&apos;appuie sur la précédente.</p>
          </div>
          <div className="card">
            <p className="band">Manuel</p>
            <h3>Des conseils sur le chemin</h3>
            <p className="muted">« Quel métier me convient ? » « Comment rédiger un CV ? » Vous le lisez une fois, au bon moment. Il n&apos;enseigne aucune compétence technique, et le parcours vous amène à chaque page quand elle devient utile.</p>
          </div>
        </div>
      </section>

      <section>
        <h2><span className="tour-n">4</span> À quoi ressemble une leçon</h2>
        <ol>
          <li><strong>Lire.</strong> Tout est expliqué depuis le début. Survolez, ou touchez, n&apos;importe quel mot souligné en pointillés pour voir sa définition.</li>
          <li><strong>Répondre.</strong> Chaque section a une question, et l&apos;explication vient tout de suite.</li>
          <li><strong>Faire.</strong> Tapez de vraies commandes dans le terminal de la page. Terminez une mission en tapant <code>submit votre-réponse</code>.</li>
          <li><strong>Se faire corriger.</strong> Un bouton copie toutes vos réponses pour votre tuteur IA.</li>
          <li><strong>Marquer comme faite.</strong> Votre parcours avance, et les questions reviennent plus tard dans votre révision du jour, juste avant que vous ne les oubliiez.</li>
        </ol>
      </section>

      <section>
        <h2><span className="tour-n">5</span> Comment vous saurez que vous progressez</h2>
        <ul>
          <li><strong>Les ceintures.</strong> Vous en gagnez une nouvelle à chaque étape franchie, de la blanche à la noire.</li>
          <li><strong>Les validations.</strong> Chaque mois se termine par des compétences à prouver sans notes ni IA. En réussir une veut dire que vous savez vraiment le faire.</li>
          <li><strong>La liste de ce que vous savez faire.</strong> Elle s&apos;allonge à chaque leçon, en mots simples.</li>
          <li><strong>Moins d&apos;aide.</strong> Au début, les projets vous guident pas à pas. À mesure que vous progressez, ils vous guident moins, et vous sentirez que vous en avez moins besoin.</li>
        </ul>
      </section>

      <section>
        <h2><span className="tour-n">6</span> Choisissez votre rythme</h2>
        <p>Votre progression reste dans ce navigateur, et rien n&apos;est envoyé nulle part. Enregistrez-la dans un fichier depuis <Link href="/skills/">Progrès</Link> avant de changer d&apos;ordinateur.</p>
        <Pace path={buildPath("fr")} />
      </section>
    </div>
  );
}
