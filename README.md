# Renewable Energy Forecasting & Solar Analytics Dashboard

A responsive dashboard project for exploring renewable-energy data, forecasting solar energy values, comparing prediction routines, and visualizing energy trends.

## 🚀 Live Demo

**[Open Renewable Energy Dashboard](https://thezohaibkhan.github.io/renewable-energy-dashboard/)**

> The GitHub Pages demo is a standalone static showcase. It includes interactive charts and a CSV upload preview. It does not host the full Next.js application or its production services.

## ✨ Features

- **Renewable energy forecasting:** Analyze numeric solar/energy data and compare predicted values with original observations.
- **Solar power plant analytics:** Project UI includes solar plant data fields such as timestamps, source/inverter identifiers, DC power, AC power, daily yield, and total yield.
- **Dataset upload:** The Next.js application uses the `xlsx` package to process spreadsheet data. The static GitHub Pages demo accepts CSV files.
- **Model comparison:** The project contains in-browser prediction routines identified as PCA, Random Forest-style (`Rainforest` in the source), and RNN.
- **Interactive visualizations:** Line, bar, scatter, and histogram chart options.
- **Performance metrics:** MAE, RMSE, R², and accuracy-style metrics are shown by the application.
- **Responsive UI:** Built with reusable React components and a dashboard-focused interface.

## 🧰 Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Chart.js
- XLSX for spreadsheet parsing
- Reusable UI components and Lucide icons

## 📁 Project Structure

```text
.
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── home-section.tsx
│   ├── upload-section.tsx
│   ├── solar-upload-section.tsx
│   ├── dashboard-section.tsx
│   ├── solar-dashboard-section.tsx
│   └── processing-section.tsx
├── lib/
│   └── ml-models.ts
├── docs/
│   └── index.html        # Static GitHub Pages demo
├── package.json
└── README.md
```

## 💻 Run the Next.js application locally

### 1. Install Node.js

Install a current LTS version of Node.js.

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### 4. Create a production build

```bash
npm run build
npm run start
```

## 🌐 Publish the static demo on GitHub Pages

1. Add the `docs/index.html` file from this repository to the root-level `docs` folder.
2. Push or commit the changes to the `main` branch.
3. Open **Settings → Pages** in the GitHub repository.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select branch **`main`** and folder **`/docs`**, then click **Save**.
6. Wait for the Pages deployment to complete. The demo URL should be:

   `https://thezohaibkhan.github.io/renewable-energy-dashboard/`

If your actual GitHub repository has a different name, replace `renewable-energy-dashboard` in the URL with the repository name.

## 📄 Dataset notes

For the static demo, upload a CSV file with a header and at least three numeric values. A numeric column name containing `Solar energy`, `solar_energy`, `energy`, `power`, `yield`, or `generation` is easiest for the demo to detect. Uploaded data is processed in the browser and is not sent to a server.

The full Next.js application contains spreadsheet parsing and separate flows for renewable-energy data and solar plant data. Confirm the expected columns in the upload components before using a new dataset.

## ⚠️ Model and metric note

The source repository's `lib/ml-models.ts` contains JavaScript prediction routines. Do not assume the model names alone imply trained scientific models. For real-world reporting, validate the outputs on held-out observations and document the dataset, units, baseline, train/test procedure, and metric definitions.

## 🔒 Privacy

The static demo processes uploaded CSV content locally in the browser. Do not upload confidential or personally identifiable data to public demonstrations.

## 👤 Author

**TheZohaibKhan**

- GitHub: [@TheZohaibKhan](https://github.com/TheZohaibKhan)
- Repository: [renewable-energy-dashboard](https://github.com/TheZohaibKhan/renewable-energy-dashboard)
