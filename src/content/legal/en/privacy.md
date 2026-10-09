---
title: Privacy policy
description: What data Monty Arcade keeps, why, and where.
updated: 2026-10-09
---

Monty Arcade is an independent game site built personally by Ardahan Aytan. This page explains in plain words what
data is kept while you use the site. We collect as little as possible.

## Playing without an account

- You don't need an account to play, and nothing about you is stored on a server.
- Achievements you unlock this session stay only in your browser tab (`sessionStorage`). They're gone when you close the tab.
- Your language and sound preferences, and the games' own saves (e.g. best score), are kept in your browser
  (`localStorage`). They never leave your device; clearing your browser data removes them.

## With an account

When you sign in, the following is kept:

- **Account:** your email address and password. Your email is never shown anywhere. Your password is stored in
  Supabase as an irreversible hash; nobody, including me, can see it.
- **Profile:** the username you pick and the date you joined.
- **Achievements:** which achievement you unlocked in which game and when, the games you played, and the badges you put in your showcase.

**Your profile and achievements are public.** Your profile page (`/u/username`) can be seen by anyone, including
visitors who aren't signed in. Achievement rarity percentages are calculated from all players' data.

The sign-in token that keeps you logged in is stored in your browser (`localStorage`).

## Where is the data?

- **Supabase** (database and sign-in): data is stored in the European Union, on servers in Frankfurt.
- **Vercel** (hosting): the site is served by Vercel, which may keep standard access logs to run the service.
- **Email service:** account confirmation and password reset emails are sent through an email delivery service; it
  only sees your email address and the content of the email.

There are no ads, analytics or tracking cookies on the site. Your data is never sold or shared.

## Your rights

- **Deleting your account:** the "Delete my account" button on your profile page permanently deletes your account,
  profile and all achievements.
- If you have a question or request about your data (including access, correction and deletion rights under GDPR and
  Turkey's KVKK), reach me on [GitHub](https://github.com/ardahanaytan) or [LinkedIn](https://www.linkedin.com/in/ardahan-aytan).

## Children

The site is open to players of all ages, but since profiles are public we recommend younger players decide together
with an adult before signing up. Don't use your real name or personal details in your username.

## Changes

If this policy changes, the current version is published on this page and the date above is updated.
