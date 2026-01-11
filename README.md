# UMoney

A personal finance and money management application that helps users track budgets, transactions, categories, and wallets, with clear visualizations of financial data through charts and graphs.

## About

The app is built with the T3 stack and uses [Turborepo](https://turborepo.org/) to manage the monorepo and provides a type-safe environment from the database to the frontend.

### Tech Stack

- [Next.js 13](https://nextjs.org)
- [tRPC](https://trpc.io)
- [Prisma](https://www.prisma.io/orm)
- [NextAuth.js](https://next-auth.js.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Turborepo](https://turborepo.org)

## Repository Structure

```
.github
  └─ workflows
        └─ CI with pnpm cache setup
.vscode
  └─ Recommended extensions and settings for VSCode users
app
  ├─ Next.js 13
  ├─ React 18
  ├─ TailwindCSS
  └─ E2E Typesafe API Server & Client
packages
  ├─ api
  |   └─ tRPC v10 router definition
  ├─ auth
  |   └─ authentication using next-auth.
  └─ db
  |   └─ typesafe db-calls using Prisma
  └─ config
      └─ Shared Tailwind and PostCSS configurations
```

## Quick Start

To get the project running locally, follow these steps:

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Copy the `.env.example` file to `.env` and fill in the required values:

```bash
cp .env.example .env
```

Key variables:

- `DATABASE_URL`: Your PostgreSQL connection string.
- `NEXTAUTH_SECRET`: A secret for NextAuth.js (generate with `openssl rand -base64 32`).
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: For Google authentication.

### 3. Initialize the Database

```bash
pnpm db:push
```

### 4. Start the Development Server

```bash
pnpm dev
```

## Deployment

### Docker

This repository includes a `Dockerfile` for containerized deployment. It uses Next.js [standalone output](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output) to minimize image size.

#### Build the Image

```bash
docker build -t mm-t3 .
```

#### Run the Container

```bash
docker run -p 3000:3000 --env-file .env mm-t3
```

The application will be available at `http://localhost:3000`.

## References

This project was bootstrapped using [create-t3-turbo](https://github.com/t3-oss/create-t3-turbo).
