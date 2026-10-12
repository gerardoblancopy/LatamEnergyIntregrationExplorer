# Project Setup and Deployment

This contains everything you need to run your app locally.



## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Set `VITE_CARTO_API_KEY` in [.env.local](.env.local) (and in the Vercel project's environment variables) to a [CARTO basemaps API key](https://carto.com/basemaps/apikey/). The map uses CARTO tiles, which show an "API KEY REQUIRED" watermark without it.
4. Run the app:
   `npm run dev`
