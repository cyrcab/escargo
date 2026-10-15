# Infra

- `docker-compose.yml` : Postgres 17 + Redis 8 pour le dev local (`pnpm infra:up`).
- `docker-compose.prod.yml` : la prod complète sur un VPS (ADR 0004) : Caddy, API, worker, Postgres, Redis, sauvegarde.
- `Dockerfile.node` : image de prod commune à `api` et `worker`, bundlée par `esbuild.mjs`.
- `Caddyfile` : reverse proxy de l'API, TLS automatique.

Contrainte RGPD : serveurs dans l'UE uniquement.

## Préparer le serveur (une fois)

VPS OVHcloud VPS-1, Debian 13, datacenter en France. En root :

```bash
# Utilisateur de déploiement, connexion par clé SSH seulement
adduser --disabled-password escargo && usermod -aG sudo escargo
mkdir -p /home/escargo/.ssh && cp ~/.ssh/authorized_keys /home/escargo/.ssh/
chown -R escargo:escargo /home/escargo/.ssh
sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication no/; s/^#\?PermitRootLogin .*/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart ssh

# Pare-feu : SSH, HTTP, HTTPS
apt update && apt install -y ufw unattended-upgrades git
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443 && ufw --force enable
dpkg-reconfigure -f noninteractive unattended-upgrades

# Docker (dépôt officiel)
curl -fsSL https://get.docker.com | sh
usermod -aG docker escargo
mkdir -p /var/backups/escargo && chmod 700 /var/backups/escargo
```

Docker publie les ports de Caddy en contournant `ufw` : seuls 80 et 443 sont publiés dans le compose, Postgres et Redis ne le sont pas.

## Configuration

En tant que `escargo` : `git clone` du repo, puis créer `.env.prod` à la racine (gitignoré, `chmod 600`) :

```bash
POSTGRES_PASSWORD=          # long et aléatoire : openssl rand -hex 32
API_DOMAIN=                 # ex. api.mondomaine.fr ; vide = HTTP seul sur :80 (tests)
SNCF_GTFS_URL=https://eu.ftp.opendatasoft.com/sncf/plandata/Export_OpenData_SNCF_GTFS_NewTripId.zip
SNCF_GTFS_RT_URL=https://proxy.transport.data.gouv.fr/resource/sncf-gtfs-rt-trip-updates
PRIM_API_KEY=               # facultatif : temps réel RER et Transilien
```

Avec un domaine : un enregistrement DNS A vers l'IP du VPS avant le premier démarrage, Caddy obtient le certificat seul.

## Déployer

```bash
git pull
docker compose -f infra/docker-compose.prod.yml --env-file .env.prod up -d --build
```

Le service `migrate` applique les migrations avant que l'API et le worker démarrent. Le premier import GTFS SNCF part au démarrage du worker.

```bash
# État et logs
docker compose -f infra/docker-compose.prod.yml --env-file .env.prod ps
docker compose -f infra/docker-compose.prod.yml --env-file .env.prod logs -f worker
# Import GTFS manuel
docker compose -f infra/docker-compose.prod.yml --env-file .env.prod exec worker node dist/gtfs-import.cli.js idfm
```

## Sauvegardes

Le service `backup` fait un `pg_dump` par jour dans `/var/backups/escargo` (lisible par root seul) et garde 7 jours : un compte supprimé disparaît des sauvegardes sous 8 jours, à indiquer dans la politique de confidentialité. Restaurer :

```bash
sudo cat /var/backups/escargo/escargo-AAAA-MM-JJ.dump \
  | docker compose -f infra/docker-compose.prod.yml --env-file .env.prod exec -T postgres \
    pg_restore -U escargo -d escargo --clean --if-exists
```

À faire avant l'ouverture aux utilisateurs : copie des sauvegardes hors du VPS, chiffrée (`age`, clé privée hors VPS), dans un stockage objet UE avec la même purge.

## Vie privée

- Aucun journal d'accès côté Caddy ; l'API journalise méthode, chemin et statut, sans IP ni query string.
- Logs Docker plafonnés à 3 × 10 Mo par service.
- Tiers : Let's Encrypt (certificat, nom de domaine seulement). Prendre registrar et DNS dans l'UE.
