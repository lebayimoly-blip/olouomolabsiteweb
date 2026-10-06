// RévisIA — fonction Netlify (remplace le serveur Render)
// Garde la clé API Claude côté serveur et limite chaque élève à DAILY_LIMIT demandes par jour.
// Variables à définir dans Netlify (Site configuration > Environment variables) :
//   ANTHROPIC_API_KEY (obligatoire), CLAUDE_MODEL (facultatif), DAILY_LIMIT (facultatif)

const MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5';
const DAILY_LIMIT = parseInt(process.env.DAILY_LIMIT || '30', 10);
const API_URL = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com') + '/v1/messages';
const MAX_TEXT = 12000;
const MAX_TURNS = 16;

// ---------- Les 4 options de révision ----------
const BASE = `Tu es RévisIA, un assistant de révision créé par OLOUOMO LAB (Gabon) pour aider les élèves et étudiants.
Tu réponds toujours en français clair, avec un ton bienveillant et encourageant.
Adapte ton vocabulaire au niveau de l'élève. Utilise des exemples concrets, si possible tirés de la vie quotidienne au Gabon.
Mise en forme : titres courts avec ##, listes à puces, **gras** pour les mots importants. Pas de tableaux.
Si la demande n'a rien à voir avec les études, ramène gentiment l'élève vers ses révisions.`;

const MODES = {
  expliquer: `${BASE}
MISSION : expliquer une leçon simplement.
- Commence par l'idée principale en 2 phrases maximum.
- Explique ensuite étape par étape, avec des mots simples et au moins un exemple concret.
- Termine par "## Pour vérifier que tu as compris" avec 2 petites questions (sans les réponses).`,

  fiche: `${BASE}
MISSION : créer une fiche de révision à partir du cours fourni.
Structure obligatoire :
## L'essentiel en 3 lignes
## Notions clés (définitions courtes)
## Formules / dates / règles à retenir (si pertinent)
## Pièges à éviter
## Astuce mémo (moyen mnémotechnique)
Reste fidèle au cours fourni : n'invente pas de contenu hors programme.`,

  exercice: `${BASE}
MISSION : aider à faire un exercice PAS À PAS, comme un bon répétiteur.
Règles strictes :
- Ne donne JAMAIS la réponse finale directement, même si l'élève insiste.
- Identifie d'abord ce que l'exercice demande, puis donne UNE seule étape ou un indice à la fois.
- Termine chaque message par une question qui fait avancer l'élève.
- Quand l'élève propose une réponse, dis-lui si c'est juste, explique pourquoi, et félicite-le quand il trouve.`,

  quiz: `${BASE}
MISSION : créer un quiz QCM d'entraînement sur le cours ou le thème fourni.
Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, sans balises de code, au format :
{"titre":"...","questions":[{"question":"...","choix":["...","...","...","..."],"bonne":0,"explication":"..."}]}
- "bonne" est l'index (0 à 3) de la bonne réponse. Varie sa position.
- "explication" : 1 à 2 phrases qui expliquent la bonne réponse.
- Questions de difficulté progressive, fidèles au cours.`,
};

const NIVEAUX = ['Primaire', 'Collège', 'Lycée', 'Université', 'Adulte / formation'];

// ---------- Quota journalier (Netlify Blobs, avec repli en mémoire) ----------
// L'adresse IP n'est jamais stockée en clair : seulement une empreinte anonyme.
let store = null;
const memory = new Map();
async function getQuotaStore() {
  if (store) return store;
  try {
    const { getStore } = await import('@netlify/blobs');
    store = getStore({ name: 'revisia-quota', consistency: 'strong' });
  } catch (e) {
    console.warn('[RévisIA] Netlify Blobs indisponible, quota en mémoire :', e.message);
    store = {
      get: async (k) => memory.get(k) ?? null,
      set: async (k, v) => { memory.set(k, v); },
    };
  }
  return store;
}
async function quotaKey(ip) {
  const day = new Date().toISOString().slice(0, 10);
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('revisia:' + day + ':' + ip));
  const hash = [...new Uint8Array(buf)].slice(0, 12).map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${day}/${hash}`;
}
async function getUsed(key) {
  try { const s = await getQuotaStore(); return parseInt((await s.get(key)) || '0', 10) || 0; }
  catch (e) { console.warn('[RévisIA] lecture quota :', e.message); return memory.get(key) || 0; }
}
async function setUsed(key, n) {
  memory.set(key, n);
  try { const s = await getQuotaStore(); await s.set(key, String(n)); }
  catch (e) { console.warn('[RévisIA] écriture quota :', e.message); }
}

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});

function parseQuiz(text) {
  try {
    const s = text.indexOf('{'), e = text.lastIndexOf('}');
    const q = JSON.parse(text.slice(s, e + 1));
    const questions = (q.questions || []).filter((x) =>
      x && x.question && Array.isArray(x.choix) && x.choix.length >= 2 &&
      Number.isInteger(x.bonne) && x.bonne >= 0 && x.bonne < x.choix.length);
    // Mélange les choix pour que la bonne réponse ne soit pas toujours à la même place
    for (const x of questions) {
      const good = x.choix[x.bonne];
      for (let i = x.choix.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x.choix[i], x.choix[j]] = [x.choix[j], x.choix[i]]; }
      x.bonne = x.choix.indexOf(good);
    }
    return questions.length ? { titre: q.titre || 'Quiz', questions } : null;
  } catch { return null; }
}

export default async (req, context) => {
  const url = new URL(req.url);
  const ip = context?.ip || req.headers.get('x-nf-client-connection-ip') || 'inconnu';
  const key = await quotaKey(ip);

  // ----- GET /revisia/api/config -----
  if (url.pathname.endsWith('/config')) {
    const used = await getUsed(key);
    return json({ limit: DAILY_LIMIT, remaining: Math.max(0, DAILY_LIMIT - used), niveaux: NIVEAUX });
  }

  // ----- POST /revisia/api/revise -----
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, 405);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[RévisIA] ANTHROPIC_API_KEY manquante dans les variables Netlify');
    return json({ error: 'Le service IA n\'est pas encore configuré.' }, 500);
  }
  let body;
  try { body = await req.json(); } catch { return json({ error: 'Requête invalide.' }, 400); }
  const { mode, niveau, matiere, messages, image, nbQuestions } = body || {};
  if (!MODES[mode]) return json({ error: 'Option de révision inconnue.' }, 400);
  if (!Array.isArray(messages) || !messages.length) return json({ error: 'Message vide.' }, 400);

  const hist = messages.slice(-MAX_TURNS).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content || '').slice(0, MAX_TEXT),
  })).filter((m) => m.content.trim());
  while (hist.length && hist[0].role !== 'user') hist.shift();
  if (!hist.length || hist[hist.length - 1].role !== 'user')
    return json({ error: 'Le dernier message doit venir de l\'élève.' }, 400);

  if (image) {
    const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/.exec(image);
    if (!m) return json({ error: 'Format d\'image non accepté (JPG, PNG, WEBP).' }, 400);
    const last = hist[hist.length - 1];
    last.content = [
      { type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } },
      { type: 'text', text: last.content },
    ];
  }

  const used = await getUsed(key);
  if (used >= DAILY_LIMIT) return json({
    error: `Tu as atteint ta limite de ${DAILY_LIMIT} demandes pour aujourd'hui. Reviens demain pour continuer tes révisions !`,
    remaining: 0,
  }, 429);
  await setUsed(key, used + 1);
  const remaining = Math.max(0, DAILY_LIMIT - used - 1);

  let system = MODES[mode];
  const ctx = [];
  if (NIVEAUX.includes(niveau)) ctx.push(`Niveau de l'élève : ${niveau}.`);
  if (matiere) ctx.push(`Matière : ${String(matiere).slice(0, 60)}.`);
  if (mode === 'quiz') ctx.push(`Nombre de questions : ${Math.min(Math.max(parseInt(nbQuestions, 10) || 5, 3), 10)}.`);
  if (ctx.length) system += `\n\nCONTEXTE : ${ctx.join(' ')}`;

  try {
    // Jusqu'à 3 essais si l'API est surchargée ou limite le débit (429 / 5xx)
    let r, data;
    for (let attempt = 0; attempt < 3; attempt++) {
      r = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({ model: MODEL, max_tokens: mode === 'quiz' ? 3000 : 1800, system, messages: hist }),
      });
      data = await r.json().catch(() => ({}));
      if (r.ok || !(r.status === 429 || r.status >= 500) || attempt === 2) break;
      console.warn('[RévisIA] Anthropic', r.status, '— nouvel essai');
      await new Promise((res) => setTimeout(res, 1500 * (attempt + 1)));
    }
    if (!r.ok) {
      console.error('[RévisIA] Anthropic', r.status, data?.error?.message);
      await setUsed(key, used); // demande non facturée à l'élève
      return json({ error: 'Le service IA est momentanément indisponible. Réessaie dans un instant.', remaining: remaining + 1 }, 502);
    }
    const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
    if (mode === 'quiz') {
      const quiz = parseQuiz(text);
      if (!quiz) return json({ error: 'Le quiz n\'a pas pu être généré. Réessaie.', remaining }, 502);
      return json({ quiz, remaining });
    }
    return json({ text, remaining });
  } catch (err) {
    console.error('[RévisIA]', err.message);
    await setUsed(key, used);
    return json({ error: 'Le service IA est momentanément indisponible. Réessaie dans un instant.', remaining: remaining + 1 }, 502);
  }
};

export const config = {
  path: ['/revisia/api/config', '/revisia/api/revise'],
};
