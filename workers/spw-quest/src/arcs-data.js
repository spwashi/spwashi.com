// Written by workers/spw-quest/carry-arcs.mjs from the site's history; do not edit by hand.
// Refresh it by running the carry; the page in assets/arcs/ is rendered from it (src/arcs.js).
export const ARCS = Object.freeze({
  "asOf": "2026-11-19",
  "windows": [
    7,
    30,
    90
  ],
  "total": [
    71,
    112,
    725
  ],
  "lenses": [
    {
      "key": "october",
      "counts": [
        0,
        5,
        7
      ],
      "example": "panel[october]{face.stack}<shelf>",
      "route": "/design/folios/october-2026/",
      "rising": false
    },
    {
      "key": "record",
      "counts": [
        0,
        2,
        4
      ],
      "example": "screenshot[record]{ask.offer.agreement.reference}",
      "route": "/",
      "rising": false
    },
    {
      "key": "direction",
      "counts": [
        2,
        2,
        3
      ],
      "example": "workbench[direction]{kernel.policy.slots}<align>",
      "route": "/projects/spw-workbench/",
      "rising": true
    },
    {
      "key": "instrument",
      "counts": [
        0,
        2,
        2
      ],
      "example": "room[instrument]{question;answer;screenshot}",
      "route": "/design/experiments/",
      "rising": false
    },
    {
      "key": "playable",
      "counts": [
        0,
        2,
        2
      ],
      "example": "library[playable]{role.artifact.evidence}",
      "route": "/",
      "rising": false
    },
    {
      "key": "preview",
      "counts": [
        0,
        2,
        2
      ],
      "example": "specimen[preview]{source,crop,caption,frame}",
      "route": "/design/cards/render/",
      "rising": false
    },
    {
      "key": "hook",
      "counts": [
        1,
        1,
        19
      ],
      "example": "tiktok[hook]{fan.subscriber}(live)<team>",
      "route": "/tiktok/",
      "rising": false
    },
    {
      "key": "live",
      "counts": [
        1,
        1,
        9
      ],
      "example": "tiktok[live]{heart.subscribe}(team)<entry>",
      "route": "/tiktok/",
      "rising": false
    },
    {
      "key": "atlas",
      "counts": [
        0,
        1,
        7
      ],
      "example": "operator[atlas]{prime;traverse;precipitate}(brace)<anchor>",
      "route": "/topics/software/spw/",
      "rising": false
    },
    {
      "key": "reading",
      "counts": [
        0,
        1,
        6
      ],
      "example": "math[reading]{picture.then.formalism}(turn)<paragraph>",
      "route": "/topics/math/",
      "rising": false
    }
  ],
  "projections": [
    {
      "key": "shelf",
      "counts": [
        1,
        6,
        7
      ],
      "example": "reader@topics{ question ~> neighbor }<shelf>",
      "route": "/topics/",
      "rising": false
    },
    {
      "key": "workbench",
      "counts": [
        3,
        4,
        4
      ],
      "example": "~prompt{ inspect; prime; rehearse }<workbench>",
      "route": "/",
      "rising": false
    },
    {
      "key": "align",
      "counts": [
        3,
        3,
        3
      ],
      "example": "kernel[separation]{seed.policy.tokens}<align>",
      "route": "/projects/spw-workbench/",
      "rising": true
    },
    {
      "key": "now",
      "counts": [
        2,
        2,
        7
      ],
      "example": "!dispatch(nov_19){ arrival; lenses; parser }<now>",
      "route": "/now/",
      "rising": true
    },
    {
      "key": "tradition",
      "counts": [
        2,
        2,
        5
      ],
      "example": "(production)season{ oct; nov; close }<tradition>",
      "route": "/now/",
      "rising": true
    },
    {
      "key": "handoff",
      "counts": [
        2,
        2,
        4
      ],
      "example": "workbench[backlog]{seed.cli.lsp.contracts}<handoff>",
      "route": "/projects/spw-workbench/",
      "rising": true
    },
    {
      "key": "studio",
      "counts": [
        1,
        2,
        3
      ],
      "example": "^making(table){ sheets, cards, prompts }<studio>",
      "route": "/play/",
      "rising": false
    },
    {
      "key": "atlas",
      "counts": [
        2,
        2,
        2
      ],
      "example": "?topics{ film, software, craft, math }<atlas>",
      "route": "/topics/",
      "rising": true
    },
    {
      "key": "audit",
      "counts": [
        2,
        2,
        2
      ],
      "example": "corpus[parse]{clean.error.degrade}<audit>",
      "route": "/projects/spw-workbench/",
      "rising": true
    },
    {
      "key": "lore",
      "counts": [
        1,
        2,
        2
      ],
      "example": "book(november){ chapters ~> 50000_moments }<lore>",
      "route": "/now/",
      "rising": false
    }
  ],
  "marks": [
    {
      "key": "~",
      "counts": [
        6,
        7,
        8
      ],
      "example": "~play(wednesday){ table; canon }<stage>",
      "route": "/play/",
      "rising": true
    },
    {
      "key": "^",
      "counts": [
        7,
        7,
        7
      ],
      "example": "^parser(browser){ source ~> tokens ~> ast }<exact>",
      "route": "/tools/spw-parser/",
      "rising": true
    },
    {
      "key": "@",
      "counts": [
        5,
        5,
        5
      ],
      "example": "@services{ scope, creator, systems, ecosystem }<lane>",
      "route": "/services/",
      "rising": true
    },
    {
      "key": "!",
      "counts": [
        3,
        3,
        3
      ],
      "example": "!parse{ source; tokens; ast; reconstruction }",
      "route": "/tools/spw-parser/",
      "rising": true
    },
    {
      "key": "?",
      "counts": [
        2,
        2,
        6
      ],
      "example": "?topics{ film, software, craft, math }<atlas>",
      "route": "/topics/",
      "rising": true
    },
    {
      "key": "*",
      "counts": [
        2,
        2,
        2
      ],
      "example": "*memory(campaign){ logs; pressure; canon }<recap>",
      "route": "/play/",
      "rising": true
    },
    {
      "key": "#>",
      "counts": [
        2,
        2,
        2
      ],
      "example": "#>home_frame{ software, art, spw }<atlas>",
      "route": "/",
      "rising": true
    }
  ],
  "subjects": [
    {
      "key": "workbench",
      "counts": [
        10,
        10,
        25
      ],
      "example": "workbench[backlog]{seed.cli.lsp.contracts}<handoff>",
      "route": "/projects/spw-workbench/",
      "rising": true
    },
    {
      "key": "folio",
      "counts": [
        0,
        7,
        33
      ],
      "example": "folio[ask]{card.reply}<studio>",
      "route": "/design/folios/october-2026/",
      "rising": false
    },
    {
      "key": "arrive",
      "counts": [
        0,
        4,
        4
      ],
      "example": "arrive[wednesday]{table.wonder}<pantry>",
      "route": "/town/",
      "rising": false
    },
    {
      "key": "tiktok",
      "counts": [
        4,
        4,
        4
      ],
      "example": "tiktok[subscriber]{recurring.back}(studio)<cycle>",
      "route": "/tiktok/",
      "rising": true
    },
    {
      "key": "practice",
      "counts": [
        2,
        3,
        31
      ],
      "example": "practice{ math, art, language } ~> <trace>",
      "route": "/now/",
      "rising": false
    },
    {
      "key": "card",
      "counts": [
        2,
        3,
        11
      ],
      "example": "card{ claim; state; evidence } ~> <next>",
      "route": "/cards/",
      "rising": false
    },
    {
      "key": "prompt",
      "counts": [
        1,
        3,
        3
      ],
      "example": "~prompt{ inspect; prime; rehearse }<workbench>",
      "route": "/",
      "rising": false
    },
    {
      "key": "studio",
      "counts": [
        2,
        3,
        3
      ],
      "example": "@studio{ briefs, prints, editions }",
      "route": "/",
      "rising": false
    },
    {
      "key": "play",
      "counts": [
        2,
        2,
        8
      ],
      "example": "~play(wednesday){ table; canon }<stage>",
      "route": "/play/",
      "rising": true
    },
    {
      "key": "season",
      "counts": [
        2,
        2,
        6
      ],
      "example": "(production)season{ oct; nov; close }<tradition>",
      "route": "/now/",
      "rising": true
    }
  ],
  "shapes": [
    {
      "key": "word[lens]{body}<point>",
      "counts": [
        14,
        26,
        259
      ],
      "example": "workbench[backlog]{seed.cli.lsp.contracts}<handoff>",
      "route": "/projects/spw-workbench/",
      "rising": false
    },
    {
      "key": "word[lens]{body}",
      "counts": [
        1,
        22,
        297
      ],
      "example": "runtime[inoculant]{portable;reversible;transparent}",
      "route": "/design/runtime/",
      "rising": false
    },
    {
      "key": "word[lens]{body}<point>(scene)",
      "counts": [
        6,
        13,
        83
      ],
      "example": "(live)stream[tiktok]{ fan, subscriber }<door>",
      "route": "/now/",
      "rising": false
    },
    {
      "key": "word{body}<point>",
      "counts": [
        8,
        8,
        8
      ],
      "example": "reader@topics{ question ~> neighbor }<shelf>",
      "route": "/topics/",
      "rising": true
    },
    {
      "key": "word{body}",
      "counts": [
        6,
        6,
        6
      ],
      "example": "bundle{ art, web, software } ~> <deliverable>",
      "route": "/services/",
      "rising": true
    },
    {
      "key": "word{body}<point>(scene)",
      "counts": [
        5,
        5,
        5
      ],
      "example": "(table)session{ joke ~> evidence }<canon>",
      "route": "/play/",
      "rising": true
    },
    {
      "key": "^word{body}<point>(scene)",
      "counts": [
        4,
        4,
        4
      ],
      "example": "^parser(browser){ source ~> tokens ~> ast }<exact>",
      "route": "/tools/spw-parser/",
      "rising": true
    },
    {
      "key": "~word{body}<point>",
      "counts": [
        3,
        3,
        3
      ],
      "example": "~prompt{ inspect; prime; rehearse }<workbench>",
      "route": "/",
      "rising": true
    },
    {
      "key": "?word{body}<point>",
      "counts": [
        2,
        2,
        5
      ],
      "example": "?topics{ film, software, craft, math }<atlas>",
      "route": "/topics/",
      "rising": true
    },
    {
      "key": "@word{body}",
      "counts": [
        2,
        2,
        2
      ],
      "example": "@studio{ briefs, prints, editions }",
      "route": "/",
      "rising": true
    }
  ]
});
