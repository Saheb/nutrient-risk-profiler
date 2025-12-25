# Nutrient Risk Profiler

A web application to check the risk profile of food items, inspired by Yuka.

<div style="display: flex; gap: 10px; align-items: flex-start;">
  <img src="/public/screenshots/example-poor.png" alt="Poor Score Example" width="48%" />
  <img src="/public/screenshots/example-good.png" alt="Good Score Example" width="48%" />
</div>

## Features

- **Product Search**: Search for food items by name.
- **Risk Scoring**: Custom scoring algorithm based on nutritional values (Calories, Sugar, Fat, etc.).
- **Detailed Analysis**: View breakdown of nutrients and ingredients.
- **Premium Design**: Modern, responsive UI with smooth animations.

## Scoring Methodology

The Nutrient Risk Profiler calculates a health score from **0 (Poor)** to **100 (Excellent)** for each product. The algorithm is a simplified heuristic inspired by Nutri-Score, adapted to provide a clear risk assessment.

### How it Works
 
The score starts at a **Base of 100** and is adjusted based on the nutritional content per 100g:
 
#### 1. Negative Factors (Penalties)
Points are subtracted for nutrients that should be limited:
- **Energy (Calories)**: Linear penalty from 0 pts (300 kcal) to 40 pts (700 kcal).
- **Sugars**: Linear penalty from 0 pts (5g) to 70 pts (50g).
- **Total Fat**: Linear penalty from 0 pts (5g) to 30 pts (35g).
- **Saturated Fat**: Linear penalty from 0 pts (1g) to 50 pts (10g).
- **Sodium**: Linear penalty from 0 pts (0.2g) to 35 pts (2g).
- **Additives**: 1 point per additive + additional penalties for high-risk additives (e.g., Nitrites, Artificial Colors). Max penalty 40 pts.

> **Note**: If sugar content is high (> 30g), the Fruit/Vegetable bonus is disabled to prevent sugary snacks from scoring artificially high.
 
#### 2. Positive Factors (Bonuses)
Points are added for beneficial nutrients:
- **Fiber**: Up to +10 points (> 8g).
- **Protein**: Up to +15 points (> 15g).
- **Fruits, Vegetables, & Nuts**: Up to +15 points (> 80%).
 
#### 3. Final Score
The final score is calculated as `Base (100) - Penalties + Bonuses`, clamped between 0 and 100.
 
| Score Range | Risk Level | Color |
| :--- | :--- | :--- |
| **90 - 100** | Excellent | Dark Green |
| **70 - 89** | Good | Green |
| **40 - 69** | Moderate | Yellow |
| **20 - 39** | Poor | Red |
| **0 - 19** | Bad | Dark Red |

## How to Run

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Start Dev Server**:
    ```bash
    npm run dev:worker
    ```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Frontend-only dev server (port 5173) |
| `npm run dev:worker` | Full stack with Cloudflare Workers (port 8788) |
| `npm run dev:fresh` | Clear cache + start fresh dev server |
| `npm run cache:clear` | Clear server KV cache only |
| `npm run build` | Production build |
| `npm run test` | Run unit tests |

## Tech Stack

- React 19
- Vite
- TailwindCSS
- Cloudflare Workers (API proxy)
- OpenFoodFacts API

## API Rate Limits

OpenFoodFacts has rate limits to be aware of:

| Endpoint | Limit | Usage |
|----------|-------|-------|
| Product lookup (barcode) | 100 req/min | Barcode scans, pasting codes |
| Search | 10 req/min | Text search queries |

> **Tip**: Barcode scanning/pasting is preferred over text search for both accuracy and rate limits.
