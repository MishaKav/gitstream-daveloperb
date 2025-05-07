# -*- mode: yaml -*-
manifest:
  version: 1.0

automations:
  approve_tests:
    if:
      - {{ pr.title | includes(term="approve") }}
    run:
      - action: approve@v1
      - action: add-comment@v1
        args:
          comment: Approved PR by gitstream

  estimated_time_to_review:
    if:
      - true
    run:
      - action: add-label@v1
        args:
          label: '{{ calc.etr }} min review'
          color:
            {{ colors.red if (calc.etr >= 20) else ( colors.yellow if (calc.etr >= 5) else colors.green ) }}

calc:
  etr: {{ branch | estimatedReviewTime }}

colors:
  red: 'b60205'
  yellow: 'fbca04'
  green: '0e8a16'
