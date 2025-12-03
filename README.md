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
 
The score starts at a **Base of 90** and is adjusted based on the nutritional content per 100g:
 
#### 1. Negative Factors (Penalties)
Points are subtracted for nutrients that should be limited:
- **Energy (Calories)**: Up to -30 points for high caloric density (> 700 kcal).
- **Sugars**: Up to -30 points for high sugar content (> 40g).
- **Saturated Fat**: Up to -35 points for very high saturated fat (> 12g).
- **Sodium**: Up to -35 points for high sodium (> 2g).
- **Additives**: -3 points per additive (capped at -30 points).
 
#### 2. Positive Factors (Bonuses)
Points are added for beneficial nutrients:
- **Fiber**: Up to +10 points (> 8g).
- **Protein**: Up to +15 points (> 15g).
- **Fruits, Vegetables, & Nuts**: Up to +15 points (> 80%).
 
#### 3. Final Score
The final score is calculated as `Base (90) - Penalties + Bonuses`, clamped between 0 and 100.
 
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
    npm run dev
    ```

3.  **Open Browser**:
    Navigate to `http://localhost:5173`

## Tech Stack

- React
- Vite
- TailwindCSS
- OpenFoodFacts API

