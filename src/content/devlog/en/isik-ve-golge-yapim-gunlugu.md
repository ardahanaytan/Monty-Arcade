---
title: "Light & Shadow"
description: "The story of Light & Shadow, a 20-level, two-player, one-keyboard game: where the idea came from, what we changed, how we tested it and where we got it wrong."
date: 2026-10-16T12:00:00
game: isik-ve-golge
draft: true
---

The biggest lesson from making Light & Shadow: **writing a good puzzle game is less about writing code and more about answering "can this level really be solved?"** In this post I'll tell you where the idea came from, the rules of the game, what I asked for and when I changed my mind, the bugs, and how we tested everything. I built the game together with Claude, level by level; the "we" below is that pair.

## The idea: two characters whose natures destroy each other

My first idea was completely different: **Eclipse**. Two characters named Sun and Moon, two players on one keyboard, ten levels. We wrote the plan and some code even got started. Then I changed my mind and deleted everything; I rolled the site back to the version before that game. The reason was simple: the idea had no central mechanic. "Two characters stand next to each other and something opens" wasn't interesting enough.

So I wrote a design document myself. It had a single sentence at its heart:

> Light destroys shadow. Two characters drawn to each other cannot touch, by their very nature.

That sentence produced all the rules:

- **Light** goes out when it falls into dark water. **Shadow** is destroyed when it enters a beam of light.
- Shadow can swim in water; Light is not affected by beams.
- Light passes through "light curtains", Shadow through "dark curtains". So neither can reach the exit unless the other opens the way.
- If the two get too close, a **spark** pushes them apart. If they collide at the right moment while running, that becomes a weapon, even a launcher: one can fling the other across a gap they could never cross alone.
- The story: the **Fog King** wants a grey world with neither light nor shadow. He sees the pull between the two as "contrast" and throws them into a dungeon.

There's not a single line of dialogue in the game. The story is told only at the beginning and the end, in wordless scenes.

## Movement feel: "jumping shouldn't depend on momentum this much"

In the first playable build the acceleration on the ground was great, but you had almost no control in the air; after jumping, the character was flung around by its own weight. When I said so, we raised air control significantly while keeping the momentum: you still go far when you jump while running, but you can correct your direction mid-air. Finding this balance mattered more than designing levels, because to design a "5-tile gap" you need to know exactly how far the character can jump. Those numbers (a jump of about 3.3 tiles, a longest solo leap of 5 tiles) became the ruler for all twenty levels.

## "Let's teach everything in the first levels"

At first I planned a slow pace, one new idea per level. Then I realised that in a 20-level game, introducing everything one by one makes the first half too slow. So we changed the plan:

- **Level 1:** movement, curtains, dark water, light beams (we merged the old levels 1 and 2).
- **Level 2:** lever, stone door, pressure plate.
- **Level 3:** the pushable box and the spark launch.
- **Level 4:** the lantern (Light lights it, Shadow puts it out) and the shadow of a box.
- **Level 5:** the exam of the dungeon region.

After that, every level brings one or two **new** things and **combines** the old ones: the lift, the fog pool (deadly to both), timed buttons, mirrors, box shadows, lever-rotated mirrors, light crystals, the scale, pushable mirrors... The last five levels (Freedom) are almost pure combination.

## 20 levels, 4 regions

| Region | Levels | Focus |
|---|---|---|
| Dungeon | 1–5 | basic rules, box, lantern |
| Courtyard | 6–10 | lift, fog, timed button, mirror |
| Rampart | 11–15 | rotating mirror, crystal, scale, pushable mirror |
| Freedom | 16–20 | combinations, long launch, final exam, meeting |

In the last level (Meeting) the two characters start at opposite ends of a long hall. Each one crosses the hazards on their own side and pulls a lever that opens **the other's door**, and then both reach the room in the middle. There, Light's door and Shadow's door stand **side by side**: a shared room, but each with their own door. The end of the difficulty the title promises: reaching each other.

## Difficulty: "the levels are too easy"

This is the most important lesson in this post. In the first levels everything was too easy and I said so plainly. I specifically asked for:

- Not a plain platformer: a **puzzle/platformer**.
- **Plenty of places to die, and a bit of confusion.**
- Levels shouldn't always start at the bottom and zigzag upwards; they should be **maze-like**, multi-floor.
- Difficulty in three directions: **puzzle depth**, **skill and precision**, **death and penalty**.

So what did we do?

- Timed light beams (they switch on and off and flicker just before turning on) and "beam gauntlets" you can only cross in the right window.
- Wider water and fog gaps, low-ceilinged passages.
- **AND doors**: a door that needs two plates pressed at once, or a plate and a lever used together. When a box holds the plate, the character can't reach the door in time, so cooperation becomes mandatory.
- A **different layout** for every new level: when I pointed out that levels 3 and 4 used the same pattern, we made a "layout pool" (hub and four rooms, vertical tower, ring, mirror-symmetric, plus-shaped, two-storey hall, staircase, twin towers, U-shape...) and made a rule never to repeat a pattern back to back.

When I disliked a level, I said it concretely: "This level doesn't need the box; we get through without putting it on the plate. Change it." To make the box mandatory we moved the plate away from the door: whoever holds the plate can't reach the door, so the box becomes necessary.

## How we tested: "is it solvable?"

The worst bug in a puzzle game is a **level that can't be solved**. It's hard to catch with human eyes, so we wrote tools:

1. **Unit tests:** physics and rules (jump height, water and fog, beams, doors, lever direction, mirrors, crystals, the scale...). They finish in seconds.
2. **A solver (BFS):** it plays the game with the real physics and the real key inputs and searches "can this character reach its door?". The search includes boxes, levers, lanterns, lifts and the other character's position.
3. **Scripted walkthroughs:** for two-character levels we write who does what and when, step by step (for example "Light pulls the lever, Shadow passes the door, Light pushes the box"). Every step searches from the current state of the game, and at the end **both characters must really stand at their doors**.
4. **Negative proofs:** "this character cannot finish alone" is a test too. Otherwise a level that is supposed to need cooperation could be solved by one person.
5. **A launch parameter scan:** the spark launch is about timing. A tool scans the exact positions and jump moments of Light and Shadow, finds the values that work and measures **how forgiving** they are. In level 5 the success rate was deliberately kept low (about 1.5 percent): on purpose, it's hard.

A lesson: at one point the full test of the third level took **70 minutes** and I waited for it. Since then heavy tests run in the background and the result is reported briefly.

## Bugs caught by tests (and by me while playing)

- **A door cell filled with wall:** I had accidentally filled the door cells of a divider with wall; even when the door opened, the passage was closed. The walkthrough caught it immediately.
- **Lever direction:** a lever tilts in the direction of whoever passes through it, **whoever it is**. When Shadow's return path crossed the lever, it pulled it back and the door closed. The fix: put the lever outside the characters' path, or make jumping over it on the way back part of the puzzle.
- **A mirror block hung too low:** we hung a mirror block from the corridor ceiling so low that the character couldn't pass under it. The character is 34 pixels tall, a tile is 32; you can't make a one-tile-high passage.
- **A spark accident:** walking east, Light ran into Shadow and flung it into a beam. The starting positions were separated.
- **A door you could jump over (found by me):** in level 12 the east door covered only the lower five rows and the lever shelf was at the same height as the door top; you could walk over the door without opening it. We extended the door to the ceiling, **scanned every door in every level** and found the same gap in levels 13 and 20.
- **Getting stuck in a wall (also found by me):** in level 19, riding the lift down teleported characters into the wall at the bottom right. The cause was subtle: when a character standing flush with a platform walked, the engine counted it as "hit from the side" and moved it to the platform's far end, which was a wall. We found it by writing a test that presses random keys.

After these two bugs I learned that **automated tests tell you a level is solvable, not that it can't be cheated.** A human always finds a new route.

## Performance

Around level 15 I noticed the game getting slower. My first suspicion was that old levels stayed open in the background. We checked: each level builds a new world and the old one is thrown away; memory stayed flat across twenty levels. The real cost was redrawing the whole scene every frame. What we did:

- Draw the wall tiles once per level to an off-screen canvas and stamp it as one image each frame.
- Cap the drawing resolution on very large screens.
- A diagnostic overlay (`?fps=1`) that shows the frame rate in the corner.

Result: better, no more slowdown.

## The opening and ending scenes

In the opening the **Fog King** sees the two lovers trying to touch each other; the spark throws them apart, the fog rolls in, the king raises his staff and the two fall through a hole in the ground into a barred dungeon cell. The screen fades and level 1 begins.

The ending is a **total eclipse**: the moon passes in front of the sun, the sky darkens and an orange ring burns on the horizon. This twilight is the only moment light doesn't destroy shadow. Light and Shadow walk towards each other on the rampart and **hold hands** for the first time; this time the spark doesn't throw them apart. The fog lifts. One word is left on the screen: "THE END".

Both are drawn entirely in code (no image files), contain no dialogue and can be skipped with ENTER.

## Small but important: level select and locks

The player always needed to see which level they're on; the top of the screen now says "LEVEL 12 / 20". The **B** key on the title screen or in the pause menu opens a 20-card level select. Finished levels show time, stardust and night feathers. Levels **unlock in order**: you must finish the previous level to play the next. For testers, `?unlock=1` opens all of them.

## By the numbers

- 20 levels, 4 regions, 2 players, 1 keyboard.
- About 5,800 lines of JavaScript (game code and tests together), all plain JS and Canvas; no dependencies. The game (fonts included) is under half a megabyte.
- Every level has at least one scripted, verified solution, and most have a "cannot be finished alone" proof.
- Five permanent test tools (unit tests, solver, scripted walkthrough, launch scan, debugging helper), plus a one-off test that presses random keys looking for wall clipping.

## Known gaps

- I did **not** automatically prove that every collectible (stardust and night feather) is reachable; the walkthroughs don't collect all of them. One may be unreachable, so tell me if you find it.
- In the scale levels (15 and 17), a box or character standing half on a pan's edge can sink 2–3 pixels into the floor when the pan descends. It corrects itself but it's a flaw; I tried a fix, it broke the scale levels, and I reverted it.
- The sound is simple chords and noise bursts for now. The music of the scenes needs another pass.
- There are no achievements; before adding them we need to talk about syncing them with the site.

## What's next?

Release: the game's site entry is still a draft; when it's ready we'll publish it with its cover and description. After that, as you play and say "this level was too easy" or "I got stuck here", we'll rework the levels one by one; that's how this game was made in the first place.

Find a friend and share a keyboard. One of you is the light, the other the shadow. Good luck.
