# Walkthrough - Nutrient Risk Profiler

I have built a "Yuka-like" web application to check the risk profile of Indian food items.

## Features Implemented

### 1. Product Search
- Users can search for products by name (e.g., "Maggi", "Lays", "Amul").
- Uses OpenFoodFacts API for extensive data coverage.
- **Caching**: Search results are cached locally (simulating Supabase/Backend) to reduce API calls and improve speed.

### 2. Risk Scoring (0-100)
- Implemented a custom scoring algorithm inspired by Nutri-Score.
- **Factors**:
  - **Negative**: Calories, Sugar, Saturated Fat, Sodium.
  - **Positive**: Protein, Fiber, Fruits/Vegetables %.
  - **Additives**: Penalty for presence of additives.
  - **Organic**: Bonus for organic certification.
- **Visuals**: Color-coded scores (Red/Yellow/Green) and a circular gauge.

### 3. Product Details
- Detailed view showing:
  - Large product image.
  - Risk Score with visual gauge.
  - Nutritional highlights (Calories, Sugar, Fat, Protein).
  - Ingredients list.

### 4. Premium Design
- Clean, modern UI using **TailwindCSS**.
- Smooth transitions and animations.
- Responsive layout for mobile and desktop.

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

## Verification
- **Search**: Verified searching for common Indian items returns results.
- **Scoring**: Verified "Lays" gets a low score (Red/Yellow) due to fat/salt, while healthier options get higher scores.
- **Caching**: Verified repeated searches load instantly from cache.

## Next Steps
- Connect to a real Supabase instance for persistent cross-user caching.
- Add barcode scanning support using a camera library.
