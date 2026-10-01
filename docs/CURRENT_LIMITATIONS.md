# Current integration limitations

- The MCP surface includes 17 stateless public campus-intelligence tools (10 canonical multi-university tools supporting discovery, building search, places, routing, and gap planning across 14 universities, plus 7 deprecated UTM compatibility aliases) alongside the permissioned private student-context tools. Public tools do not authenticate a Gapwise account and must not be treated as access to a student's private timetable, friends, location, or sync state.
- MCP write actions are applied by Gapwise through the queued-action channel; they do not remotely rewrite the primary encrypted private payload.
- Broad ChatGPT/Claude support is still a release-validation target rather than a universal support claim. Real OAuth/read/write/revoke behavior depends on the current client/product capabilities and must pass the repository's compatibility matrix before a client is represented as supported.
