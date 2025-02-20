# PhaserJS Mario-Style Runner

This project is a simple runner game inspired by classic Mario mechanics, built in **Phaser 3**. It demonstrates:

- **Single level** with obstacles and gaps (falling results in losing a life).
- **Collectible coins** for gaining points.
- **Enemies** that can be killed by jumping on them, starting with 3 lives.
- **Loading levels** from a file and a **procedural level generator**.
- **Shooting bullets** when the player has enough lives.
- **Saving and loading** the game state and map (resume the exact state later).

## How to Run

1. **Install dependencies**:

   ```bash
   npm install
   npm run dev

You'll see a short demo showcasing:

- Level generation (different layouts each time).
- Player movement (left/right, jump).
- Shooting bullets if you have more than a certain number of lives.
- Collecting coins for points.
- Enemies moving around; jump on or shoot them.
- Saving/loading so you can return exactly where you left off.

[https://private-user-images.githubusercontent.com/9299185/415410959-50500bd5-832d-433b-9480-fa867b422b70.mp4?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NDAwOTM2MDYsIm5iZiI6MTc0MDA5MzMwNiwicGF0aCI6Ii85Mjk5MTg1LzQxNTQxMDk1OS01MDUwMGJkNS04MzJkLTQzM2ItOTQ4MC1mYTg2N2I0MjJiNzAubXA0P1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9QUtJQVZDT0RZTFNBNTNQUUs0WkElMkYyMDI1MDIyMCUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNTAyMjBUMjMxNTA2WiZYLUFtei1FeHBpcmVzPTMwMCZYLUFtei1TaWduYXR1cmU9NGMwNTEwYzljZDI2NzE2ZjdiNzQ2ZTRjNmJlYzVkNjcxMjI1MGZlMDQwZDUzN2RhOGVkOTRlODIzZjhjMzIyNiZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QifQ.AbLOc4RaC_xbXDZrYccPISEOdS2b0Dr1pGi6Yjh4Z3k](https://private-user-images.githubusercontent.com/9299185/415413244-8289e491-0800-4cbf-96e0-15f15a6091db.mp4?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NDAwOTQxMzYsIm5iZiI6MTc0MDA5MzgzNiwicGF0aCI6Ii85Mjk5MTg1LzQxNTQxMzI0NC04Mjg5ZTQ5MS0wODAwLTRjYmYtOTZlMC0xNWYxNWE2MDkxZGIubXA0P1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9QUtJQVZDT0RZTFNBNTNQUUs0WkElMkYyMDI1MDIyMCUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNTAyMjBUMjMyMzU2WiZYLUFtei1FeHBpcmVzPTMwMCZYLUFtei1TaWduYXR1cmU9ZGFiOWI0ZDhjYzhjMjdiNjAxNzA5MGYzNTczOGM4ZDAxMDJiZGQ3YTViMTlmNjU2ZDcwNDlhNTQ4MGIwY2IyYyZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QifQ.GO7y18GICPEHNPmXvLUivJx84Cj3JVaKH1pSkBy_MdI)


Assets
All sprites and images come from free asset websites - itch.io, used under their respective free licenses
