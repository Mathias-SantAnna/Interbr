#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# InterBR — Day 1 Setup Script
# Run this from inside the /backend directory:
#   chmod +x setup_day1.sh && ./setup_day1.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e  # exit on any error

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

step() { echo -e "\n${GREEN}▶ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
done_msg() { echo -e "\n${GREEN}✓ $1${NC}"; }

# ── 1. Python virtual environment ─────────────────────────────────────────────
step "Creating Python virtual environment..."
python3 -m venv .venv
source .venv/bin/activate
done_msg "Virtual environment created and activated"

# ── 2. Install dependencies ────────────────────────────────────────────────────
step "Installing Python dependencies (this takes ~60 seconds)..."
pip install --upgrade pip -q
# Install without WeasyPrint first (has heavy system deps, add later if needed)
pip install \
  Django==5.0.6 \
  djangorestframework==3.15.2 \
  django-cors-headers==4.4.0 \
  djangorestframework-simplejwt==5.3.1 \
  psycopg2-binary==2.9.9 \
  dj-database-url==2.2.0 \
  celery==5.4.0 \
  redis==5.0.8 \
  django-celery-beat==2.6.0 \
  django-jazzmin==3.0.0 \
  django-filter==24.3 \
  python-decouple==3.8 \
  Pillow==10.4.0 \
  requests==2.32.3 \
  gunicorn==22.0.0 \
  whitenoise==6.7.0 \
  -q
done_msg "Dependencies installed"

# ── 3. Environment file ────────────────────────────────────────────────────────
step "Setting up environment file..."
if [ ! -f ".env" ]; then
  cp .env.example .env
  done_msg ".env created from .env.example"
  warn "Edit .env with your actual API keys before running."
else
  warn ".env already exists — skipping."
fi

# ── 4. Start Postgres + Redis via Docker Compose ───────────────────────────────
step "Starting PostgreSQL and Redis with Docker Compose..."
if command -v docker &> /dev/null; then
  cd ..
  docker compose up -d postgres redis
  cd backend
  echo "Waiting for Postgres to be ready..."
  sleep 4
  done_msg "Postgres and Redis are running"
else
  warn "Docker not found. Start Postgres and Redis manually:"
  warn "  Postgres: localhost:5432 db=interbr user=interbr pass=interbr"
  warn "  Redis:    localhost:6379"
fi

# ── 5. Django migrations ───────────────────────────────────────────────────────
step "Running Django migrations..."
python manage.py migrate --settings=config.settings.local
done_msg "Migrations complete"

# ── 6. Load seed data ──────────────────────────────────────────────────────────
step "Loading 50-product seed data..."
python manage.py loaddata fixtures/seed.json --settings=config.settings.local
done_msg "Seed data loaded"

# ── 7. Create superuser ────────────────────────────────────────────────────────
step "Creating demo superuser..."
python manage.py create_superuser_demo --settings=config.settings.local
done_msg "Superuser created: admin@interbrasil.com.br / admin123"

# ── 8. Assign demo clients to salesmen ────────────────────────────────────────
step "Assigning demo clients to salesman accounts..."
python manage.py assign_demo_clients --settings=config.settings.local
done_msg "Demo clients assigned"

# ── 9. Build search index ──────────────────────────────────────────────────────
step "Building PostgreSQL full-text search index..."
python manage.py rebuild_search_index --settings=config.settings.local
done_msg "Search index built"

# ── 10. Collect static files ───────────────────────────────────────────────────
step "Collecting static files..."
python manage.py collectstatic --noinput --settings=config.settings.local -q
done_msg "Static files collected"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  InterBR backend — Day 1 setup complete!       ${NC}"
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo ""
echo "  Start the dev server:"
echo "    source .venv/bin/activate"
echo "    python manage.py runserver --settings=config.settings.local"
echo ""
echo "  Admin panel:  http://localhost:8000/admin/"
echo "    Login:      admin@interbrasil.com.br / admin123"
echo ""
echo "  API root:     http://localhost:8000/api/v1/"
echo ""
echo "  Test the products API:"
echo "    curl http://localhost:8000/api/v1/catalog/products/"
echo ""
echo "  Demo accounts:"
echo "    Admin:    admin@interbrasil.com.br  / admin123"
echo "    Salesman: carlos@interbrasil.com.br / carlos123"
echo "    Salesman: ana@interbrasil.com.br    / ana123"
echo "    Client:   compras@madeirasp.com.br  / joao123"
echo ""
