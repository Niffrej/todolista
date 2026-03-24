# Deploy no Fly.io (NestJS + PostgreSQL)

O backend usa **PostgreSQL**. Em desenvolvimento local você pode usar `docker compose` (Postgres + API) ou Postgres instalado na máquina.

## 1. Pré-requisitos

- Conta em [fly.io](https://fly.io)
- CLI: `powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"` (Windows) ou veja a [documentação oficial](https://fly.io/docs/hands-on/install-flyctl/)
- Login: `fly auth login`

## 2. Banco Postgres na Fly

Crie um cluster Postgres (substitua `roadmap-db` pelo nome que quiser):

```bash
fly postgres create --name roadmap-db --region gru --initial-cluster-size 1 --vm-size shared-cpu-1x --volume-size 3
```

Anote a URL de conexão ou crie o app da API e depois anexe o banco:

```bash
fly postgres attach --app roadmap-api roadmap-db
```

Isso define o secret **`DATABASE_URL`** no app `roadmap-api` automaticamente.

## 3. App da API na Fly

No diretório `backend/`:

1. Ajuste o nome do app em `fly.toml` (`app = "..."`) ou crie um app novo:

   ```bash
   fly launch --no-deploy
   ```

   Use o `Dockerfile` existente quando o assistente perguntar.

2. Defina secrets (obrigatório em produção):

   ```bash
   fly secrets set JWT_SECRET="uma-string-longa-e-aleatoria"
   ```

3. **Primeira carga do schema** (sem migrations ainda): habilite sync uma vez:

   ```bash
   fly secrets set TYPEORM_SYNCHRONIZE=true
   fly deploy
   ```

   Depois que as tabelas existirem, desligue o sync e volte a publicar:

   ```bash
   fly secrets unset TYPEORM_SYNCHRONIZE
   fly deploy
   ```

   Em produção estável, o ideal é usar migrations do TypeORM e manter `TYPEORM_SYNCHRONIZE` desligado.

4. Se o Postgres for **externo** (não Fly) e exigir SSL:

   ```bash
   fly secrets set DATABASE_SSL=true
   ```

## 4. Docker local (API + Postgres)

```bash
docker compose up --build
```

A API fica em `http://localhost:3000`. Variáveis equivalentes ao `.env` estão no `docker-compose.yml`.

## 5. Frontend

No deploy do Next.js, defina:

```env
NEXT_PUBLIC_API_URL=https://roadmap-api.fly.dev
```

(Use a URL real do seu app Fly.)

## 6. Comandos úteis

| Ação              | Comando              |
|-------------------|----------------------|
| Deploy            | `fly deploy`         |
| Logs              | `fly logs`           |
| SSH no container  | `fly ssh console`    |
| Listar secrets    | `fly secrets list`   |

## Arquivos deste repositório

| Arquivo            | Função                                      |
|--------------------|---------------------------------------------|
| `Dockerfile`       | Imagem de produção Node 22 + `dist/main.js` |
| `docker-compose.yml` | Postgres 16 + API para desenvolvimento   |
| `fly.toml`         | Configuração de app, região, HTTP, VM      |
| `.dockerignore`    | Reduz contexto de build                     |
