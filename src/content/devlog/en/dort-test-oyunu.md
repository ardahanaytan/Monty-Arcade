---
title: "The first four games: test tracks in disguise"
description: "Why I made Monty Chess, Helmet Dash, Lights Out and Pit Stop, and which part of the system each one put to the test."
date: 2026-10-12T10:00:00
---

There are four games on the site right now: **Monty Chess**, **Helmet Dash**, **Lights Out** and **Pit Stop**. They're all playable, and each one has its own achievements. But let me be honest: their main job wasn't to be fun. Their main job was to show whether the site's foundations actually work.

When you build a race car, you don't send it to a race on day one. You take it to a test track first. These four games were my test track.

## What was I testing?

While building the site, I set a lot of rules for games: a game opens inside an `iframe`, it only loads when you press "Click to play", it reads its language from the address (`?lang=tr` or `?lang=en`), it tells the site "I'm ready", it goes quiet when the site says "mute", and it lets the site know when an achievement unlocks. It all looked good on paper. But until a real game tried to follow those rules, I couldn't know if the rules were right.

So I picked each game to push on a different corner of the system.

## Monty Chess: the heavy load

The first game was deliberately the hardest one. Every chess rule is in: castling, en passant, promotion, stalemate, threefold repetition, the 50-move rule. Monty has three levels, and on Hard it runs a deep search.

What it tested:

- **Heavy computation:** so the page doesn't freeze while Monty thinks, the AI runs on a separate thread (a Web Worker). I wanted to see that work smoothly inside the player.
- **Every kind of input:** mouse, touch, drag and drop, and keyboard. This is where I found out whether the player's focus and keyboard setup held up in a real game.
- **Saving:** you can leave a game and continue it later.
- **The first achievement messages:** the "achievement unlocked" message between the game and the site was used here for the first time.

## Helmet Dash: real-time action

Helmet Dash replaced the placeholder test game I made at the very beginning. Monty runs down the track at sunset, jumping over cones and ducking under signs. There's a checkered gate every 500 meters, and after 800 meters the track turns to night.

What it tested:

- **Smoothness:** a game that redraws dozens of times a second and keeps speeding up, running inside the player without stuttering.
- **Playing on a phone:** tap to jump, tap the left edge to duck. Whether a mobile action game is actually playable on a touchscreen.
- **Fullscreen:** the game adjusting itself correctly when the screen size changes.

## Lights Out: one button, millisecond precision

Five red lights come on one by one, go out at a random moment, and that's when you press. Your reaction time is measured in milliseconds.

This one tested the system in its simplest form: one button, one screen, almost no graphics. The timing had to be reliable on both a keyboard and a touchscreen, or the time it measures would be meaningless. It was also a good place to try hidden achievements like the jump start.

## Pit Stop: sound and timing

You're the crew: jacks, four wheels, and release on green. At every step you have to catch a sweeping needle in the yellow zone.

Pit Stop pushed mostly on **sound**. In a game where sound really matters, I wanted to see whether the player's "Sound" button actually did its job.

## What broke on the test track?

The point of testing is for things to break, and they did:

- **The sound button:** if you opened a game with "Restart", it started with sound even when you had muted it. Now the game picks up the mute state from the site every time it starts. The button also shows its state: the icon changes when muted, the label reads "Sound off", and your choice is remembered in the browser.
- **Fullscreen on iPhone:** browsers on iPhone don't let a page make one part of itself fullscreen, so the button did nothing. Now the player covers the screen by itself in that case, with the game's name and an "Exit fullscreen" bar on top. The phone's back gesture closes it too.
- **A shared kit:** while making Helmet Dash, Lights Out and Pit Stop, I noticed I was writing the same things over and over (language, saving, site messages, pausing, sounds). I collected them into a small shared kit. Future games will start from that base.

Each of the four games is half a megabyte or smaller, so the "keep games small" rule got tested too.

## Achievements

Every game has six or seven achievements, and some of them are hidden until you unlock them. They were built into the games from the start, but they really come to life with the new account system. That gets its own post.

## What's next?

The test track did its job: the foundations hold, the player is solid, and there's a routine for making games. From here on, games won't be made for testing. They'll be made just to be played.

I'd still love for you to play these four. If you find a bug or have an idea, don't hesitate to reach out. 🏁
