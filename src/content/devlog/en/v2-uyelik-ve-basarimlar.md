---
title: "v2: Your driver's license is ready"
description: "Accounts, saved achievements and driver profiles are here. What's new and what changed in v2?"
date: 2026-10-12T18:00:00
---

In the welcome post I said "later on, accounts and profiles are coming too". That day is here: Monty Arcade's second major version is live. In short, you can now sign up, the achievements you unlock are saved to your account, and everyone gets their own **driver profile**.

But first, the most important part: **you still don't need an account to play.** The site is as open as ever: click and play.

## Accounts

There's now a **Sign in** button at the top right. Signing up takes three things:

- **A username:** this becomes your profile address. You see right away whether it's available. Once chosen it can't be changed, so think it over.
- **An email:** only for signing in and resetting your password. It never appears on your profile.
- **A password:** at least 8 characters, with uppercase and lowercase letters, a number and a symbol. A checklist shows which rules you've met as you type.

After signing up, you get a verification link by email; click it and your account is ready. If you forget your password, you can reset it with **Forgot password**.

> Emails are sent through a free service and the site doesn't have its own domain, so the verification email may land in your **spam folder**. If it doesn't show up, take a look there.

For now you can only sign in with email and password; there's no Google or GitHub sign-in.

## Achievements are yours now

The first four games had achievements built in from the start, but they weren't saved anywhere. Now, when you unlock an achievement, a notification pops up at the bottom right, and:

- **If you're signed in:** the achievement is written to your account with a "Saved to your profile" note. It's there on any device you sign in from.
- **If you're a guest:** the achievement still unlocks and you still see the notification, but it only lasts while that tab stays open. Close the tab and it's gone. A small badge at the top right shows how many achievements aren't saved.

That second part is a deliberate choice. The old flash sites had that "sign up or your progress won't be saved" feeling, and I took a bit of inspiration from it. But I didn't want to punish guests: **if you sign up or sign in in the same tab, everything you've unlocked so far moves to your account.** So you can play first and decide to sign up later without losing a thing.

The **Achievements** panel on each game page has come to life too:

- You can see which achievements you've unlocked and how many are left.
- Next to each achievement, you see what percentage of members who played that game have unlocked it. That's how you can tell which ones are really hard.
- Hidden achievements stay as "???" until you unlock them. Then they're revealed.

## Driver profiles

Every member has a public profile: `/en/u/yourusername`. It's designed like a **driver's license**:

- **License:** the date you joined, your total badges, your rare badges and the number of games you've played.
- **Showcase:** pick up to 6 of your favorite badges and put them at the top of your profile.
- **Progress:** how many achievements you've unlocked in each game.
- **Recently unlocked:** the badges you earned most recently.

You can share your profile with anyone. From your own profile you can sign out or delete your account.

## Your data

With accounts, the data the site keeps has changed too, so I added a **Privacy policy** and **Terms of use** page. You'll find both at the bottom of every page. In short:

- I only keep what's needed: your username, your email and the achievements you unlock.
- Your email is never shown to anyone; your profile only shows your username and badges.
- Pressing **Delete my account** permanently deletes your account, your profile and all your achievements.

## What changed?

- There's a **Sign in** button at the top right; once you're signed in, your username takes its place and links to your profile.
- The "Coming soon" box on the home page no longer teases profiles and badges (they're here). Now it teases the next game: **a new game drops every Friday**, and the box shows the date of the next one.
- Game cards show how many achievements each game has.
- The site is still fast. The account part doesn't hold up page loading; it loads in the background.

## Known gaps

v2 is a starting point, and a few things aren't there yet:

- You can't upload a profile picture.
- You can't change your email or username. You can only change your password through "Forgot password".
- Verification and password reset emails are in English only for now.
- Since achievements unlock in the browser, they could in theory be cheated. I've blocked the obvious tricks, but these are prestige badges only; there's no prize race. Please play fair. 🙂

## The technical side, briefly

The site is still fully static, meaning there's no code running on a server. For accounts and achievements I use a free database and authentication service, and the browser talks to it directly. Each user can only change their own data, and achievements can't be written directly; they're saved through special functions that run checks first. Setting this up is the part of the project where I've learned the most.

## What's next?

The foundations are done: games, achievements, profiles. From here on it's about more games. Every new game will come with its own achievements, and the showcase on your profile will keep growing.

Get your license and come to the pits. Your first badge is waiting. 🏁
