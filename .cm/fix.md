# -*- mode: yaml -*-
manifest:
  version: 1.0

automations:
  approve_and_merge_audit_fix_prs:
    if:
      - {{ branch.name | includes(term="audit/") }}
      - {{ pr.author | includes(term="EladKohavi") }}
    run:
      - action: approve@v1
      - action: add-label@v1
        args:
          label: 'approved-audit-fix'
          color: '{{ colors.green }}'
      - action: merge@v1

  approve_and_merge_dependabot_prs:
    if:
      - {{ branch.name | includes(term="dependabot") }}
      - {{ pr.author | includes(term="dependabot") }}
    run:
      - action: approve@v1
      - action: add-label@v1
        args:
          label: 'approved-dependabot'
          color: '{{ colors.green }}'
      - action: merge@v1

colors:
  green: '36A853'
