# Confidence Evaluation Criteria

## Overview

Before resolving any SUS task, evaluate three dimensions. Each dimension is scored as HIGH or LOW confidence. If ANY dimension is LOW, do not attempt resolution — notify the user instead.

## Dimension 1: Repo Identification

### HIGH Confidence
- Explicit product tag in title: `[DOTNET]`, `[B2B]`, `[FV]`, `[CRM]`, `[ETL]`
- Description clearly mentions a specific product by name
- Version strings (ISF, IGS) clearly identify the product
- Task mentions specific screens/features uniquely belonging to one product
- A learned pattern from `sus-lessons.md` matches

### LOW Confidence
- No product indicators in title or description
- Multiple products could match (e.g., "pedido" could be FV or B2B)
- Description is too vague to identify any product
- Conflicting signals (title suggests one product, description suggests another)
- Task mentions "integracao" without specifying which system

## Dimension 2: Bug Clarity

### HIGH Confidence
- Specific error message or stack trace provided
- Clear steps to reproduce described
- Expected vs actual behavior explained
- Screenshots show the exact problem
- Login/credentials provided for testing
- Specific entity IDs, table names, or endpoints mentioned

### LOW Confidence
- Description is just "nao funciona" or "deu erro" without details
- No reproduction steps
- Contradictory information in the description
- Problem is described in terms of business impact only, not technical symptoms
- Multiple unrelated issues mixed in one task
- Description is copy-pasted template with no actual content filled in

## Dimension 3: Actionability

### HIGH Confidence
- Bug is clearly a code-level issue (logic error, UI bug, query problem)
- Fix is within the scope of the identified repo
- Similar bugs have been fixed before (pattern in `sus-lessons.md`)
- The issue is reproducible through code analysis

### LOW Confidence
- Issue seems to be infrastructure (server down, memory, network)
- Requires database changes (schema, data migration, manual data fix)
- Needs access to client environment or specific configuration
- Depends on external service or third-party API
- Issue is performance-related and requires profiling with production data
- Task requires coordinating changes across more than 3 repos

## Notification Format

When notifying for low confidence, always include:

1. **Task key and title** — so the user knows which task
2. **What was understood** — partial analysis that was done
3. **Specific gap** — exactly what information is missing
4. **Suggested action** — what the user should provide or decide

Example:
```
SUS-6279: "Filtro de Itens Promocionais nao consta funcionando"
Understood: Bug in promotional items filter. Client uses ISF 2026.8.3881 (Forca de Vendas).
Gap: Could be in pedidos (mobile filter) or geovendas-vaadin6 (web filter). Cannot determine from description.
Action needed: Which app is the filter broken in — mobile (pedidos) or web (vaadin6)?
```

## Learning Updates

After the user resolves the ambiguity, save the pattern:

```markdown
## Repo Identification Patterns
- "Filtro de itens promocionais" / "catalogo de produtos" + ISF version → geovendas-vaadin6 (web catalogo feature)
```

This prevents the same question from being asked again.
