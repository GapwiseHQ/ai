# OpenAI app submission checklist

This document is the OpenAI-specific release gate for the production Gapwise MCP service. Use `DIRECTORY_METADATA.md`, `REVIEWER_GUIDE.md`, `OPENAI_TEST_CASES.md`, and `SUBMISSION_CHECKLIST.md` as the canonical listing/reviewer package.

## Production identity

- MCP URL: `https://ai.gapwise.ca/api/mcp`
- Protected-resource metadata: `https://ai.gapwise.ca/.well-known/oauth-protected-resource`
- OAuth authorization server: the Gapwise Supabase Auth project discovered from protected-resource metadata
- Domain challenge: `https://ai.gapwise.ca/.well-known/openai-apps-challenge`
- Public product site: `https://gapwise.ca`
- AI product page: `https://gapwise.ca/ai`
- Privacy: `https://gapwise.ca/privacy`
- Terms: `https://gapwise.ca/terms`
- Support: `https://gapwise.ca/support`

The infrastructure alias `https://gapwise-ai.vercel.app` is not a second OAuth resource. Production metadata canonicalizes both hostnames to `https://ai.gapwise.ca/api/mcp`.

## Domain verification

When OpenAI supplies a domain-verification token, set it only in production as `GAPWISE_OPENAI_APPS_CHALLENGE_TOKEN`. The challenge route must return the token as the entire response body, with no JSON wrapper or extra text. Do not invent a token before the submission flow provides one.

## Tool review assertions

The current release surface contains **30 tools**:

- **17 public stateless campus-intelligence tools** with no private OAuth security declaration and `openWorldHint: true` (10 canonical multi-university tools and 7 deprecated UTM compatibility aliases);
- **12 OAuth-protected private read/status/planning tools**; and
- **1 OAuth-protected bounded write tool**, `update_gap_preferences`.

For private tools, Gapwise:

- advertises OAuth through the compatibility metadata/root projection required by the client;
- requests only the supported `email` identity scope;
- derives the Gapwise user exclusively from the verified bearer token;
- rejects ordinary browser-session tokens because they lack an OAuth `client_id` and MCP audience;
- rejects OAuth bearer tokens whose `aud` does not contain exactly `https://ai.gapwise.ca/api/mcp`;
- rejects tokens missing the required granted scope; and
- returns an in-band `_meta["mcp/www_authenticate"]` challenge when private execution lacks a valid caller.

Public tools do not inherit those OAuth declarations and never access private Gapwise state. All tools declare input/output schemas and bounded capability descriptions. The sole private write requires the current snapshot revision and explicit gap-preference write permission. Academic course meetings cannot be mutated through the MCP surface. Personal Items are retired and are not part of the current tool surface.

## Positive reviewer test cases

Use the five canonical positive tests in `OPENAI_TEST_CASES.md`:

1. public building resolution;
2. public campus route;
3. read a student's day;
4. find a realistic study opportunity; and
5. queue a safe gap-preference update.

## Negative reviewer test cases

Use the three canonical negative tests in `OPENAI_TEST_CASES.md`:

1. academic mutation refusal;
2. cross-account/privacy boundary; and
3. revoked or unapproved private access.

## Release checks before submission or resubmission

1. `npm run check` and CI pass on the exact production commit.
2. Supabase OAuth Server and Gapwise `/oauth/consent` are active with the intended MCP client-registration flow.
3. Approved OAuth tokens contain the exact MCP audience; browser/unapproved/wrong-audience tokens do not.
4. Production protected-resource metadata identifies `https://ai.gapwise.ca/api/mcp` and the supported `email` scope.
5. MCP initialization and `tools/list` expose all 30 tools with 17 public tools lacking OAuth declarations and 13 private tools carrying them.
6. Public tools advertise `openWorldHint: true`; bounded private-account tools remain `openWorldHint: false`.
7. The production OpenAI domain challenge is configured only if/when the current submission portal supplies a token.
8. The real ChatGPT OAuth/read/write/revoke and negative-path matrix in `CLIENT_VALIDATION.md` passes against the exact release SHA.
9. The synthetic reviewer account is reset to `TEST_ACCOUNT_SPEC.md`; the submitted login/password works without submitter-dependent MFA, SMS, email confirmation, or private-network access.
10. The submission contains at least five positive and three negative reviewer-runnable test cases from `OPENAI_TEST_CASES.md`.
11. After any MCP tool-description/schema/annotation change, deploy the release and run **Scan Tools** again before final submission/resubmission.
12. Listing metadata, legal/support URLs, country availability, branding, and reviewer prompts are populated from the canonical release docs.
13. Do not claim OpenAI endorsement; describe directory availability factually after approval.

## Release notes template

> Gapwise provides a remote MCP integration that combines stateless campus intelligence across supported universities with explicitly delegated private timetable/planning context. Connected users can ask about schedules, availability, routes, campus places, and Gapwise gap assessments and may queue a bounded gap-preference update when that permission is enabled. Academic course meetings remain source-backed and read-only. Personal Items are retired. Private OAuth credentials are user-scoped, resource-bound, and protected by Gapwise's approval, RLS, ownership, encryption, and revocation boundaries.
