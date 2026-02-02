# 🏋️ Gympass Locations Map

Interactive map displaying Gympass gym facilities across America, filterable by plan tier.

## Features

- 🗺️ **Interactive Map** - Leaflet-based map with custom markers
- 🎯 **Plan Filtering** - Filter by 9 Gympass plan tiers (Starter → Titanium)
- 🔄 **Two Modes** - Cumulative (includes lower tiers) or Exclusive (single tier only)
- 📍 **Nationwide Coverage** - Scrapes 63 major US cities
- 🔄 **Daily Updates** - Automated daily scraping at 3 AM EST
- 💾 **Persistent Storage** - Data saved locally in JSON format

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run one-time scrape (single location)
npm run scrape

# Run nationwide scrape (all 63 cities)
npm run scrape:nationwide

# Start daily scheduler
npm run scheduler
```

## Environment Variables

Create a `.env` file:

```bash
GYMPASS_BEARER_TOKEN=your_token_here
GOOGLE_MAPS_API_KEY=your_google_maps_key_here
```

## Scripts

- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run scrape` - Scrape single location (NYC area)
- `npm run scrape:nationwide` - Scrape all 63 US cities
- `npm run scheduler` - Start daily automated scraping

## Production Deployment

### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start scheduler
pm2 start ecosystem.config.cjs

# View logs
pm2 logs

# Stop scheduler
pm2 stop gympass-scheduler
```

### Manual Scheduler

```bash
npm run scheduler
```

Keep the process running with a process manager or systemd service.

## Data Structure

Scraped data is stored in `/data/gympass-facilities.json`:

```json
{
  "facilities": [...],
  "lastUpdated": "2026-02-02T04:15:00.000Z",
  "totalCount": 181,
  "hasCoordinates": 181,
  "locationsScraped": 63
}
```

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Map**: Leaflet + React-Leaflet
- **Icons**: Lucide React
- **Backend**: Node.js + Axios
- **Scheduling**: node-cron
- **Geocoding**: Google Maps API

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
