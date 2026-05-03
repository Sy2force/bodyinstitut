# Variables d'environnement Vercel

Copie-colle ces variables dans ton projet Vercel :

## Configuration Vercel

### Onglet **Environment Variables** dans le dashboard Vercel :

| Variable | Valeur | Type |
|----------|--------|------|
| `DATABASE_URL` | `postgresql://user:password@host:5432/dbname?sslmode=require` | Encrypted |
| `ADMIN_USERNAME` | `shayacoca20@gmail.com` | Plaintext |
| `ADMIN_PASSWORD` | `Qwerty21` | Encrypted |
| `AUTH_SECRET` | `votre-secret-long-aleatoire-minimum-32-caracteres` | Encrypted |
| `SMTP_HOST` | `smtp.gmail.com` | Plaintext |
| `SMTP_PORT` | `587` | Plaintext |
| `SMTP_USER` | `votre-email@gmail.com` | Plaintext |
| `SMTP_PASS` | `votre-mot-de-passe-app` | Encrypted |
| `SMTP_FROM` | `Body Institut <contact@bodyinstitut.fr>` | Plaintext |
| `NEXT_PUBLIC_BOOKING_URL` | `https://www.bodyinstitut.fr/institut-minceur-soins-corps-paris` | Plaintext |

---

## Configuration PostgreSQL

### Option A : Vercel Postgres (recommandé)

1. Dashboard Vercel → **Storage** → **Create** → **Postgres**
2. Connecte au projet
3. La variable `POSTGRES_URL` est auto-générée
4. Copie-la dans `DATABASE_URL`

### Option B : Supabase (gratuit)

1. [supabase.com](https://supabase.com) → **New Project**
2. Settings → Database → Connection string → URI
3. Copie dans `DATABASE_URL`

### Option C : Neon (gratuit)

1. [neon.tech](https://neon.tech) → **New Project**
2. Connection Details → Copy connection string
3. Copie dans `DATABASE_URL`

---

## Auth Secret

Génère un secret sécurisé avec cette commande :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ou utilise : `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

---

## SMTP Gmail (optionnel - pour les emails)

Si tu utilises Gmail :
1. Compte Google → **Sécurité** → **Mots de passe d'application**
2. Génère un mot de passe d'app
3. Utilise ce mot de passe dans `SMTP_PASS`
