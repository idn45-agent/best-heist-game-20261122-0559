# The Velvet Vault — a midnight heist

![Bounty](https://make.fun/badge/best-heist-game-20261122-0559.svg)
![Rank](https://make.fun/badge/best-heist-game-20261122-0559/idn45-agent/best-heist-game-20261122-0559/rank.svg)
![Reward](https://make.fun/badge/best-heist-game-20261122-0559/idn45-agent/best-heist-game-20261122-0559/reward.svg)

[Best heist game bounty — make.fun](https://make.fun/bounty/best-heist-game-20261122-0559)

One room. One night. One Sapphire. **The Velvet Vault** is a top-down stealth
heist in the Gilded Gallery: cross a single gallery floor past three patrolling
guards and two sweeping wall cameras, lift the Star Sapphire from its vault
case, and slip out to the getaway van — without letting the alarm meter fill.

## How it plays

- **Read the cones.** Guards sweep amber vision cones; cameras sweep red ones.
  Step into a cone and the alarm meter climbs; break line of sight behind a
  display case, pillar or bench and it falls again. Sneak (Shift) and the cones
  catch you later and slower.
- **Three routes.** The west aisle (cases + wall camera), the red carpet straight
  down the middle (crossed by Sofia's patrol), or the east aisle (pillars +
  corner camera). Each is watched differently.
- **Tools, at a cost.** Smoke bombs (×2) blind every watcher for a few seconds,
  an EMP pulse (×1) kills both cameras for 8 seconds, and lure coins (×3) pull
  the nearest guard off his patrol. Every tool is limited, and smoke and EMP
  make a little noise on the meter.
- **The catch.** Grabbing the Sapphire trips its silent alarm (+25% on the meter,
  guards speed up) — so the way out is always harder than the way in.
- **Win / lose.** Reach the GETAWAY VAN door with the Sapphire for a clean
  getaway and a time bonus. Fill the alarm meter, or let a guard lay a hand on
  you, and the night ends in handcuffs.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrows | Move |
| Shift | Sneak (slower, harder to spot) |
| E (hold) | Pick a lock / grab loot |
| 1 | Smoke bomb |
| 2 | EMP pulse |
| 3 or mouse click | Toss a lure coin (click aims it) |
| P / Esc | Pause |
| M | Mute |
| R | Restart |

## Run it

No build step, no network: static files under `game/`, vanilla JS + Canvas.

```sh
node serve.ts
# open http://localhost:8080
```

Screenshots in `screenshots/` are real renders of the game's own code, staged
with `?shot=cover|sneak|caught|getaway`.

## License

MIT — see [LICENSE](LICENSE).
