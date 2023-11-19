To create abbreviatedData.json, I fed esr_hiy_globalbest.csv into https://www.convertcsv.com/csv-to-json.htm and then ran this script using the output of that data:

```
allData = ...output from csv to json tool...

allData.forEach((x, i) => {
  if (latestCountryData[x.Country] == null || latestCountryData[x.Country].Year < x.Year) latestCountryData[x.Country] = x;
});
```

In the spirit of open-source, this conversion can be rewritten with a csv parser. But it didn't provide value for the hackathon to do that from scratch.
