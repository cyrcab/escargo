> Copie du design system Escargo (artifact claude.ai `https://claude.ai/artifact/YPcmofnZTa4NKdgpEvfzrN`). Ne pas éditer ici : modifier l'artifact puis lancer `/sync-design`.

# Escargo

Escargo — zen à quai. L'appli mobile qui compte le temps perdu à cause des retards de train sur une année, et en fait un jeu : titres, badges, classements et bilan annuel à partager.

Ce document est la référence de marque et le brief produit pour toutes les maquettes. Lis-le en entier avant de dessiner un écran.

## Le produit en bref

- **Pour qui** : les voyageurs réguliers en train, partout en France (TER, Intercités, TGV, Transilien, RER).
- **Promesse** : transformer la frustration du retard en quelque chose de drôle et de collectionnable. On rit de la situation, jamais des agents ni de la SNCF.
- **Fonctionnement** : l'appli détecte l'arrivée en gare, propose le train, l'utilisateur confirme d'un tap, le retard est calculé et vérifié avec le temps réel. Le cumul annuel fait progresser de titre en titre.
- **Plateformes** : iOS et Android (React Native / Expo). Maquettes en 390 × 844 (iPhone), sans fausse barre d'état.

## Ton et voix

Complice, léger, un peu fataliste, jamais aigri. On tutoie. Phrases courtes. L'humour vient des équivalences et des titres, pas de moqueries.

| Situation | À écrire | À éviter |
| --- | --- | --- |
| Compteur | « Soit 7 films entiers vus sur le quai. » | « Vous avez perdu 14 h à cause de la SNCF. » |
| Nouveau retard | « +12 min. Respire, tu progresses. » | « Encore un retard inadmissible ! » |
| Titre débloqué | « Nouveau titre : Patient confirmé. » | « Félicitations, vous avez atteint le niveau 3. » |
| Train supprimé | « Train fantôme. Badge rare débloqué. » | « Votre train a été annulé. » |
| Permission localisation | « On repère ta gare pour te proposer ton train. Ta position ne quitte jamais ton téléphone. » | Texte juridique long |

Les titres et badges jouent sur la pop culture par allusion et jeu de mots (« Le Seigneur des Retards », « Retour vers le quai »), jamais avec un logo, une image ou un personnage protégé.

## Fondations visuelles

**Esprit : pop énergique.** Fond crème chaud, un seul accent orange vif, texte bleu nuit. Formes rondes, aplats francs, beaucoup d'air. Surtout pas l'univers des gares : pas de jaune d'affichage, pas de police d'afficheur, pas de tableau de départs. L'appli doit permettre de s'en détacher.

### Couleurs

- `cream` en fond de chaque écran, `surface` (blanc) pour les cartes posées dessus.
- `orange` est la signature : la carte compteur, le bouton principal, l'icône. **Un seul grand aplat orange par écran.** Texte sur orange : toujours `ink`, jamais blanc (contraste insuffisant).
- `orange-strong` pour la valeur du retard (« +12 min », 24px et plus), l'onglet actif et les liens. Pas pour du petit texte.
- `ink` pour le texte et les éléments forts ; `ink-muted` et `ink-soft` pour le secondaire.
- Rareté des titres et badges : commun = `mint`, rare = `violet`, légendaire = `gold`. Chaque rareté a un fond clair (`-tint`) et une couleur de texte (`-ink`). Ces couleurs ne servent qu'aux badges, titres et illustrations de la mascotte.

### Typographie

Une seule famille : **Bricolage Grotesque** (Google Fonts, poids 400, 600, 800). Le compteur utilise le style `counter` (76px, 800, interlettrage serré −0.04em) avec ses unités en `counter-unit`. Titres en 800, texte courant en 400, libellés en 600.

### Mise en page

- Marges latérales `space-5` (20px), écart entre cartes `space-4` (16px).
- Cartes `surface` arrondies `radius-lg` ; la carte compteur `radius-xl`.
- Aucune ombre, aucun dégradé. Les cartes se détachent du fond crème par leur blanc.
- Cibles tactiles de 44px minimum. Texte à 4.5:1 de contraste au moins.
- Barre d'onglets en bas, blanche, bordure haute `line` : Accueil, Trajets, Classements, Badges. Icônes au trait, épaisseur 2.

### Icônes

Icônes au trait arrondi (style Lucide), 24px, épaisseur 2, couleur `ink-soft`, ou `orange-strong` pour l'onglet actif. Jamais d'emoji.

## Mouvement et animation

L'appli doit être agréable et fun à utiliser : l'animation fait partie de l'identité, au même titre que l'orange et la mascotte. Chaque écran maquetté indique ses animations, et les moments clés sont prototypés de façon interactive quand c'est possible.

**Principes**

- **Vivant mais rapide** : micro-interactions de 150 à 250 ms, transitions d'écran de 300 à 450 ms. Seules les célébrations durent plus (jusqu'à 2 s), et on peut toujours les passer d'un tap.
- **Ressort plutôt que linéaire** : mouvements avec un léger rebond, comme un objet souple. Jamais de rebond sur du texte à lire.
- **Chaque animation dit quelque chose** : une progression, un gain, un changement d'état. Pas d'animation décorative en boucle sur les écrans de lecture.
- **Retour haptique** : léger à chaque confirmation, vibration de succès quand un titre ou un badge se débloque.
- **Accessibilité** : si l'utilisateur a activé « Réduire les animations », on remplace tout par de simples fondus.

**Moments clés**

| Moment | Animation |
| --- | --- |
| Compteur annuel | Les chiffres roulent comme un compteur kilométrique quand un retard s'ajoute ; la carte orange fait un petit rebond. |
| Barre de progression du titre | Se remplit en glissant à l'ouverture de l'accueil. |
| Mascotte au repos | Cligne de l'œil, soulève sa casquette de temps en temps ; s'endort le soir. |
| Arrivée en gare | La feuille du bas monte avec un ressort, la mascotte salue en levant sa casquette. |
| Trajet en cours | Le retard pulse doucement quand il augmente ; la mascotte change d'humeur selon le retard (pressé, sous la pluie). |
| Titre ou badge débloqué | Plein écran : le badge tombe et rebondit, confettis aux couleurs de la rareté (`mint`, `violet`, `gold`), reflet brillant en plus pour le légendaire. |
| Chargement | La spirale de la coquille tourne à la place d'un indicateur classique. |
| Tirer pour actualiser | L'escargot rampe le long du haut de la liste. |
| Navigation | La carte trajet s'agrandit en écran de détail ; l'icône de l'onglet choisi fait un petit rebond. |
| Bilan annuel | Stories animées : chiffres qui défilent, mascotte qui réagit à chaque écran. |

**Pour le développement** : React Native Reanimated pour les transitions et les chiffres, Rive (ou Lottie) pour les animations de la mascotte, Expo Haptics pour les vibrations.

## La mascotte : le chef de gare

Un escargot à casquette de chef de gare. C'est le logo, l'icône d'appli et le personnage qui illustre titres, badges et états vides.

- Corps `orange` plein, coquille `cream` cerclée de `ink`, spirale de trois tours, casquette `ink` à visière plate, un œil rond. Il regarde vers la droite.
- Traits épais et arrondis, aplats, aucune ombre ni dégradé.
- Petite taille : on simplifie la spirale, puis on la retire. La casquette reste toujours.
- Déclinaisons existantes : **Endormi** (retards du matin), **Pressé** (correspondance ratée), **Sous la pluie** (lundi maudit), **Victoire** (titre débloqué), **Légendaire** (coquille `gold`), **Fantôme** (train supprimé, corps `violet` translucide).
- Fichiers dans le groupe Logos : la mascotte et l'icône d'appli 1024 px.
- Sur l'icône d'appli : fond `orange`, escargot `cream`, casquette `ink`.

## Composants

| Composant | Description |
| --- | --- |
| Carte compteur | Aplat `orange`, `radius-xl`. Libellé « Perdu en 2026 », compteur heures + minutes, une équivalence fun en dessous. |
| Carte titre | `surface`. Titre actuel en `title`, pastille de rareté, barre de progression (`sand` / `ink`), texte « Encore X avant… ». |
| Carte trajet | `surface`. Date, mention « Vérifié » (`mint-ink` + coche) ou « Non vérifié » (`ink-soft`), gares départ → arrivée, ligne, retard en `delay` `orange-strong`. |
| Tuile badge | Fond `-tint` de sa rareté, `radius-md`, nom en 800, rareté en dessous en `-ink`. Illustration de la mascotte si place. |
| Pastille de rareté | `radius-pill`, fond `-tint`, texte `label` en `-ink`. |
| Bouton principal | `orange`, texte `ink` 600, `radius-pill`, 52px de haut. |
| Bouton secondaire | `ink`, texte `cream`, ou contour `ink` sur fond transparent. |
| Barre d'onglets | 4 onglets, icône + libellé `tab`. |
| Live Activity / Dynamic Island | Fond `ink`, retard en direct en `orange`, mascotte réduite à gauche. |

## Écrans à maquetter

Pour chaque écran, indique ses animations (voir Mouvement et animation) et prototype de façon interactive les moments clés : arrivée en gare, fin de trajet, titre débloqué.

1. **Onboarding (3 écrans)** : le concept avec la mascotte ; la promesse vie privée ; connexion Apple ou Google.
2. **Permissions** : localisation expliquée simplement, avec un choix « Plus tard » qui mène au mode manuel.
3. **Accueil** : carte compteur, carte titre, dernier trajet, derniers badges, barre d'onglets. (Une première version existe.)
4. **Arrivée en gare** : feuille du bas « Tu prends le TER [numéro] vers [destination] ? » avec Oui / Autre train.
5. **Choix du train** : liste des prochains départs de la gare, avec heure prévue et retard annoncé.
6. **Trajet en cours** : retard en direct, gare suivante, mascotte selon l'état, plus la Live Activity et la Dynamic Island.
7. **Fin de trajet** : retard final, minutes ajoutées au compteur, badge ou titre débloqué en plein écran (mascotte Victoire).
8. **Trajets (historique)** : liste par mois, statistiques simples (pire retard, ligne la plus pénible, jour le plus touché).
9. **Classements** : par ligne et national, onglets ; rang de l'utilisateur mis en avant ; pseudos uniquement, jamais les gares.
10. **Badges et titres** : la collection, filtrable par rareté, avec les titres verrouillés en silhouette.
11. **Détail d'un titre** : illustration, rareté, comment il a été obtenu, bouton Partager.
12. **Bilan annuel** : 5 à 6 écrans au format story 9:16 (total, pire trajet, titre de l'année, rang sur sa ligne), exportables pour Instagram.
13. **Profil et réglages** : pseudo, avatar, lignes favorites, autorisations, consentement pub, export et suppression du compte.
14. **États vides et erreurs** : pas encore de trajet, pas de réseau, retard non vérifiable.

## Gamification : les données à afficher

**Paliers de titres** (cumul annuel, seuils provisoires) : Voyageur serein (0 à 1 h) · Habitué du quai (1 à 5 h) · Patient confirmé (5 à 15 h) · Martyr du rail (15 à 30 h) · Légende du quai (30 à 60 h) · Fantôme des quais (plus de 60 h).

**Catalogue** : 500 à 600 titres au lancement, débloqués par situation (ligne, horaire, météo, type de train, record, série), avec rareté commun, rare ou légendaire.

**Badges de lancement** : Baptême (premier retard vérifié) · Grande traversée (plus d'une heure) · Série noire (5 jours de suite) · Lundi maudit (4 lundis dans le mois) · Train fantôme (train supprimé) · Lève-tôt (train avant 6 h).

**Pub** : une bannière discrète possible en bas de l'historique et des classements, jamais sur le trajet en cours ni sur l'accueil.

## Données d'exemple

Utilise ces valeurs pour que les maquettes restent cohérentes : utilisateur « Cyril », ligne TER Aubiet → Saint-Martin-du-Touch via Colomiers, cumul 14 h 32 min en 2026, titre Patient confirmé (rare), dernier retard +12 min vérifié. Tout autre chiffre manquant : un texte entre crochets, par exemple [RANG].

## À ne jamais faire

- Logo, nom, couleurs ou visuels de la SNCF, d'IDFM ou de tout opérateur.
- Esthétique de gare : tableau d'affichage, jaune signalétique, police d'afficheur.
- Ombres portées, dégradés, emoji, blanc sur orange.
- Gares de départ et d'arrivée d'un autre utilisateur visibles (vie privée).
