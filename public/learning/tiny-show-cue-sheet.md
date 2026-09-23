# Tiny show — cue sheet

Name:
Date / version:
Purpose / audience:

Start at https://spwashi.com/curriculum/#tiny-show or use this sheet on paper.
You can enter at any question. Keep the parts that help your own project.

## 1. Decide what is allowed

Example rule: a cue may play only if it is available and known to be silent.
This is a rule for a fictional quiet room, not a complete event plan.

My rule:
One cue it admits, and why:
One cue it rejects, and why:
What happens if I replace “and” with “or”:

https://spwashi.com/topics/math/logic/#logic-try

## 2. Keep records separate from order

| Cue | Available? | Makes sound? |
| --- | --- | --- |
| bell | yes | yes |
| lantern | yes | no |
| ribbon | no | no |

Proposed order:
Record I changed, and why:
What to do if a cue name has no record:

https://spwashi.com/topics/software/data-structures/#cue-records

## 3. Count possibilities under stated assumptions

Number of cues available for counting:
Number of positions:
Does order matter?
Are repeats allowed?
My prediction:
The orders I listed:
Count after applying the quiet-room rule:

Example: with all three props available, two distinct cues have six orders.
Ignoring order gives three pairs. After excluding the noisy bell, the two
silent cues have two orders. These counts say nothing about audience preference.

https://spwashi.com/topics/math/combinatorics/#cue-orders

## 4. Trace the rule

```js
function canPlay(cue) {
  return cue.available === true && cue.sound === false;
}
```

Input cue record:
Result I predict:
Result I get:
One change to the input, and its effect:

The function assumes a cue object. Missing sound information is not permission.
The result approves a cue; it does not perform it.

https://spwashi.com/topics/software/programs/#programs-try

## 5. Try to expose a mistake

| Case | Expected | Observed | Rule version |
| --- | --- | --- | --- |
| Ready, silent lantern | true | | |
| Ready, noisy bell | false | | |
| Missing, silent ribbon | false | | |
| Ready prop with unknown sound status | false | | |

A failure I found:
My revision:
A case these checks do not cover:

https://spwashi.com/topics/software/testing/#cue-tests

## 6. Rehearse and hand off

My two-cue order:
When the second cue begins:
What I expect the order to suggest:
What another person actually did or noticed:
One instruction I changed after watching:

Keep interpretation separate from fact: “we preferred it” is different from
“both cues passed the rule.” Do not fill in an observation before rehearsing.

https://spwashi.com/play/#tiny-show-rehearsal

## 7. Use it elsewhere

New task (a recipe, lesson, scene, release, or something else):
What stays useful from this method:
Which assumption no longer holds:
What I would need to test again:
Where I filed this sheet / what I will search for:
Next revision:

https://spwashi.com/topics/andragogy/#transfer-a-practice
https://spwashi.com/topics/knowledge-bases/#keep-a-learning-record
