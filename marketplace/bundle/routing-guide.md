# Routing guide

Generated from the bundle's route table and the skill catalog. `SKILL.md` has the short version; this file adds keywords and notes. Paths are relative to the bundle root.

## How to route

1. A named specialist wins.
2. A whole-site launch request goes to `launch-all`, which owns the {{LAUNCH_CHECKS}}-check model and chooses the specialists.
3. Otherwise match the user's words against the keywords below (substring, case-insensitive). Prefer the most specific route. If several routes match, load the first skill of each, remove duplicates, and keep the set small.
4. Load a route's later skills only when the first skill's method calls for them or the evidence shows a concern in their scope.
5. If nothing matches, choose from `references/skill-catalog.md` by "Use when", or ask one question.

Keywords are hints, not a classifier. Read the request.

## Routes

{{ROUTE_DETAILS}}

## Launch checks to skills

The authoritative owner of each of the {{LAUNCH_CHECKS}} launch checks is in `modules/core/launch-all/references/launch-model.md`; compliance domains are in `modules/core/compliance-all/references/compliance-domains.md`. The skills below list a check in their own metadata:

{{CHECK_INDEX}}
