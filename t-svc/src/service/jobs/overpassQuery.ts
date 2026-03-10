// src/service/jobs/overpassQuery.ts

module.exports = (cityName: string) => `
[out:json][timeout:180];
area
  ["name"="${cityName}"]
  ["boundary"="administrative"]
  ["admin_level"~"8|9|10"];
(
  node["place"~"suburb|neighbourhood"](area);
);
out center;
`;