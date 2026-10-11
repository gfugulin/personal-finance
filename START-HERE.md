# Start Here

## Goal

Get a usable personal mobile app running quickly, safely and with minimal architecture.

## What you create manually

### Pluggy
1. Create a Pluggy account.
2. Create one Application.
3. Copy `CLIENT_ID` and `CLIENT_SECRET`.
4. Store them only as server environment variables.
5. Test the entire flow with Pluggy Sandbox first.
6. Do not connect Nubank real data before the production security gate passes.

Pluggy currently documents:
- API keys generated server-side from client credentials;
- API key validity of 2 hours;
- Connect Token validity of 30 minutes;
- transaction webhooks for create/update/delete.

### Supabase
1. Create one project.
2. Create the owner user.
3. Enable Auth.
4. Build TOTP MFA flow.
5. Disable public signup for production.
6. Run all SQL migrations in order.
7. Run the Supabase Security Advisor.

### Vercel
1. Create project from repository.
2. Add environment variables.
3. Deploy HTTPS.
4. Register the production Pluggy webhook URL only after deploy.

## Recommended implementation command to the agent

Read `PROMPT-ANTIGRAVITY.md` and execute it milestone by milestone.

## Absolute MVP scope

### Hoje
- bank cash;
- credit-card liability;
- free money;
- income this month;
- spending this month;
- invested this month;
- savings rate;
- net-worth trend;
- one monthly goal;
- tax summary.

### Movimentações
- imported Nubank transactions;
- search/filter;
- financial classification;
- fiscal classification;
- review queue;
- deterministic rules.

### Patrimônio
- cash;
- investments;
- card liability;
- net worth;
- allocation;
- net-worth history.

### IR
- taxable income;
- exempt/non-taxable income;
- exclusive/definitive taxation;
- tax withheld, when manually/provider supplied;
- deductible expenses tracked manually;
- pending tax classifications;
- year-end balances/investments;
- annual dossier/checklist;
- estimated IR planning based on versioned rules.

## Explicitly not MVP
- tax return submission;
- Receita Federal integration;
- payment initiation;
- Pix initiation;
- investment execution;
- tax optimization advice;
- native Android/iOS;
- multi-user;
- AI assistant.
