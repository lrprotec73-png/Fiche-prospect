// Pour l'envoi automatique du mail : coller ici l'URL du script Google (se termine par /exec).
// Laisser vide "" : le bouton Terminé ouvre Gmail avec le mail déjà rempli.
const URL_ENVOI = "";

const LISTES = {
  nuisibles: ["Rats","Souris","Blattes","Mouches","Fourmis","Punaises de lit","Guêpes","Autres"],
  niveau: ["Aucun","Faible","Moyen","Fort"],
  zones: ["Abords extérieurs","Réserve","Cuisine","Salle","Bar","Caves / sous-sols","Locaux poubelles","Faux plafonds / gaines"],
  contrat: ["1 an","3 ans","Ponctuel 1 mois","Ponctuel 2 mois","Autre"]
};
const UNIQUE = ["niveau","contrat"];
const CLE = "fiche3d";

for (const [g, vals] of Object.entries(LISTES)) {
  const div = document.getElementById(g);
  const type = UNIQUE.includes(g) ? "radio" : "checkbox";
  vals.forEach(v => div.insertAdjacentHTML("beforeend",
    `<label><input type="${type}" name="${g}" value="${v}">${v}</label>`));
}

const val = id => document.getElementById(id).value.trim();
function cocher(g, v) {
  document.querySelectorAll(`input[name="${g}"]`).forEach(c => { if (c.value === v) c.checked = true; });
}
function coches(g) {
  return [...document.querySelectorAll(`input[name="${g}"]:checked`)].map(c => c.value).join(", ");
}

function sauver() {
  const d = {};
  document.querySelectorAll("input,textarea").forEach(e => {
    if (e.type === "checkbox" || e.type === "radio") {
      if (e.checked) (d["_" + e.name] = d["_" + e.name] || []).push(e.value);
    } else if (e.id && e.id !== "monMail") d[e.id] = e.value;
  });
  localStorage.setItem(CLE, JSON.stringify(d));
  localStorage.setItem("monMail", val("monMail"));
}
function charger() {
  const d = JSON.parse(localStorage.getItem(CLE) || "{}");
  for (const k in d) {
    if (k.startsWith("_")) d[k].forEach(v => cocher(k.slice(1), v));
    else if (document.getElementById(k)) document.getElementById(k).value = d[k];
  }
  document.getElementById("monMail").value = localStorage.getItem("monMail") || "";
  if (!val("dateVisite")) document.getElementById("dateVisite").value = new Date().toISOString().slice(0, 10);
}
document.addEventListener("input", sauver);
document.addEventListener("change", sauver);
charger();

const NOMBRES = {un:1, une:1, deux:2, trois:3, quatre:4, cinq:5, six:6, huit:8, dix:10, douze:12};
const MOTS_ZONES = [[/ext[ée]rieur/,"Abords extérieurs"],[/r[ée]serve/,"Réserve"],[/cuisine/,"Cuisine"],[/\bsalle\b/,"Salle"],[/\bbar\b/,"Bar"],[/cave|sous-sol/,"Caves / sous-sols"],[/poubelle/,"Locaux poubelles"],[/plafond|gaine/,"Faux plafonds / gaines"]];
const MOTS_NUIS = [[/\brats?\b/,"Rats"],[/souris/,"Souris"],[/blatte|cafard/,"Blattes"],[/mouche/,"Mouches"],[/fourmi/,"Fourmis"],[/punaise/,"Punaises de lit"],[/gu[êe]pe|frelon/,"Guêpes"]];

function analyser(t) {
  const s = t.toLowerCase();
  MOTS_ZONES.forEach(([r, v]) => { if (r.test(s)) cocher("zones", v); });
  MOTS_NUIS.forEach(([r, v]) => { if (r.test(s)) cocher("nuisibles", v); });
  const p = s.match(/(\d+|un|une|deux|trois|quatre|cinq|six|huit|dix|douze)\s+passages?/);
  if (p) document.getElementById("passages").value = isNaN(p[1]) ? NOMBRES[p[1]] : p[1];
  if (/(3|trois) ans/.test(s)) cocher("contrat", "3 ans");
  else if (/\b(1|un) an\b/.test(s)) cocher("contrat", "1 an");
  if (/\b(1|un) mois/.test(s)) cocher("contrat", "Ponctuel 1 mois");
  else if (/(2|deux) mois/.test(s)) cocher("contrat", "Ponctuel 2 mois");
  if (/infestation (forte|importante)/.test(s)) cocher("niveau", "Fort");
  else if (/infestation moyenne/.test(s)) cocher("niveau", "Moyen");
  else if (/infestation faible/.test(s)) cocher("niveau", "Faible");
  const tel = s.match(/0[1-9](?:[\s.]?\d{2}){4}/);
  if (tel && !val("tel")) document.getElementById("tel").value = tel[0];
  const prix = s.match(/(\d[\d\s]*)\s*(euros?|€)/);
  if (prix) document.getElementById("prix").value = prix[1].trim() + " €";
  sauver();
}

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null, ecoute = false;
function basculerMicro() {
  if (!SR) { alert("Dictée non disponible : ouvrez l'appli avec Google Chrome."); return; }
  ecoute ? arreter() : demarrer();
}
function demarrer() {
  rec = new SR();
  rec.lang = "fr-FR";
  rec.continuous = true;
  rec.interimResults = false;
  rec.onresult = e => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) {
        const t = e.results[i][0].transcript.trim();
        const z = document.getElementById("transcription");
        z.value += (z.value ? "\n" : "") + t;
        analyser(t);
      }
    }
  };
  rec.onerror = e => { if (e.error === "not-allowed") { alert("Autorisez le micro pour cette appli."); arreter(); } };
  rec.onend = () => { if (ecoute) try { rec.start(); } catch (_) {} };
  rec.start();
  ecoute = true;
  maj();
}
function arreter() { ecoute = false; if (rec) rec.stop(); maj(); }
function maj() {
  const b = document.getElementById("micro");
  b.textContent = ecoute ? "Pause micro" : "Démarrer micro";
  b.classList.toggle("actif", ecoute);
  document.getElementById("etat").textContent = ecoute ? "Écoute en cours..." : "Micro arrêté";
}

function recap() {
  const L = (t, v) => v ? `${t} : ${v}\n` : "";
  return "FICHE PROSPECT\n\nCLIENT\n" +
    L("Désignation", val("client")) + L("Secteur", val("secteur")) + L("Contact", val("contact")) +
    L("Téléphone", val("tel")) + L("Mail", val("mailContact")) +
    L("Adresse de facturation", val("factu")) + L("Adresse d'intervention", val("interv")) + L("Notes", val("notesClient")) +
    "\nDIAGNOSTIC\n" + L("Nuisibles", coches("nuisibles")) + L("Niveau d'infestation", coches("niveau")) +
    L("Indices", val("indices")) + L("Points d'entrée", val("entrees")) +
    "\nZONES CONTRACTUELLES\n" + L("Zones", coches("zones")) + L("Autres", val("zonesAutres")) +
    "\nPRÉCONISATION\n" + L("Passages par an", val("passages")) + L("Contrat", coches("contrat")) +
    L("Dispositifs", val("dispositifs")) + L("Prix proposé", val("prix")) + L("Réglementation", val("reglement")) +
    "\nACCÈS ET CONTRAINTES\n" + L("Accès", val("acces")) + L("Contraintes", val("contraintes")) + L("Concurrent", val("concurrent")) +
    "\nSUIVI\n" + L("Date de visite", val("dateVisite")) + L("Date de relance", val("dateRelance")) + L("Remarques", val("remarques")) +
    "\nTRANSCRIPTION\n" + val("transcription");
}

async function terminer() {
  arreter();
  const dest = val("monMail");
  const sujet = `Prospect - ${val("client") || "Sans nom"} - ${val("dateVisite")}`;
  if (URL_ENVOI) {
    try {
      await fetch(URL_ENVOI, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ sujet: sujet, corps: recap() })
      });
      alert("Fiche envoyée sur ta boîte mail.");
      return;
    } catch (e) {
      alert("Pas de réseau : ouverture de Gmail en secours.");
    }
  }
  if (!dest) { alert("Renseigne ton adresse mail dans Réglages."); return; }
  window.location.href = `mailto:${dest}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(recap())}`;
}
function nouvelle() {
  if (confirm("Effacer la fiche en cours ?")) { localStorage.removeItem(CLE); location.reload(); }
}

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
