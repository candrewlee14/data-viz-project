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

`src` contains the source files used to build the web application:

* `components/BarChart.svelte`  builds `Trade Flow` diverging bar chart 

* `components/LineChart.svelte` builds `Trade Over Time` bar-line chart

* `components/TreeMap.svelte` builds the drill down treemap 

* `global/store.ts` stores all of the global `Writable` variables

* `models/models.ts` stores all of the data models

* `routes/page.svelte` component builds the main page of the web application

`static` contains all static assets:

* `data`  contains all of the CSV files used by the visualization components

`python-scripts` contains helper scripts used during data wrangling

## Data Sources

## Installation

```bash
# install all dependencies
npm install

# start the server and open the app in a new browser tab
npm run dev -- --open
 
```

## Features

### Bar-line Chart



### Diverging Bar Chart

### 

### Treemap Chart
