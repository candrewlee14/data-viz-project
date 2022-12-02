![cover photo](./static/images/cover_photo.jpg)

# Commerce Among Nations

A Bilateral Trade Data Visualization and Exploration Tool

Authors

* Andrew Lee

* Franklin Yuan

Links

- Project website: [Commerce Among Nations](https://candrewlee14.github.io/data-viz-project/)

- Screencast video: [Commerce Among Nations - Data Viz - YouTube](https://youtu.be/OXdyF8Prxyw)

- Data source: [Atlas of Economic Complexity Dataverse](https://dataverse.harvard.edu/dataverse/atlas)

## Project Structure

Directories and files that are worth mentioning:

```bash
data-viz-project/
├ src/
│ ├ components/
│ │ ├ BarChart.svelte
│ │ ├ LineChart.svelte
│ │ └ TreeMap.svelte
│ ├ global/
│ │ └ store.ts
│ ├ models/
│ │ └ models.ts
│ ├ routes/
│ │ └ +page.svelte
│ └ app.html
├ static/
│ └ data
└ python-scripts/
```

`src` contains our source files used to build the web application:

* `components/BarChart.svelte`  component builds `Trade Flow` diverging bar chart 

* `components/LineChart.svelte` component builds `Trade Over Time` bar-line chart

* `components/TreeMap.svelte` component builds the drill down treemap 

* `global/store.ts` stores all global `Writable` variables

* `models/models.ts` stores all data models

* `routes/page.svelte` component defines the main page of the web application  

`static` contains all static assets:

* `data`  contains all of the CSV files used by the visualization

`python-scripts` contains helper scripts used during data wrangling

## Data Sources



## Installation

## 

## How to View the App

Once you've installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of the app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.

# 

## Features

#### Bar-line Chart

### Diverging Bar Chart

#### Treemap Chart


